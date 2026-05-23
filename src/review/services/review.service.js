const Review = require('../models/Review');
const Product = require('../../product/models/Product');
const ApiError = require('../../utils/ApiError');

/**
 * Create or update a review for a product.
 * One review per user per product (upsert).
 */
const createOrUpdate = async (productId, userId, data) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const review = await Review.findOneAndUpdate(
    { product: productId, user: userId },
    {
      product: productId,
      user: userId,
      rating: data.rating,
      title: data.title || '',
      comment: data.comment || '',
      size: data.size || '',
    },
    { upsert: true, new: true, runValidators: true }
  );

  return review;
};

/**
 * List reviews for a product with pagination and optional rating filter.
 */
const listByProduct = async (productId, query) => {
  const { page = 1, limit: rawLimit = 20, rating } = query;
  const limit = Math.min(parseInt(rawLimit) || 20, 100);
  const pageNum = parseInt(page) || 1;

  const filter = { product: productId };
  if (rating) filter.rating = parseInt(rating);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return { reviews, total, page: pageNum, totalPages: Math.ceil(total / limit) };
};

/**
 * Get rating summary (count per star) for a product.
 */
const getSummary = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(productId) } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;

  result.forEach(({ _id, count }) => {
    breakdown[_id] = count;
    total += count;
    sum += _id * count;
  });

  const avg = total > 0 ? (sum / total).toFixed(1) : '0';

  return { avg: parseFloat(avg), total, breakdown };
};

/**
 * Update a review (only by the author).
 */
const update = async (reviewId, userId, data) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== userId) {
    throw new ApiError(403, 'You can only edit your own review');
  }

  if (data.rating !== undefined) review.rating = data.rating;
  if (data.title !== undefined) review.title = data.title;
  if (data.comment !== undefined) review.comment = data.comment;
  if (data.size !== undefined) review.size = data.size;

  await review.save();
  return review;
};

/**
 * Mark a review as helpful (toggle).
 */
const toggleHelpful = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  const idx = review.helpfulBy.indexOf(userId);
  if (idx > -1) {
    review.helpfulBy.splice(idx, 1);
    review.helpful = Math.max(0, review.helpful - 1);
  } else {
    review.helpfulBy.push(userId);
    review.helpful += 1;
  }

  await review.save();
  return review;
};

/**
 * Delete a review (admin only).
 */
const remove = async (reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');
  await review.deleteOne();
};

module.exports = { createOrUpdate, update, listByProduct, getSummary, toggleHelpful, remove };
