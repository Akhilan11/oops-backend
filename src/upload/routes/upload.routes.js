/**
 * @module upload/routes/upload
 * @description Admin upload routes (requires auth + admin + rate limit).
 */

const express = require('express');
const { verifyAccessToken, requireAdmin, uploadLimiter } = require('../../middleware');
const upload = require('../middlewares/multer');
const ctrl = require('../controllers/upload.controller');

const router = express.Router();
router.use(verifyAccessToken, requireAdmin, uploadLimiter);

router.post('/',   upload.array('images', 5), ctrl.uploadImages);
router.delete('/', ctrl.deleteImage);

module.exports = router;
