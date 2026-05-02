/**
 * @module order/controllers/consumer
 * @description Consumer order endpoints: place, list own, view own.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const orderService = require('../services/order.service');

/** POST /api/orders — Place a new order */
const placeOrder = asyncHandler(async (req, res) => {
  const { items, shipping, paymentMethod } = req.body;
  const order = await orderService.placeOrder({
    items, shipping, paymentMethod, userId: req.user.userId,
  });
  res.status(201).json(new ApiResponse(201, 'Order placed', { order }));
});

/** GET /api/orders — List current user's orders */
const listOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listByUser(req.user.userId, req.query);
  res.json(new ApiResponse(200, 'Orders', result));
});

/** GET /api/orders/:orderId — Single order (ownership check) */
const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getByOrderId(req.params.orderId, req.user.userId);
  res.json(new ApiResponse(200, 'Order detail', { order }));
});

module.exports = { placeOrder, listOrders, getOrder };
