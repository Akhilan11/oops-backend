/**
 * @module product/routes/admin
 * @description Admin product routes (requires auth + admin role).
 */

const express = require('express');
const { verifyAccessToken, requireAdmin, adminLimiter, validate } = require('../../middleware');
const ctrl = require('../controllers/admin.controller');
const v = require('../validations/product.validation');

const router = express.Router();
router.use(verifyAccessToken, requireAdmin, adminLimiter);

router.get('/',              ctrl.listAll);
router.post('/',             validate(v.createProductSchema),  ctrl.create);
router.put('/:id',           validate(v.updateProductSchema),  ctrl.update);
router.delete('/:id',        ctrl.remove);
router.patch('/:id/stock',   validate(v.updateStockSchema),    ctrl.updateStock);

module.exports = router;
