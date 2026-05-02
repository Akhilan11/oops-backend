/**
 * @module upload/controllers/upload
 * @description Admin upload endpoints: push to / delete from Cloudinary.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const uploadService = require('../services/upload.service');

/** POST /api/upload — Upload images (multipart, max 5 files) */
const uploadImages = asyncHandler(async (req, res) => {
  const { uploaded, errors } = await uploadService.uploadImages(req.files);
  res.json(new ApiResponse(200, 'Upload complete', { uploaded, errors: errors.length ? errors : undefined }));
});

/** DELETE /api/upload — Delete an image by publicId */
const deleteImage = asyncHandler(async (req, res) => {
  await uploadService.deleteImage(req.body.publicId);
  res.json(new ApiResponse(200, 'Image deleted'));
});

module.exports = { uploadImages, deleteImage };
