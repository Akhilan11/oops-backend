/**
 * @module customer/services/customer
 * @description Customers derived from orders via aggregation pipeline.
 *   Not a separate collection — grouped by shipping.phone.
 */

const Order = require('../../order/models/Order');

/**
 * List customers with pagination and search.
 * Aggregates orders by phone number.
 *
 * @param {Object} query - { search?, sort?, page?, limit? }
 * @returns {Promise<{customers, total, page, totalPages}>}
 */
const listCustomers = async (query) => {
  const { search, sort = '-lastOrderDate', page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const matchStage = {};
  if (search) {
    matchStage.$or = [
      { 'shipping.fullName': { $regex: search, $options: 'i' } },
      { 'shipping.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortDir = sort.startsWith('-') ? -1 : 1;

  const pipeline = [
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id:           '$shipping.phone',
        name:          { $last: '$shipping.fullName' },
        phone:         { $first: '$shipping.phone' },
        totalSpent:    { $sum: '$total' },
        orderCount:    { $sum: 1 },
        lastOrderDate: { $max: '$createdAt' },
      },
    },
    { $sort: { [sortField]: sortDir } },
  ];

  const countPipeline = [...pipeline, { $count: 'total' }];
  const [countResult] = await Order.aggregate(countPipeline);
  const total = countResult?.total || 0;

  pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });
  const customers = await Order.aggregate(pipeline);

  return { customers, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
};

/**
 * Get a single customer's profile and order history by phone number.
 *
 * @param {string} phone - 10-digit phone number
 * @returns {Promise<{customer: Object|null, orders: Array}>}
 */
const getCustomerByPhone = async (phone) => {
  const [customer] = await Order.aggregate([
    { $match: { 'shipping.phone': phone } },
    {
      $group: {
        _id:           '$shipping.phone',
        name:          { $last: '$shipping.fullName' },
        phone:         { $first: '$shipping.phone' },
        totalSpent:    { $sum: '$total' },
        orderCount:    { $sum: 1 },
        lastOrderDate: { $max: '$createdAt' },
        addresses:     { $addToSet: '$shipping' },
      },
    },
  ]);

  const orders = await Order.find({ 'shipping.phone': phone })
    .sort({ createdAt: -1 })
    .select('orderId items total status createdAt paymentMethod');

  return { customer: customer || null, orders };
};

module.exports = { listCustomers, getCustomerByPhone };
