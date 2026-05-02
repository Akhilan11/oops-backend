/**
 * @module product/routes/public
 * @description Public product routes (no auth required).
 */

const express = require('express');
const ctrl = require('../controllers/public.controller');

const router = express.Router();

router.get('/',    ctrl.list);
router.get('/:id', ctrl.detail);

module.exports = router;
