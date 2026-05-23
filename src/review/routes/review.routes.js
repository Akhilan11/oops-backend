const express = require('express');
const { verifyAccessToken } = require('../../middleware/auth/verifyToken');
const { requireAdmin } = require('../../middleware/auth/requireAdmin');
const validate = require('../../middleware/validation/validate');
const { createReviewSchema } = require('../validations/review.validation');
const ctrl = require('../controllers/review.controller');

const productRouter = express.Router({ mergeParams: true });
const reviewRouter = express.Router();
const adminRouter = express.Router();

// /api/products/:productId/reviews
productRouter.get('/', ctrl.list);
productRouter.get('/summary', ctrl.summary);
productRouter.post('/', verifyAccessToken, validate(createReviewSchema), ctrl.create);

// /api/reviews/:reviewId
reviewRouter.patch('/:reviewId', verifyAccessToken, ctrl.update);
reviewRouter.post('/:reviewId/helpful', verifyAccessToken, ctrl.helpful);

// /api/admin/reviews/:reviewId (admin only)
adminRouter.delete('/:reviewId', verifyAccessToken, requireAdmin, ctrl.remove);

module.exports = { productRouter, reviewRouter, adminRouter };
