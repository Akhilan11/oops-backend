/**
 * @module auth/validations/auth
 * @description Validation schemas for all auth request bodies.
 *   Used with the validate() middleware.
 */

const { OTP_PURPOSES } = require('../../utils/constants');

const sendOtpSchema = {
  email:   { required: true, type: 'string', match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, matchMessage: 'Invalid email format' },
  purpose: { required: true, type: 'string', enum: OTP_PURPOSES },
};

const verifyOtpSchema = {
  email:   { required: true, type: 'string' },
  otp:     { required: true, type: 'string', minLength: 6, maxLength: 6 },
  purpose: { required: true, type: 'string', enum: OTP_PURPOSES },
};

const signupSchema = {
  name:      { required: true, type: 'string', minLength: 1 },
  email:     { required: true, type: 'string', match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, matchMessage: 'Invalid email format' },
  password:  { required: true, type: 'string', minLength: 6 },
  tempToken: { required: true, type: 'string' },
};

const loginSchema = {
  email:    { required: true, type: 'string' },
  password: { required: true, type: 'string' },
};

const resetPasswordSchema = {
  email:       { required: true, type: 'string' },
  newPassword: { required: true, type: 'string', minLength: 6 },
  tempToken:   { required: true, type: 'string' },
};

const changePasswordSchema = {
  currentPassword: { required: true, type: 'string' },
  newPassword:     { required: true, type: 'string', minLength: 6 },
};

const updateProfileSchema = {
  name:   { type: 'string', minLength: 1 },
  phone:  { type: 'string' },
  dob:    { type: 'string' },
  gender: { type: 'string', enum: ['', 'male', 'female', 'other'] },
};

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
};
