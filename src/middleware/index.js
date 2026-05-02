/**
 * @module middleware
 * @description Barrel export for all shared middleware.
 *
 *   Usage:
 *     const { verifyAccessToken, requireAdmin } = require('../middleware');
 *     const { apiLimiter, authLimiter }         = require('../middleware');
 *     const validate                             = require('../middleware').validate;
 *     const errorHandler                         = require('../middleware').errorHandler;
 */

const { verifyAccessToken, optionalAuth } = require('./auth/verifyToken');
const { requireAdmin }                    = require('./auth/requireAdmin');
const { authLimiter, otpLimiter, otpVerifyLimiter, apiLimiter, adminLimiter, uploadLimiter } = require('./security/rateLimiter');
const validate                             = require('./validation/validate');
const errorHandler                         = require('./error/errorHandler');

module.exports = {
  verifyAccessToken,
  optionalAuth,
  requireAdmin,
  authLimiter,
  otpLimiter,
  otpVerifyLimiter,
  apiLimiter,
  adminLimiter,
  uploadLimiter,
  validate,
  errorHandler,
};
