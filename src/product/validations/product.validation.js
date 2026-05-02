/**
 * @module product/validations/product
 * @description Validation schemas for product request bodies.
 */

const { PRODUCT_STATUSES } = require('../../utils/constants');

const createProductSchema = {
  name:   { required: true, type: 'string', minLength: 1 },
  price:  { required: true, type: 'number', min: 0 },
  status: { type: 'string', enum: PRODUCT_STATUSES },
};

const updateProductSchema = {
  name:   { type: 'string', minLength: 1 },
  price:  { type: 'number', min: 0 },
  status: { type: 'string', enum: PRODUCT_STATUSES },
};

const updateStockSchema = {
  stock: {
    required: true,
    type: 'object',
    custom: (val) => {
      if (typeof val !== 'object' || val === null || Array.isArray(val)) return 'stock must be an object';
      for (const [, qty] of Object.entries(val)) {
        if (typeof qty !== 'number' || qty < 0) return 'stock values must be non-negative numbers';
      }
      return null;
    },
  },
};

module.exports = { createProductSchema, updateProductSchema, updateStockSchema };
