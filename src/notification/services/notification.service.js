/**
 * @module notification/services/notification
 * @description Email sending via Gmail OAuth2.
 *   Two channels:
 *     1. System emails (OTP, password reset) — from .env config
 *     2. Transactional emails (order status) — from admin settings (connected Gmail)
 *
 *   If credentials aren't configured, emails are logged to console instead.
 */

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const env = require('../../../config/env');
const logger = require('../../utils/logger');
const otpTemplate = require('../templates/otp.template');
const orderPlacedTemplate = require('../templates/order-placed.template');
const orderShippedTemplate = require('../templates/order-shipped.template');
const orderDeliveredTemplate = require('../templates/order-delivered.template');

const OAuth2 = google.auth.OAuth2;

/* ── Transporter factories ── */

/** Create a fresh system email transporter (from .env OAuth2 creds) */
const getSystemTransporter = async () => {
  if (!env.gmail.clientId || !env.gmail.clientSecret || !env.gmail.refreshToken) {
    logger.warn('Gmail OAuth2 not configured — OTP emails will be logged to console');
    return null;
  }

  const oauth2 = new OAuth2(env.gmail.clientId, env.gmail.clientSecret, 'https://developers.google.com/oauthplayground');
  oauth2.setCredentials({ refresh_token: env.gmail.refreshToken });
  const { token: accessToken } = await oauth2.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { type: 'OAuth2', user: env.gmail.from, clientId: env.gmail.clientId, clientSecret: env.gmail.clientSecret, refreshToken: env.gmail.refreshToken, accessToken },
  });
};

/** Create a transactional email transporter from admin-connected Gmail creds */
const getTransactionalTransporter = async (gmailConnection) => {
  if (!gmailConnection || !gmailConnection.refreshToken) return null;
  const oauth2 = new OAuth2(env.gmail.clientId, env.gmail.clientSecret, 'https://developers.google.com/oauthplayground');
  oauth2.setCredentials({ refresh_token: gmailConnection.refreshToken });
  const { token: accessToken } = await oauth2.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { type: 'OAuth2', user: gmailConnection.email, clientId: env.gmail.clientId, clientSecret: env.gmail.clientSecret, refreshToken: gmailConnection.refreshToken, accessToken },
  });
};

/* ── Send functions ── */

/**
 * Send an OTP email (system channel).
 * Falls back to console.log if transporter is unavailable.
 *
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit code (plain text, for display only)
 * @param {string} purpose - 'signup' | 'login' | 'reset-password' | 'admin-2fa'
 */
const sendOtpEmail = async (to, otp, purpose) => {
  const labels = { signup: 'Sign Up', login: 'Login', 'reset-password': 'Password Reset', 'admin-2fa': 'Admin Verification' };
  const subject = `OOPS - Your ${labels[purpose] || ''} OTP`;
  const html = otpTemplate(otp, labels[purpose] || purpose);

  const transporter = await getSystemTransporter();
  if (!transporter) {
    logger.info(`[EMAIL] OTP for ${to}: ${otp} (purpose: ${purpose})`);
    return;
  }
  await transporter.sendMail({ from: `"OOPS Fashion" <${env.gmail.from}>`, to, subject, html });
};

/**
 * Send an order status email (transactional channel).
 * Only sends if a transactional transporter is available.
 *
 * @param {Object} order - Mongoose order document
 * @param {string} status - 'placed' | 'shipped' | 'delivered'
 * @param {Object} gmailConnection - { email, refreshToken }
 */
const sendOrderEmail = async (order, status, gmailConnection) => {
  const transporter = await getTransactionalTransporter(gmailConnection);
  if (!transporter) {
    logger.info(`[EMAIL] Order ${order.orderId} status: ${status} (no transporter)`);
    return;
  }

  const templates = {
    placed:    { subject: `Order Confirmed - ${order.orderId}`, html: orderPlacedTemplate(order) },
    shipped:   { subject: `Order Shipped - ${order.orderId}`,   html: orderShippedTemplate(order) },
    delivered: { subject: `Order Delivered - ${order.orderId}`, html: orderDeliveredTemplate(order) },
  };

  const tpl = templates[status];
  if (!tpl) return;

  const to = order.shipping?.email || order.user?.email;
  if (!to) return;

  await transporter.sendMail({ from: `"OOPS Fashion" <${gmailConnection.email}>`, to, subject: tpl.subject, html: tpl.html });
};

module.exports = { sendOtpEmail, sendOrderEmail };
