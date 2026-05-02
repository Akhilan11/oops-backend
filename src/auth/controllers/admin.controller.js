/**
 * @module auth/controllers/admin
 * @description Admin-only auth endpoints: 2FA login flow.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const authService = require('../services/auth.service');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

/** POST /api/admin/auth/login — Verify password, send 2FA OTP */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.adminLogin(email, password);
  res.json(new ApiResponse(200, 'OTP sent for verification', result));
});

/** POST /api/admin/auth/verify-otp — Verify 2FA OTP, issue tokens */
const adminVerifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const { user, accessToken, refreshToken } = await authService.adminVerifyOtp(email, otp);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.json(new ApiResponse(200, 'Admin login successful', { user, accessToken }));
});

module.exports = { adminLogin, adminVerifyOtp };
