/**
 * @module auth/models/RefreshToken
 * @description Stores hashed refresh tokens for session management.
 *   - Tokens are SHA-256 hashed before storage.
 *   - TTL index on `expiresAt` auto-cleans expired sessions.
 *   - Index on `userId` supports "logout all devices".
 */

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
