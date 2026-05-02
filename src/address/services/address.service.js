/**
 * @module address/services/address
 * @description CRUD operations for saved addresses, with ownership enforcement.
 */

const Address = require('../models/Address');
const ApiError = require('../../utils/ApiError');

/**
 * List all saved addresses for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const list = async (userId) =>
  Address.find({ user: userId }).sort({ createdAt: -1 });

/**
 * Create a new address for a user.
 * @param {string} userId
 * @param {Object} data - { fullName, phone, address1, address2, city, state, pincode }
 * @returns {Promise<Object>} Created address
 */
const create = async (userId, data) =>
  Address.create({ ...data, user: userId });

/**
 * Update an address (with ownership check).
 * @param {string} id - Address ObjectId
 * @param {string} userId - Must match address.user
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated address
 * @throws {ApiError} 404 not found, 403 not owner
 */
const update = async (id, userId, data) => {
  const address = await Address.findById(id);
  if (!address) throw new ApiError(404, 'Address not found');
  if (address.user.toString() !== userId) throw new ApiError(403, 'Access denied');

  Object.assign(address, data);
  await address.save();
  return address;
};

/**
 * Delete an address (with ownership check).
 * @param {string} id - Address ObjectId
 * @param {string} userId - Must match address.user
 * @throws {ApiError} 404 not found, 403 not owner
 */
const remove = async (id, userId) => {
  const address = await Address.findById(id);
  if (!address) throw new ApiError(404, 'Address not found');
  if (address.user.toString() !== userId) throw new ApiError(403, 'Access denied');
  await Address.findByIdAndDelete(id);
};

module.exports = { list, create, update, remove };
