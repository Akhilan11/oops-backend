/**
 * @module order/models/Order
 * @description Order schema with embedded items, shipping, and status history.
 *   - Items snapshot product data at time of purchase.
 *   - StatusHistory tracks every transition with timestamp and admin who changed it.
 *   - Forward-only status transitions are enforced in the service layer.
 */

const mongoose = require('mongoose');
const { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } = require('../../utils/constants');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    qty:       { type: Number, required: true, min: 1 },
    size:      { type: String, required: true },
    image:     { type: String, default: '' },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone:    { type: String, default: '' },
    email:    { type: String, default: '' },
    address1: { type: String, required: true },
    address2: { type: String, default: '' },
    city:     { type: String, required: true },
    state:    { type: String, default: '' },
    pincode:  { type: String, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId:       { type: String, unique: true, required: true },
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items:         { type: [orderItemSchema], required: true },
    shipping:      { type: shippingSchema, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    subtotal:      { type: Number, required: true },
    codFee:        { type: Number, default: 0 },
    total:         { type: Number, required: true },
    status:        { type: String, enum: ORDER_STATUSES, default: 'placed' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    paymentId:     { type: String, default: null },
    paymentStatus: { type: String, enum: [...PAYMENT_STATUSES, null], default: null },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'shipping.phone': 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
