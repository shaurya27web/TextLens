const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { processImage, processBase64Image, processMultipleImages } = require('../controllers/ocrController');

router.post('/process', upload.single('image'), processImage);
router.post('/process-base64', processBase64Image);
router.post('/process-multiple', processMultipleImages);

module.exports = router;