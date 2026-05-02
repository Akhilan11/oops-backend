/**
 * @module settings/services/settings
 * @description Gmail connection management and email trigger toggles.
 */

const Config = require('../models/Config');
const ApiError = require('../../utils/ApiError');

/* ── Connections ── */

/**
 * Get all connection statuses.
 * @returns {Promise<{gmail: Object|null}>}
 */
const getConnections = async () => {
  const doc = await Config.findOne({ key: 'gmail-connection' });
  return { gmail: doc?.value || null };
};

/**
 * Connect a Gmail account.
 * @param {Object} data - { email, refreshToken?, connectedAt? }
 * @returns {Promise<{email: string, connectedAt: Date}>}
 * @throws {ApiError} 400 if email missing
 */
const connectGmail = async (data) => {
  const { email, refreshToken, connectedAt } = data;
  if (!email) throw new ApiError(400, 'email is required');

  await Config.findOneAndUpdate(
    { key: 'gmail-connection' },
    { value: { email, refreshToken: refreshToken || null, connectedAt: connectedAt || new Date() } },
    { upsert: true, new: true }
  );

  return { email, connectedAt: connectedAt || new Date() };
};

/**
 * Disconnect Gmail.
 */
const disconnectGmail = async () => {
  await Config.findOneAndUpdate({ key: 'gmail-connection' }, { value: null }, { upsert: true });

};

/* ── Email Triggers ── */

/**
 * Get the current email trigger map.
 * @returns {Promise<Object>} e.g. { placed: true, shipped: true, delivered: true }
 */
const getEmailTriggers = async () => {
  const doc = await Config.findOne({ key: 'email-triggers' });
  return doc?.value || {};
};

/**
 * Replace the email trigger map.
 * @param {Object} triggers - Full trigger map
 * @returns {Promise<Object>} Saved triggers
 */
const updateEmailTriggers = async (triggers) => {
  await Config.findOneAndUpdate({ key: 'email-triggers' }, { value: triggers }, { upsert: true, new: true });

  return triggers;
};

module.exports = { getConnections, connectGmail, disconnectGmail, getEmailTriggers, updateEmailTriggers };
