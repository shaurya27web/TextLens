const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { processImage, processBase64Image } = require('../controllers/ocrController');

// Upload file directly (multipart/form-data)
router.post('/process', upload.single('image'), processImage);

// Send base64 image (from mobile camera)
router.post('/process-base64', processBase64Image);

module.exports = router;
