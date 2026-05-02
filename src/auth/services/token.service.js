/**
 * @module auth/services/token
 * @description JWT access-token & refresh-token lifecycle.
 *   - Access tokens are short-lived JWTs (15 min).
 *   - Refresh tokens are random 64-byte hex strings stored as SHA-256 hashes.
 *   - Temp tokens are single-use JWTs for OTP-verified flows (signup, reset).
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../../../config/env');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const ApiError = require('../../utils/ApiError');

/* ── Generation ── */

/**
 * Sign a JWT access token for the given user.
 * @param {Object} user - Mongoose user document (needs _id, role)
 * @returns {string} Signed JWT (15 min expiry by default)
 */
const generateAccessToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, type: 'access' },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );

/**
 * Sign a temporary JWT after OTP verification (signup / reset-password).
 * @param {string} email
 * @param {string} purpose - 'signup' | 'reset-password'
 * @returns {string} Signed JWT (10 min expiry by default)
 */
const generateTempToken = (email, purpose) =>
  jwt.sign(
    { email, purpose, type: 'temp' },
    env.jwt.tempSecret,
    { expiresIn: env.jwt.tempExpiresIn }
  );

/**
 * Verify and decode a temp token.
 * @param {string} token
 * @returns {Object} Decoded payload { email, purpose, type }
 * @throws JWT errors if expired or invalid
 */
const verifyTempToken = (token) => jwt.verify(token, env.jwt.tempSecret);

/**
 * Generate a cryptographically random refresh token (64 bytes hex).
 * @returns {string} 128-character hex string
 */
const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

/**
 * SHA-256 hash a refresh token for DB storage.
 * @param {string} token - Raw refresh token
 * @returns {string} Hex-encoded SHA-256 hash
 */
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/* ── Persistence ── */

/**
 * Store a hashed refresh token in the DB.
 * @param {string} userId  - Mongo ObjectId as string
 * @param {string} refreshToken - Raw (unhashed) refresh token
 * @param {string} userAgent
 */
const createRefreshTokenDoc = async (userId, refreshToken, userAgent) => {
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent,
  });
};

/**
 * Rotate a refresh token: consume old, issue new.
 * Implements theft detection — if the old token was already used,
 * all sessions for that user are revoked.
 *
 * @param {string} oldRefreshToken - Raw token from httpOnly cookie
 * @param {string} userAgent
 * @returns {Promise<{accessToken: string, refreshToken: string, user: Object}>}
 * @throws {ApiError} 401 on reuse (theft), expiry, or missing user
 */
const rotateRefreshToken = async (oldRefreshToken, userAgent) => {
  const oldHash = hashToken(oldRefreshToken);
  const tokenDoc = await RefreshToken.findOneAndDelete({ tokenHash: oldHash });

  if (!tokenDoc) {
    throw new ApiError(401, 'Token reuse detected, please login again');
  }
  if (tokenDoc.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token expired');
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user) throw new ApiError(401, 'User not found');

  const newRefresh = generateRefreshToken();
  const accessToken = generateAccessToken(user);
  await createRefreshTokenDoc(user._id, newRefresh, userAgent);

  return { accessToken, refreshToken: newRefresh, user };
};

/**
 * Delete a single refresh token (logout current device).
 * @param {string|undefined} refreshToken - Raw token from cookie
 */
const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
};

/**
 * Delete ALL refresh tokens for a user (logout all devices).
 * @param {string} userId
 */
const revokeAllUserTokens = async (userId) => {
  await RefreshToken.deleteMany({ userId });
};

module.exports = {
  generateAccessToken,
  generateTempToken,
  verifyTempToken,
  generateRefreshToken,
  createRefreshTokenDoc,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
