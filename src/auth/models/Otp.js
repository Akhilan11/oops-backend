/**
 * @module auth/models/Otp
 * @description One-time password documents.
 *   - OTP codes are stored as bcrypt hashes (never plain text).
 *   - TTL index on `expiresAt` lets MongoDB auto-delete expired docs.
 *   - Compound index on { email, purpose } for fast lookup.
 */

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  otpHash:   { type: String, required: true },
  purpose:   { type: String, enum: ['signup', 'login', 'reset-password', 'admin-2fa'], required: true },
  attempts:  { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
