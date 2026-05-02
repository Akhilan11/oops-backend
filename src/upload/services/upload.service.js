/**
 * @module upload/services/upload
 * @description Cloudinary upload & delete operations.
 */

const cloudinary = require('../../../config/cloudinary');
const env = require('../../../config/env');
const ApiError = require('../../utils/ApiError');

/**
 * Upload a single image buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} mimetype - e.g. 'image/jpeg'
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: env.cloudinary.folder, resource_type: 'image', format: mimetype.split('/')[1] === 'webp' ? 'webp' : undefined },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }))
    );
    stream.end(buffer);
  });

/**
 * Upload multiple image files to Cloudinary.
 * Uses Promise.allSettled so partial uploads still return results.
 *
 * @param {Array} files - multer file objects (each has .buffer and .mimetype)
 * @returns {Promise<{uploaded: Array, errors: Array}>}
 * @throws {ApiError} 400 if no files
 */
const uploadImages = async (files) => {
  if (!files || files.length === 0) throw new ApiError(400, 'No files provided');

  const results = await Promise.allSettled(
    files.map((f) => uploadToCloudinary(f.buffer, f.mimetype))
  );

  const uploaded = [];
  const errors = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') uploaded.push(r.value);
    else errors.push({ file: files[i].originalname, error: r.reason.message });
  });

  return { uploaded, errors };
};

/**
 * Delete an image from Cloudinary by its public ID.
 * @param {string} publicId
 * @throws {ApiError} 400 if no publicId
 */
const deleteImage = async (publicId) => {
  if (!publicId) throw new ApiError(400, 'publicId is required');
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadImages, deleteImage };
