const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const reviewService = require('../services/review.service');

/** POST /api/products/:productId/reviews */
const create = asyncHandler(async (req, res) => {
  const review = await reviewService.createOrUpdate(
    req.params.productId,
    req.user.userId,
    req.body
  );
  res.status(201).json(new ApiResponse(201, 'Review submitted', { review }));
});

/** GET /api/products/:productId/reviews */
const list = asyncHandler(async (req, res) => {
  const result = await reviewService.listByProduct(req.params.productId, req.query);
  res.json(new ApiResponse(200, 'Reviews', { ...result }));
});

/** GET /api/products/:productId/reviews/summary */
const summary = asyncHandler(async (req, res) => {
  const data = await reviewService.getSummary(req.params.productId);
  res.json(new ApiResponse(200, 'Review summary', data));
});

/** PATCH /api/reviews/:reviewId */
const update = asyncHandler(async (req, res) => {
  const review = await reviewService.update(req.params.reviewId, req.user.userId, req.body);
  res.json(new ApiResponse(200, 'Review updated', { review }));
});

/** POST /api/reviews/:reviewId/helpful */
const helpful = asyncHandler(async (req, res) => {
  const review = await reviewService.toggleHelpful(req.params.reviewId, req.user.userId);
  res.json(new ApiResponse(200, 'Updated', { helpful: review.helpful }));
});

/** DELETE /api/admin/reviews/:reviewId */
const remove = asyncHandler(async (req, res) => {
  await reviewService.remove(req.params.reviewId);
  res.json(new ApiResponse(200, 'Review deleted'));
});

module.exports = { create, list, summary, update, helpful, remove };
