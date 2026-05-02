/**
 * @module address/controllers/address
 * @description Consumer address CRUD endpoints.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const addressService = require('../services/address.service');

/** GET /api/addresses — List saved addresses */
const list = asyncHandler(async (req, res) => {
  const addresses = await addressService.list(req.user.userId);
  res.json(new ApiResponse(200, 'Addresses', { addresses }));
});

/** POST /api/addresses — Add a new address */
const create = asyncHandler(async (req, res) => {
  const address = await addressService.create(req.user.userId, req.body);
  res.status(201).json(new ApiResponse(201, 'Address added', { address }));
});

/** PUT /api/addresses/:id — Update an address */
const update = asyncHandler(async (req, res) => {
  const address = await addressService.update(req.params.id, req.user.userId, req.body);
  res.json(new ApiResponse(200, 'Address updated', { address }));
});

/** DELETE /api/addresses/:id — Delete an address */
const remove = asyncHandler(async (req, res) => {
  await addressService.remove(req.params.id, req.user.userId);
  res.json(new ApiResponse(200, 'Address deleted'));
});

module.exports = { list, create, update, remove };
