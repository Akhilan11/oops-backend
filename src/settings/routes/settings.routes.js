/**
 * @module settings/routes/settings
 * @description Admin settings routes (requires auth + admin).
 */

const express = require('express');
const { verifyAccessToken, requireAdmin, adminLimiter } = require('../../middleware');
const ctrl = require('../controllers/settings.controller');

const router = express.Router();
router.use(verifyAccessToken, requireAdmin, adminLimiter);

router.get('/connections',        ctrl.getConnections);
router.put('/connections/:id',    ctrl.connectService);
router.delete('/connections/:id', ctrl.disconnectService);
router.get('/email-triggers',     ctrl.getEmailTriggers);
router.put('/email-triggers',     ctrl.updateEmailTriggers);

module.exports = router;
