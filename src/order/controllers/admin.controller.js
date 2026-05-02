/**
 * @module order/controllers/admin
 * @description Admin order endpoints: list all, view any, advance status.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const orderService = require('../services/order.service');

/** GET /api/admin/orders — List all orders with filters */
const listAll = asyncHandler(async (req, res) => {
  const result = await orderService.listAll(req.query);
  res.json(new ApiResponse(200, 'All orders', result));
});

/** GET /api/admin/orders/:orderId — Any order detail */
const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getAnyByOrderId(req.params.orderId);
  res.json(new ApiResponse(200, 'Order detail', { order }));
});

/** PATCH /api/admin/orders/:orderId/status — Advance status one step forward */
const advanceStatus = asyncHandler(async (req, res) => {
  const order = await orderService.advanceStatus(req.params.orderId, req.body.status, req.user.userId);
  res.json(new ApiResponse(200, 'Status updated', { order }));
});

module.exports = { listAll, getOrder, advanceStatus };
