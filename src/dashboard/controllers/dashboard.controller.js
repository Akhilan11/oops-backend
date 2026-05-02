/**
 * @module dashboard/controllers/dashboard
 * @description Admin dashboard endpoints — all cached at 2-min TTL.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const svc = require('../services/dashboard.service');

/** GET /api/admin/dashboard/stats */
const getStats = asyncHandler(async (req, res) => {
  const stats = await svc.getStats(req.query.period);
  res.json(new ApiResponse(200, 'Dashboard stats', stats));
});

/** GET /api/admin/dashboard/revenue-by-day */
const getRevenueByDay = asyncHandler(async (req, res) => {
  const data = await svc.getRevenueByDay(req.query.period);
  res.json(new ApiResponse(200, 'Revenue by day', { data }));
});

/** GET /api/admin/dashboard/status-breakdown */
const getStatusBreakdown = asyncHandler(async (req, res) => {
  const data = await svc.getStatusBreakdown(req.query.period);
  res.json(new ApiResponse(200, 'Status breakdown', { data }));
});

/** GET /api/admin/dashboard/top-products */
const getTopProducts = asyncHandler(async (req, res) => {
  const data = await svc.getTopProducts(req.query.period, req.query.limit);
  res.json(new ApiResponse(200, 'Top products', { data }));
});

/** GET /api/admin/dashboard/recent-orders */
const getRecentOrders = asyncHandler(async (req, res) => {
  const data = await svc.getRecentOrders(req.query.limit);
  res.json(new ApiResponse(200, 'Recent orders', { data }));
});

module.exports = { getStats, getRevenueByDay, getStatusBreakdown, getTopProducts, getRecentOrders };
