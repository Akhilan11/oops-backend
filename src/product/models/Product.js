/**
 * @module product/models/Product
 * @description Product schema with stock Map, related products, and fabric details.
 *   - `stock` is a Map<string, number> keyed by size (e.g. { "S": 10, "M": 5 }).
 *   - `related` is an array of ObjectId refs to other Products.
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    shortDesc:   { type: String, default: '' },
    description: { type: String, default: '' },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, default: '' },
    status:      { type: String, enum: ['available', 'sold-out', 'coming-soon'], default: 'available' },
    sizes:       { type: [String], default: ['S', 'M', 'L', 'XL'] },
    image:       { type: String, default: '' },
    images:      { type: [String], default: [] },
    stock:       { type: Map, of: Number, default: {} },
    fabric: {
      composition: { type: String, default: '' },
      care:        { type: String, default: '' },
    },
    shipping: { type: String, default: 'Free shipping on prepaid orders. Delivery in 5-7 business days.' },
    related:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);
