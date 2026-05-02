/**
 * @module auth/routes/consumer
 * @description Consumer auth endpoints: OTP, signup, login, refresh, logout, profile.
 */

const express = require('express');
const { validate, verifyAccessToken, authLimiter, otpLimiter, otpVerifyLimiter } = require('../../middleware');
const ctrl = require('../controllers/consumer.controller');
const v = require('../validations/auth.validation');

const router = express.Router();

router.post('/send-otp',        otpLimiter,       validate(v.sendOtpSchema),        ctrl.sendOtp);
router.post('/verify-otp',      otpVerifyLimiter,  validate(v.verifyOtpSchema),       ctrl.verifyOtp);
router.post('/signup',          authLimiter,       validate(v.signupSchema),          ctrl.signup);
router.post('/login',           authLimiter,       validate(v.loginSchema),           ctrl.login);
router.post('/refresh',                                                               ctrl.refresh);
router.post('/logout',                                                                ctrl.logout);
router.post('/logout-all',      verifyAccessToken,                                    ctrl.logoutAll);
router.post('/reset-password',  authLimiter,       validate(v.resetPasswordSchema),   ctrl.resetPassword);
router.get('/me',               verifyAccessToken,                                    ctrl.getMe);
router.patch('/profile',        verifyAccessToken,  validate(v.updateProfileSchema),   ctrl.updateProfile);
router.post('/change-password', verifyAccessToken,  authLimiter, validate(v.changePasswordSchema), ctrl.changePassword);

module.exports = router;
