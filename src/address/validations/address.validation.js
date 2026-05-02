/**
 * @module address/validations/address
 * @description Validation schemas for address request bodies.
 */

const createAddressSchema = {
  fullName: { required: true, type: 'string', minLength: 1 },
  address1: { required: true, type: 'string', minLength: 1 },
  city:     { required: true, type: 'string', minLength: 1 },
  pincode:  { required: true, type: 'string', match: /^\d{6}$/, matchMessage: 'Pincode must be 6 digits' },
  phone:    { type: 'string', match: /^\d{10}$/, matchMessage: 'Phone must be 10 digits' },
};

const updateAddressSchema = {
  fullName: { type: 'string', minLength: 1 },
  address1: { type: 'string', minLength: 1 },
  city:     { type: 'string', minLength: 1 },
  pincode:  { type: 'string', match: /^\d{6}$/, matchMessage: 'Pincode must be 6 digits' },
  phone:    { type: 'string', match: /^\d{10}$/, matchMessage: 'Phone must be 10 digits' },
};

module.exports = { createAddressSchema, updateAddressSchema };
