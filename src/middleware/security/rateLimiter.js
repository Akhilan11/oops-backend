/**
 * @module middleware/security/rateLimiter
 * @description Per-route rate limiters (in-memory store).
 *
 *   Limiter         | Window   | Max | Key
 *   ────────────────|──────────|─────|────────────
 *   authLimiter     | 15 min   | 10  | IP
 *   otpLimiter      | 10 min   |  3  | email
 *   otpVerifyLimiter|  5 min   |  5  | email
 *   apiLimiter      |  1 min   | 100 | IP
 *   adminLimiter    |  1 min   |  50 | IP
 *   uploadLimiter   |  1 min   |  10 | IP
 */

const rateLimit = require('express-rate-limit');

const createLimiter = (options) =>
  rateLimit({ standardHeaders: true, legacyHeaders: false, ...options });

/** Login, signup, password reset — 10 req / 15 min per IP */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, try again later' },
});

/** Send-OTP — 3 req / 10 min per email */
const otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body.email || req.ip,
  message: { success: false, message: 'Too many OTP requests, try again later' },
});

/** Verify-OTP — 5 req / 5 min per email */
const otpVerifyLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.email || req.ip,
  message: { success: false, message: 'Too many verification attempts, try again later' },
});

/** General API — 100 req / 1 min per IP */
const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, try again later' },
});

/** Admin routes — 50 req / 1 min per IP */
const adminLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many requests, try again later' },
});

/** File uploads — 10 req / 1 min per IP */
const uploadLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many upload requests, try again later' },
});

module.exports = { authLimiter, otpLimiter, otpVerifyLimiter, apiLimiter, adminLimiter, uploadLimiter };
