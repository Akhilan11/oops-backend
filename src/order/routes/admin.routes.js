/**
 * @module order/routes/admin
 * @description Admin order routes (requires auth + admin role).
 */

const express = require('express');
const { verifyAccessToken, requireAdmin, adminLimiter, validate } = require('../../middleware');
const ctrl = require('../controllers/admin.controller');
const { advanceStatusSchema } = require('../validations/order.validation');

const router = express.Router();
router.use(verifyAccessToken, requireAdmin, adminLimiter);

router.get('/',                     ctrl.listAll);
router.get('/:orderId',             ctrl.getOrder);
router.patch('/:orderId/status',    validate(advanceStatusSchema), ctrl.advanceStatus);

module.exports = router;
