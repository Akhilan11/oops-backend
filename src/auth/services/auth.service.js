/**
 * @module auth/services/auth
 * @description High-level auth flows: signup, login, admin 2FA, password reset.
 *   Orchestrates token.service and otp.service for each flow.
 */

const User = require('../models/User');
const ApiError = require('../../utils/ApiError');
const tokenService = require('./token.service');
const otpService = require('./otp.service');

/* ── Consumer Signup ── */

/**
 * Complete a consumer signup after OTP verification.
 * Validates the temp token, creates the user, and issues tokens.
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.phone]
 * @param {string} params.tempToken - JWT issued after OTP verification
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
 * @throws {ApiError} 400 invalid token, 409 email taken
 */
const signup = async ({ name, email, password, phone, tempToken }) => {
  let decoded;
  try {
    decoded = tokenService.verifyTempToken(tempToken);
  } catch {
    throw new ApiError(400, 'Invalid or expired verification token');
  }
  if (decoded.email !== email || decoded.purpose !== 'signup' || decoded.type !== 'temp') {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    role: 'customer',
    isVerified: true,
  });

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken();
  await tokenService.createRefreshTokenDoc(user._id, refreshToken, '');

  return { user, accessToken, refreshToken };
};

/* ── Consumer Login (Password) ── */

/**
 * Authenticate a consumer via email + password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
 * @throws {ApiError} 401 bad credentials, 403 unverified email
 */
const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.isVerified) throw new ApiError(403, 'Please verify your email first');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken();
  await tokenService.createRefreshTokenDoc(user._id, refreshToken, '');

  return { user, accessToken, refreshToken };
};

/* ── Consumer Login (OTP — passwordless) ── */

/**
 * Complete an OTP-based login. Called after otp.service.verifyOtp succeeds.
 *
 * @param {string} email
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
 * @throws {ApiError} 404 account not found
 */
const otpLogin = async (email) => {
  const user = await User.findOne({ email, isVerified: true });
  if (!user) throw new ApiError(404, 'Account not found');

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken();
  await tokenService.createRefreshTokenDoc(user._id, refreshToken, '');

  return { user, accessToken, refreshToken };
};

/* ── Admin Login (2FA) ── */

/**
 * Admin login step 1: verify email + password, then send 2FA OTP.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{requiresOtp: true}>}
 * @throws {ApiError} 401 bad credentials
 */
const adminLogin = async (email, password) => {
  const user = await User.findOne({ email, role: 'admin' });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  await otpService.sendOtp(email, 'admin-2fa');
  return { requiresOtp: true };
};

/**
 * Admin login step 2: verify the 2FA OTP and issue tokens.
 *
 * @param {string} email
 * @param {string} otp - 6-digit code
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
 */
const adminVerifyOtp = async (email, otp) => {
  await otpService.verifyOtp(email, otp, 'admin-2fa');

  const user = await User.findOne({ email, role: 'admin' });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken();
  await tokenService.createRefreshTokenDoc(user._id, refreshToken, '');

  return { user, accessToken, refreshToken };
};

/* ── Password Management ── */

/**
 * Reset password using a temp token (issued after OTP verification).
 * Revokes all existing sessions so the user must re-login.
 *
 * @param {string} email
 * @param {string} newPassword
 * @param {string} tempToken
 * @throws {ApiError} 400 invalid token, 404 account not found
 */
const resetPassword = async (email, newPassword, tempToken) => {
  let decoded;
  try {
    decoded = tokenService.verifyTempToken(tempToken);
  } catch {
    throw new ApiError(400, 'Invalid or expired verification token');
  }
  if (decoded.email !== email || decoded.purpose !== 'reset-password' || decoded.type !== 'temp') {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'Account not found');

  user.password = newPassword;
  await user.save();
  await tokenService.revokeAllUserTokens(user._id);
};

/**
 * Change password for a logged-in user.
 * Verifies current password, then revokes all sessions.
 *
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @throws {ApiError} 400 wrong current password, 404 user not found
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const match = await user.comparePassword(currentPassword);
  if (!match) throw new ApiError(400, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  await tokenService.revokeAllUserTokens(userId);
};

module.exports = {
  signup,
  login,
  otpLogin,
  adminLogin,
  adminVerifyOtp,
  resetPassword,
  changePassword,
};
