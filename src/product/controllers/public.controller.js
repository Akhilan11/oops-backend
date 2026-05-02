/**
 * @module product/controllers/public
 * @description Public (no auth) product endpoints: list & detail.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const productService = require('../services/product.service');

/** GET /api/products — Paginated list with optional filters */
const list = asyncHandler(async (req, res) => {
  const result = await productService.listPublic(req.query);
  res.json(new ApiResponse(200, 'Products', result));
});

/** GET /api/products/:id — Single product with related products */
const detail = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.json(new ApiResponse(200, 'Product detail', { product }));
});

module.exports = { list, detail };
