/**
 * @module customer/controllers/customer
 * @description Admin-only customer endpoints (derived from orders).
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const customerService = require('../services/customer.service');

/** GET /api/admin/customers — Paginated customer list */
const list = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  res.json(new ApiResponse(200, 'Customers', result));
});

/** GET /api/admin/customers/:phone — Customer detail + order history */
const getByPhone = asyncHandler(async (req, res) => {
  const result = await customerService.getCustomerByPhone(req.params.phone);
  res.json(new ApiResponse(200, 'Customer detail', result));
});

module.exports = { list, getByPhone };
