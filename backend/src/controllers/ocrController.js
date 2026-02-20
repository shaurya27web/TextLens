const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractTextFromImage } = require('../utils/ocrUtils');
const { generatePDF } = require('../utils/pdfUtils');
const Document = require('../models/Document');

const pdfDir = path.join(process.cwd(), 'pdfs');
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

/**
 * POST /api/ocr/process
 * Upload image → OCR → Generate PDF → Save to DB
 */
const processImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  const imagePath = req.file.path;
  const title = req.body.title || `Scan_${new Date().toISOString().slice(0, 10)}`;
  const language = req.body.language || 'eng';
  const userId = req.body.userId || null;

  let document = null;

  try {
    // Create document record - status: processing
    document = await Document.create({
      userId,
      title,
      originalImagePath: imagePath,
      extractedText: '',
      pdfPath: '',
      status: 'processing',
      language
    });

    // Step 1: OCR
    console.log(`🔍 Starting OCR for: ${req.file.originalname}`);
    const ocrResult = await extractTextFromImage(imagePath, language);

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      document.status = 'failed';
      await document.save();
      return res.status(422).json({
        success: false,
        message: 'No text could be detected in the image. Please try with a clearer image.'
      });
    }

    // Step 2: Generate PDF
    const pdfFileName = `${uuidv4()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);

    console.log('📄 Generating PDF...');
    await generatePDF(ocrResult.text, title, imagePath, pdfPath);

    // Step 3: Update document record
    const imageStats = fs.statSync(imagePath);
    document.extractedText = ocrResult.text;
    document.pdfPath = pdfPath;
    document.confidence = ocrResult.confidence;
    document.wordCount = ocrResult.wordCount;
    document.status = 'completed';
    document.metadata = {
      imageSize: imageStats.size,
      processingTime: ocrResult.processingTime
    };
    await document.save();

    // Build public URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfUrl = `${baseUrl}/pdfs/${pdfFileName}`;
    const imageUrl = `${baseUrl}/uploads/${path.basename(imagePath)}`;

    console.log(`✅ Document processed: ${document._id}`);

    return res.status(200).json({
      success: true,
      message: 'Image processed successfully',
      data: {
        documentId: document._id,
        title,
        extractedText: ocrResult.text,
        wordCount: ocrResult.wordCount,
        confidence: Math.round(ocrResult.confidence),
        processingTime: ocrResult.processingTime,
        pdfUrl,
        imageUrl,
        language,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Processing Error:', error);

    if (document) {
      document.status = 'failed';
      await document.save();
    }

    // Cleanup uploaded file on failure
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to process image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /api/ocr/process-base64
 * Accept base64 image from mobile app
 */
const processBase64Image = async (req, res) => {
  const { imageBase64, title, language, userId } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ success: false, message: 'No image data provided' });
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  const fileName = `${uuidv4()}.jpg`;
  const imagePath = path.join(uploadDir, fileName);

  try {
    // Decode base64 and save
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(imagePath, buffer);

    req.file = { path: imagePath, originalname: fileName };
    req.body.title = title || `Scan_${new Date().toISOString().slice(0, 10)}`;
    req.body.language = language || 'eng';
    req.body.userId = userId || null;

    return processImage(req, res);
  } catch (error) {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    return res.status(500).json({ success: false, message: 'Failed to decode image', error: error.message });
  }
};

module.exports = { processImage, processBase64Image };
