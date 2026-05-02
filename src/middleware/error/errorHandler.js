/**
 * @module middleware/error/errorHandler
 * @description Global Express error handler.
 *   Catches every error in the middleware chain and normalizes
 *   it into a consistent { success, statusCode, message, errors? } response.
 *
 *   Handled error types:
 *     - ApiError (custom operational errors)
 *     - Mongoose ValidationError  → 400 with field-level details
 *     - Mongoose CastError        → 400 "Invalid ID format"
 *     - Mongoose 11000            → 409 "X already exists"
 *     - JWT TokenExpiredError     → 401 "Token expired"
 *     - JWT JsonWebTokenError     → 401 "Invalid token"
 *     - Multer LIMIT_FILE_SIZE    → 400 "File exceeds size limit"
 *     - Multer LIMIT_UNEXPECTED   → 400 "Too many files"
 *     - Unknown / programming     → 500 (stack logged, generic message to client)
 */

const logger = require('../../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message || 'Internal server error';
  let errors     = err.errors || [];

  /* ── Mongoose ValidationError ── */
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  /* ── Mongoose CastError (bad ObjectId) ── */
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  /* ── Mongoose duplicate key ── */
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  /* ── JWT errors ── */
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired'; }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }

  /* ── Multer errors ── */
  if (err.code === 'LIMIT_FILE_SIZE')      { statusCode = 400; message = 'File exceeds size limit'; }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') { statusCode = 400; message = 'Too many files'; }

  /* ── Unknown / programming errors ── */
  if (!err.isOperational && statusCode === 500) {
    logger.error('Unhandled error:', err.stack);
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors.length ? errors : undefined,
  });
};

module.exports = errorHandler;
