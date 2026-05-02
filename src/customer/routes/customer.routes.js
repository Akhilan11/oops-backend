/**
 * @module customer/routes/customer
 * @description Admin-only customer routes.
 */

const express = require('express');
const { verifyAccessToken, requireAdmin, adminLimiter } = require('../../middleware');
const ctrl = require('../controllers/customer.controller');

const router = express.Router();
router.use(verifyAccessToken, requireAdmin, adminLimiter);

router.get('/',       ctrl.list);
router.get('/:phone', ctrl.getByPhone);

module.exports = router;
