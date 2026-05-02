/**
 * @module middleware/auth/requireAdmin
 * @description Enforce admin role.
 *   Must be used AFTER verifyAccessToken (so req.user is populated).
 */

const ApiError = require('../../utils/ApiError');

/**
 * Reject non-admin users with 403.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }
  next();
};

module.exports = { requireAdmin };
