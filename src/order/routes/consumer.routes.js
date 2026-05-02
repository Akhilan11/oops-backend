/**
 * @module order/routes/consumer
 * @description Consumer order routes (requires JWT auth).
 */

const express = require('express');
const { verifyAccessToken, validate } = require('../../middleware');
const ctrl = require('../controllers/consumer.controller');
const { placeOrderSchema } = require('../validations/order.validation');

const router = express.Router();
router.use(verifyAccessToken);

router.post('/',          validate(placeOrderSchema), ctrl.placeOrder);
router.get('/',           ctrl.listOrders);
router.get('/:orderId',   ctrl.getOrder);

module.exports = router;
