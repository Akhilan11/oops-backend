/**
 * @module auth/controllers/consumer
 * @description Request handlers for consumer-facing auth endpoints:
 *   sendOtp, verifyOtp, signup, login, refresh, logout, profile, password.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const tokenService = require('../services/token.service');
const User = require('../models/User');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

/** POST /api/auth/send-otp — Send a 6-digit OTP to email */
const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;

  if (purpose === 'signup') {
    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered');
  }
  if (purpose === 'login') {
    const user = await User.findOne({ email, isVerified: true });
    if (!user) throw new ApiError(404, 'Account not found');
  }
  if (purpose === 'reset-password') {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'Account not found');
  }

  const { expiresIn } = await otpService.sendOtp(email, purpose);
  res.json(new ApiResponse(200, 'OTP sent', { expiresIn }));
});

/** POST /api/auth/verify-otp — Verify OTP, return tokens or tempToken */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, purpose } = req.body;

  await otpService.verifyOtp(email, otp, purpose);

  // For login: issue tokens directly
  if (purpose === 'login') {
    const { user, accessToken, refreshToken } = await authService.otpLogin(email);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return res.json(new ApiResponse(200, 'Login successful', { user, accessToken }));
  }

  // For signup / reset-password: return a temp token
  const tempToken = tokenService.generateTempToken(email, purpose);
  res.json(new ApiResponse(200, 'OTP verified', { verified: true, tempToken }));
});

/** POST /api/auth/signup — Complete signup with temp token */
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, tempToken } = req.body;
  const { user, accessToken, refreshToken } = await authService.signup({
    name, email, password, phone, tempToken,
  });
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.status(201).json(new ApiResponse(201, 'Account created', { user, accessToken }));
});

/** POST /api/auth/login — Password-based login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.json(new ApiResponse(200, 'Login successful', { user, accessToken }));
});

/** POST /api/auth/refresh — Rotate refresh token, issue new access token */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token');

  const userAgent = req.headers['user-agent'] || '';
  const { accessToken, refreshToken } = await tokenService.rotateRefreshToken(token, userAgent);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.json(new ApiResponse(200, 'Token refreshed', { accessToken }));
});

/** POST /api/auth/logout — Clear current session */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  await tokenService.revokeRefreshToken(token);
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json(new ApiResponse(200, 'Logged out'));
});

/** POST /api/auth/logout-all — Revoke all sessions for current user */
const logoutAll = asyncHandler(async (req, res) => {
  await tokenService.revokeAllUserTokens(req.user.userId);
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json(new ApiResponse(200, 'Logged out from all devices'));
});

/** POST /api/auth/reset-password — Set new password with temp token */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, tempToken } = req.body;
  await authService.resetPassword(email, newPassword, tempToken);
  res.json(new ApiResponse(200, 'Password reset successful'));
});

/** GET /api/auth/me — Return current user profile */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, 'Profile', { user }));
});

/** PATCH /api/auth/profile — Update profile fields */
const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'dob', 'gender'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, 'Profile updated', { user }));
});

/** POST /api/auth/change-password — Change password (requires current) */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.userId, currentPassword, newPassword);
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json(new ApiResponse(200, 'Password changed, please login again'));
});

module.exports = {
  sendOtp,
  verifyOtp,
  signup,
  login,
  refresh,
  logout,
  logoutAll,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
