/**
 * @module auth/models/User
 * @description Mongoose schema for application users (customer + admin).
 *   - Passwords are auto-hashed via pre-save hook (bcrypt, 12 rounds).
 *   - `toJSON` transform strips password and __v from API responses.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, index: true },
    password:    { type: String, required: true },
    phone:       { type: String, default: '' },
    dob:         { type: String, default: '' },
    gender:      { type: String, enum: ['', 'male', 'female', 'other'], default: '' },
    role:        { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isVerified:  { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

/* ── Hooks ── */

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ── Instance Methods ── */

/**
 * Compare a plain-text password against the stored hash.
 * @param {string} plain - The plain-text password to verify
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

/* ── JSON Transform ── */

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
