/**
 * @module product/services/product
 * @description CRUD operations + stock management for products.
 */

const Product = require('../models/Product');
const ApiError = require('../../utils/ApiError');

/**
 * List products for the public storefront.
 * @param {Object} query - { category?, status?, search?, page?, limit? }
 * @returns {Promise<{products: Array, total: number, page: number, totalPages: number}>}
 */
const listPublic = async (query) => {
  const { category, status, page = 1, limit: rawLimit = 20, search } = query;
  const limit = Math.min(parseInt(rawLimit) || 20, 100);
  const filter = {};
  if (category) filter.category = category;
  if (status)   filter.status = status;
  if (search)   filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const pageNum = parseInt(page) || 1;
  const skip = (pageNum - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  return { products, total, page: pageNum, totalPages: Math.ceil(total / limit) };
};

/**
 * Get a single product by ID, with related products populated.
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<Object>} Product document
 * @throws {ApiError} 404
 */
const getById = async (id) => {
  const product = await Product.findById(id).populate('related', 'name price image status');
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

/**
 * List ALL products for admin (includes every status).
 * @param {Object} query - { category?, status?, search?, page?, limit? }
 * @returns {Promise<{products: Array, total: number, page: number, totalPages: number}>}
 */
const listAll = async (query) => {
  const { page = 1, limit: rawLimit = 20, search, category, status } = query;
  const limit = Math.min(parseInt(rawLimit) || 20, 100);
  const filter = {};
  if (category) filter.category = category;
  if (status)   filter.status = status;
  if (search)   filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const pageNum = parseInt(page) || 1;
  const skip = (pageNum - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  return { products, total, page: pageNum, totalPages: Math.ceil(total / limit) };
};

/**
 * Create a new product.
 * @param {Object} data - Product fields
 * @returns {Promise<Object>} Created product document
 */
const create = async (data) => {
  const product = await Product.create(data);

  return product;
};

/**
 * Update an existing product.
 * @param {string} id
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated product
 * @throws {ApiError} 404
 */
const update = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');

  return product;
};

/**
 * Delete a product by ID.
 * @param {string} id
 * @throws {ApiError} 404
 */
const remove = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new ApiError(404, 'Product not found');

  return product;
};

/**
 * Replace stock values for a product.
 * @param {string} id
 * @param {Object} stockMap - e.g. { "S": 10, "M": 5, "L": 0 }
 * @returns {Promise<Object>} Updated product
 * @throws {ApiError} 404
 */
const updateStock = async (id, stockMap) => {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  for (const [size, qty] of Object.entries(stockMap)) {
    product.stock.set(size, qty);
  }
  await product.save();

  return product;
};

module.exports = { listPublic, getById, listAll, create, update, remove, updateStock };
