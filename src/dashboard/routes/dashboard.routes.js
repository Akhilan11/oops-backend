/**
 * @module dashboard/routes/dashboard
 * @description Admin dashboard routes (requires auth + admin).
 */

const express = require('express');
const { verifyAccessToken, requireAdmin, adminLimiter } = require('../../middleware');
const ctrl = require('../controllers/dashboard.controller');

const router = express.Router();
router.use(verifyAccessToken, requireAdmin, adminLimiter);

router.get('/stats',            ctrl.getStats);
router.get('/revenue-by-day',   ctrl.getRevenueByDay);
router.get('/status-breakdown', ctrl.getStatusBreakdown);
router.get('/top-products',     ctrl.getTopProducts);
router.get('/recent-orders',    ctrl.getRecentOrders);

module.exports = router;
