/**
 * @module settings/models/Config
 * @description Key-value config store.
 *   Two documents:
 *     { key: 'email-triggers',   value: { placed: true, shipped: true, ... } }
 *     { key: 'gmail-connection', value: { email, refreshToken, connectedAt } | null }
 */

const mongoose = require('mongoose');

const configSchema = new mongoose.Schema(
  {
    key:   { type: String, unique: true, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Config', configSchema);
