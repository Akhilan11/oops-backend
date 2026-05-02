/**
 * @module address/routes/address
 * @description Consumer address routes (requires JWT auth).
 */

const express = require('express');
const { verifyAccessToken, validate } = require('../../middleware');
const ctrl = require('../controllers/address.controller');
const v = require('../validations/address.validation');

const router = express.Router();
router.use(verifyAccessToken);

router.get('/',       ctrl.list);
router.post('/',      validate(v.createAddressSchema), ctrl.create);
router.put('/:id',    validate(v.updateAddressSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
