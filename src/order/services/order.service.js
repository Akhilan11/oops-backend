/**
 * @module order/services/order
 * @description Core order business logic: place, list, status advancement.
 *   Uses stock.service for atomic deduction and notification.service for emails.
 */

const Order = require('../models/Order');
const Counter = require('../models/Counter');
const Product = require('../../product/models/Product');
const ApiError = require('../../utils/ApiError');
const { ORDER_STATUSES, COD_FEE } = require('../../utils/constants');
const { deductStock } = require('./stock.service');
const notificationService = require('../../notification/services/notification.service');
const logger = require('../../utils/logger');

/* ── Helpers ── */

/** Load email trigger config from settings */
const getEmailConfig = async () => {
  try {
    const Config = require('../../settings/models/Config');
    const [triggers, connection] = await Promise.all([
      Config.findOne({ key: 'email-triggers' }),
      Config.findOne({ key: 'gmail-connection' }),
    ]);
    return { triggers: triggers?.value || {}, gmailConnection: connection?.value || null };
  } catch {
    return { triggers: {}, gmailConnection: null };
  }
};

/** Check if an email trigger is enabled for a given status */
const shouldSendEmail = (triggers, status) =>
  triggers && typeof triggers === 'object' && !!triggers[status];

/* ── Place Order ── */

/**
 * Place a new order: validate items, re-fetch server prices, deduct stock, create doc.
 *
 * @param {Object} params
 * @param {Array}  params.items - [{ productId, size, qty }]
 * @param {Object} params.shipping - { fullName, phone, address1, city, pincode, ... }
 * @param {string} params.paymentMethod - 'prepaid' | 'cod'
 * @param {string} params.userId
 * @returns {Promise<Object>} Created order document
 * @throws {ApiError} 400 on validation / stock failure
 */
const placeOrder = async ({ items, shipping, paymentMethod, userId }) => {
  if (!items || items.length === 0) throw new ApiError(400, 'Items are required');

  // 1. Validate items & re-fetch prices from DB (ignore client prices)
  const orderItems = [];
  for (const item of items) {
    if (!item.productId || !item.size || !item.qty || item.qty <= 0) {
      throw new ApiError(400, 'Each item needs productId, size, and qty > 0');
    }
    const product = await Product.findById(item.productId);
    if (!product) throw new ApiError(400, 'Product not found');
    if (product.status !== 'available') throw new ApiError(400, `${product.name} is no longer available`);
    if (!product.sizes.includes(item.size)) throw new ApiError(400, `Size ${item.size} not available for ${product.name}`);

    orderItems.push({
      productId: product._id,
      name:  product.name,
      price: product.price,
      qty:   item.qty,
      size:  item.size,
      image: product.image || (product.images[0] || ''),
    });
  }

  // 2. Server-computed totals
  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const codFee = paymentMethod === 'cod' ? COD_FEE : 0;
  const total = subtotal + codFee;

  // 3. Atomic stock deduction (with auto-rollback on failure)
  await deductStock(orderItems);

  // 4. Generate order ID & create document
  const orderId = await Counter.getNextOrderId();
  const order = await Order.create({
    orderId,
    user: userId || null,
    items: orderItems,
    shipping,
    paymentMethod,
    subtotal,
    codFee,
    total,
    status: 'placed',
    statusHistory: [{ status: 'placed', changedAt: new Date() }],
  });

  // 5. Send email (async, non-blocking)
  getEmailConfig().then(({ triggers, gmailConnection }) => {
    if (shouldSendEmail(triggers, 'placed') && gmailConnection) {
      notificationService.sendOrderEmail(order, 'placed', gmailConnection).catch((err) => {
        logger.error(`Failed to send order-placed email: ${err.message}`);
      });
    }
  });



  return order;
};

/* ── Consumer Queries ── */

/**
 * List orders belonging to a specific user.
 * @param {string} userId
 * @param {Object} query - { page?, limit? }
 * @returns {Promise<{orders, total, page, totalPages}>}
 */
const listByUser = async (userId, query) => {
  const { page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [orders, total] = await Promise.all([
    Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Order.countDocuments({ user: userId }),
  ]);
  return { orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Get a single order by orderId, with consumer ownership check.
 * @param {string} orderId - e.g. "OOPS-000001"
 * @param {string} userId - Logged-in user's ID (ownership guard)
 * @returns {Promise<Object>}
 * @throws {ApiError} 404 not found, 403 not owner
 */
const getByOrderId = async (orderId, userId) => {
  const order = await Order.findOne({ orderId });
  if (!order) throw new ApiError(404, 'Order not found');
  if (userId && order.user && order.user.toString() !== userId) {
    throw new ApiError(403, 'Access denied');
  }
  return order;
};

/* ── Admin Queries ── */

/**
 * List all orders with filters (admin).
 * @param {Object} query - { status?, search?, page?, limit?, sort? }
 * @returns {Promise<{orders, total, page, totalPages}>}
 */
const listAll = async (query) => {
  const { status, search, page = 1, limit = 20, sort = '-createdAt' } = query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { 'shipping.fullName': { $regex: search, $options: 'i' } },
      { 'shipping.phone': { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
    Order.countDocuments(filter),
  ]);
  return { orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Get any order by orderId (admin — no ownership check).
 * @param {string} orderId
 * @returns {Promise<Object>}
 * @throws {ApiError} 404
 */
const getAnyByOrderId = async (orderId) => {
  const order = await Order.findOne({ orderId });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};

/* ── Status Advancement ── */

/**
 * Advance an order's status one step forward.
 * Validates forward-only and single-step constraints.
 *
 * @param {string} orderId
 * @param {string} newStatus - Target status
 * @param {string} adminUserId - Admin who triggered the change
 * @returns {Promise<Object>} Updated order
 * @throws {ApiError} 400 invalid transition, 404 not found
 */
const advanceStatus = async (orderId, newStatus, adminUserId) => {
  const order = await Order.findOne({ orderId });
  if (!order) throw new ApiError(404, 'Order not found');

  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  const newIdx = ORDER_STATUSES.indexOf(newStatus);

  if (newIdx < 0)            throw new ApiError(400, `Invalid status: ${newStatus}`);
  if (newIdx === currentIdx) throw new ApiError(400, `Order is already ${newStatus}`);
  if (newIdx < currentIdx)   throw new ApiError(400, 'Cannot revert order status');
  if (newIdx !== currentIdx + 1) throw new ApiError(400, 'Must advance one step at a time');

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, changedAt: new Date(), changedBy: adminUserId });
  await order.save();

  // Send email (async, non-blocking)
  getEmailConfig().then(({ triggers, gmailConnection }) => {
    if (shouldSendEmail(triggers, newStatus) && gmailConnection) {
      notificationService.sendOrderEmail(order, newStatus, gmailConnection).catch((err) => {
        logger.error(`Failed to send order-${newStatus} email: ${err.message}`);
      });
    }
  });


  return order;
};

module.exports = { placeOrder, listByUser, getByOrderId, listAll, getAnyByOrderId, advanceStatus };
