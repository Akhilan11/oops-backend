/**
 * @module middleware/auth/verifyToken
 * @description JWT access-token verification middleware.
 *   Extracts the Bearer token from the Authorization header,
 *   verifies it, and populates req.user with { userId, role }.
 */

const jwt = require('jsonwebtoken');
const env = require('../../../config/env');
const ApiError = require('../../utils/ApiError');

/**
 * Require a valid access token.
 * Rejects with 401 if missing, expired, or invalid.
 * On success, sets `req.user = { userId, role }`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyAccessToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    if (decoded.type !== 'access') {
      throw new ApiError(401, 'Invalid token');
    }
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw err; // JWT-specific errors handled by global error handler
  }
};

/**
 * Optionally attach user info if a valid token is present.
 * Never rejects — if the token is missing or invalid, continues without auth.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    if (decoded.type === 'access') {
      req.user = { userId: decoded.userId, role: decoded.role };
    }
  } catch {
    // Invalid token — continue without auth
  }
  next();
};

module.exports = { verifyAccessToken, optionalAuth };
