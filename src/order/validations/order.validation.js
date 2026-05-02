/**
 * @module order/validations/order
 * @description Validation schemas for order request bodies.
 */

const { PAYMENT_METHODS, ORDER_STATUSES } = require('../../utils/constants');

const placeOrderSchema = {
  items: {
    required: true,
    type: 'array',
    custom: (val) => {
      if (!Array.isArray(val) || val.length === 0) return 'At least one item is required';
      for (let i = 0; i < val.length; i++) {
        const item = val[i];
        if (!item.productId) return `items[${i}].productId is required`;
        if (!item.size)      return `items[${i}].size is required`;
        if (!item.qty || item.qty <= 0) return `items[${i}].qty must be greater than 0`;
      }
      return null;
    },
  },
  shipping: {
    required: true,
    custom: (val) => {
      if (!val || typeof val !== 'object') return 'shipping is required';
      if (!val.fullName) return 'shipping.fullName is required';
      if (!val.address1) return 'shipping.address1 is required';
      if (!val.city)     return 'shipping.city is required';
      if (!val.pincode)  return 'shipping.pincode is required';
      if (val.pincode && !/^\d{6}$/.test(val.pincode)) return 'Pincode must be 6 digits';
      if (val.phone && !/^\d{10}$/.test(val.phone))    return 'Phone must be 10 digits';
      return null;
    },
  },
  paymentMethod: { required: true, type: 'string', enum: PAYMENT_METHODS },
};

const advanceStatusSchema = {
  status: { required: true, type: 'string', enum: ORDER_STATUSES },
};

module.exports = { placeOrderSchema, advanceStatusSchema };
