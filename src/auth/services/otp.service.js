/**
 * @module auth/services/otp
 * @description OTP generation, hashing, verification, and email dispatch.
 *   - OTPs are 6-digit numbers, bcrypt-hashed before storage.
 *   - Max 5 verification attempts per OTP.
 *   - Expired OTPs are auto-deleted by MongoDB TTL index.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');
const ApiError = require('../../utils/ApiError');
const { MAX_OTP_ATTEMPTS, OTP_EXPIRY_MINUTES } = require('../../utils/constants');
const notificationService = require('../../notification/services/notification.service');
const logger = require('../../utils/logger');

/**
 * Generate an OTP, store its hash, and email it to the user.
 * Any existing OTP for the same email + purpose is replaced.
 *
 * @param {string} email - Recipient email
 * @param {string} purpose - 'signup' | 'login' | 'reset-password' | 'admin-2fa'
 * @returns {Promise<{expiresIn: number}>} Seconds until expiry
 */
const sendOtp = async (email, purpose) => {
  await Otp.deleteMany({ email, purpose });

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otpCode, 10);

  await Otp.create({
    email,
    otpHash,
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  // Fire-and-forget — never block the API response
  notificationService.sendOtpEmail(email, otpCode, purpose).catch((err) => {
    logger.error(`Failed to send OTP email to ${email}: ${err.message}`);
  });

  return { expiresIn: OTP_EXPIRY_MINUTES * 60 };
};

/**
 * Verify a user-submitted OTP against the stored hash.
 *
 * @param {string} email
 * @param {string} otp - 6-digit code entered by user
 * @param {string} purpose
 * @returns {Promise<true>} Resolves true on success
 * @throws {ApiError} 400 expired / invalid, 429 too many attempts
 */
const verifyOtp = async (email, otp, purpose) => {
  const otpDoc = await Otp.findOne({
    email,
    purpose,
    expiresAt: { $gt: new Date() },
  });

  if (!otpDoc) {
    throw new ApiError(400, 'OTP expired, request a new one');
  }

  if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new ApiError(429, 'Too many failed attempts, request a new OTP');
  }

  otpDoc.attempts += 1;
  await otpDoc.save();

  const isValid = await bcrypt.compare(otp, otpDoc.otpHash);
  if (!isValid) {
    const remaining = MAX_OTP_ATTEMPTS - otpDoc.attempts;
    throw new ApiError(400, `Invalid OTP, ${remaining} attempt(s) left`);
  }

  await Otp.deleteOne({ _id: otpDoc._id });
  return true;
};

module.exports = { sendOtp, verifyOtp };
