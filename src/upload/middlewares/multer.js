/**
 * @module upload/middlewares/multer
 * @description Multer config: memory storage, JPEG/PNG/WebP filter, 5MB limit, max 5 files.
 */

const multer = require('multer');
const ApiError = require('../../utils/ApiError');
const { ALLOWED_IMAGE_TYPES } = require('../../utils/constants');
const env = require('../../../config/env');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, WebP allowed'), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSize, files: 5 },
});
