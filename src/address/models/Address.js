/**
 * @module address/models/Address
 * @description Saved shipping addresses for consumers.
 *   Indexed by user for fast retrieval.
 */

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: { type: String, required: true },
    phone:    { type: String, default: '' },
    address1: { type: String, required: true },
    address2: { type: String, default: '' },
    city:     { type: String, required: true },
    state:    { type: String, default: '' },
    pincode:  { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema);
