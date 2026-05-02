/**
 * @module dashboard/services/dashboard
 * @description MongoDB aggregation pipelines for admin dashboard.
 *   Replaces the localStorage-based functions from admin frontend:
 *   computeDashboardStats, computeRevenueByDay, computeOrderStatusBreakdown,
 *   computeTopProducts.
 */

const Order = require('../../order/models/Order');
const Product = require('../../product/models/Product');

/** Build a { $gte, $lte } date range from a period string */
const getDateRange = (period) => {
  const now = new Date();
  let start;
  switch (period) {
    case 'week':  start = new Date(now); start.setDate(start.getDate() - 7); break;
    case 'year':  start = new Date(now); start.setFullYear(start.getFullYear() - 1); break;
    case 'all':   start = new Date(0); break;
    case 'month':
    default:      start = new Date(now); start.setMonth(start.getMonth() - 1); break;
  }
  return { $gte: start, $lte: now };
};

/**
 * Aggregate headline stats: revenue, orders, avg value, customers, sold-out count.
 * @param {string} [period='month'] - 'week' | 'month' | 'year' | 'all'
 * @returns {Promise<Object>}
 */
const getStats = async (period = 'month') => {
  const dateRange = getDateRange(period);

  const [result] = await Order.aggregate([
    { $match: { createdAt: dateRange } },
    { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 }, avgOrderValue: { $avg: '$total' } } },
  ]);

  const totalCustomers = await Order.distinct('shipping.phone', { createdAt: dateRange });
  const soldOutProducts = await Product.countDocuments({ status: 'sold-out' });

  return {
    totalRevenue:    result?.totalRevenue || 0,
    totalOrders:     result?.totalOrders || 0,
    avgOrderValue:   Math.round((result?.avgOrderValue || 0) * 100) / 100,
    totalCustomers:  totalCustomers.length,
    soldOutProducts,
  };
};

/**
 * Revenue grouped by day (for chart display).
 * @param {string} [period='month']
 * @returns {Promise<Array<{label: string, revenue: number}>>}
 */
const getRevenueByDay = async (period = 'month') => {
  const dateRange = getDateRange(period);
  return Order.aggregate([
    { $match: { createdAt: dateRange } },
    { $group: { _id: { $dateToString: { format: '%d %b', date: '$createdAt' } }, revenue: { $sum: '$total' }, date: { $first: '$createdAt' } } },
    { $sort: { date: 1 } },
    { $project: { _id: 0, label: '$_id', revenue: 1 } },
  ]);
};

/**
 * Order count grouped by status (for pie/donut chart).
 * @param {string} [period='month']
 * @returns {Promise<Array<{status: string, count: number}>>}
 */
const getStatusBreakdown = async (period = 'month') => {
  const dateRange = getDateRange(period);
  return Order.aggregate([
    { $match: { createdAt: dateRange } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);
};

/**
 * Top-selling products by revenue.
 * @param {string} [period='month']
 * @param {number} [limit=5]
 * @returns {Promise<Array<{name: string, revenue: number, unitsSold: number}>>}
 */
const getTopProducts = async (period = 'month', limit = 5) => {
  const dateRange = getDateRange(period);
  return Order.aggregate([
    { $match: { createdAt: dateRange } },
    { $unwind: '$items' },
    { $group: { _id: '$items.name', revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } }, unitsSold: { $sum: '$items.qty' } } },
    { $sort: { revenue: -1 } },
    { $limit: parseInt(limit) },
    { $project: { _id: 0, name: '$_id', revenue: 1, unitsSold: 1 } },
  ]);
};

/**
 * Most recent orders (for dashboard table).
 * @param {number} [limit=5]
 * @returns {Promise<Array>}
 */
const getRecentOrders = async (limit = 5) =>
  Order.find()
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('orderId shipping.fullName total status createdAt items');

module.exports = { getStats, getRevenueByDay, getStatusBreakdown, getTopProducts, getRecentOrders };
