/**
 * @module order/models/Counter
 * @description Atomic counter for generating sequential order IDs.
 *   Uses findOneAndUpdate with $inc to guarantee uniqueness
 *   even under concurrent requests.
 *
 *   Format: OOPS-XXXXXX (base-36, zero-padded)
 */

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name:  { type: String, unique: true, required: true },
  value: { type: Number, default: 0 },
});

/**
 * Atomically increment the counter and return the next order ID.
 * @returns {Promise<string>} e.g. "OOPS-00001A"
 */
counterSchema.statics.getNextOrderId = async function () {
  const counter = await this.findOneAndUpdate(
    { name: 'orderId' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return 'OOPS-' + counter.value.toString(36).toUpperCase().padStart(6, '0');
};

module.exports = mongoose.model('Counter', counterSchema);
