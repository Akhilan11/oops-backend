/**
 * @module auth/routes/admin
 * @description Admin auth endpoints: 2FA login flow.
 */

const express = require('express');
const { validate, authLimiter, otpVerifyLimiter } = require('../../middleware');
const ctrl = require('../controllers/admin.controller');
const { loginSchema } = require('../validations/auth.validation');

const router = express.Router();

router.post('/login',      authLimiter,       validate(loginSchema), ctrl.adminLogin);
router.post('/verify-otp', otpVerifyLimiter,                         ctrl.adminVerifyOtp);

module.exports = router;
