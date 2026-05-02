/**
 * @module product/controllers/admin
 * @description Admin product endpoints: CRUD + stock management.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const productService = require('../services/product.service');

/** GET /api/admin/products — All products (any status) */
const listAll = asyncHandler(async (req, res) => {
  const result = await productService.listAll(req.query);
  res.json(new ApiResponse(200, 'All products', result));
});

/** POST /api/admin/products — Create product */
const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json(new ApiResponse(201, 'Product created', { product }));
});

/** PUT /api/admin/products/:id — Update product */
const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  res.json(new ApiResponse(200, 'Product updated', { product }));
});

/** DELETE /api/admin/products/:id — Delete product */
const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  res.json(new ApiResponse(200, 'Product deleted'));
});

/** PATCH /api/admin/products/:id/stock — Update stock map */
const updateStock = asyncHandler(async (req, res) => {
  const product = await productService.updateStock(req.params.id, req.body.stock);
  res.json(new ApiResponse(200, 'Stock updated', { product }));
});

module.exports = { listAll, create, update, remove, updateStock };
