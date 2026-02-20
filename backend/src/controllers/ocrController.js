const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractTextFromImage } = require('../utils/ocrUtils');
const { generatePDF, generateMultiPagePDF } = require('../utils/pdfUtils');
const Document = require('../models/Document');

const pdfDir = path.join(process.cwd(), 'pdfs');
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

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
    document = await Document.create({
      userId, title, originalImagePath: imagePath,
      extractedText: '', pdfPath: '', status: 'processing', language
    });

    console.log(`🔍 Starting OCR for: ${req.file.originalname}`);
    const ocrResult = await extractTextFromImage(imagePath, language);

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      document.status = 'failed';
      await document.save();
      return res.status(422).json({ success: false, message: 'No text could be detected. Try a clearer image.' });
    }

    const pdfFileName = `${uuidv4()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    console.log('📄 Generating PDF...');
    await generatePDF(ocrResult.text, title, imagePath, pdfPath);

    const imageStats = fs.statSync(imagePath);
    document.extractedText = ocrResult.text;
    document.pdfPath = pdfPath;
    document.confidence = ocrResult.confidence;
    document.wordCount = ocrResult.wordCount;
    document.status = 'completed';
    document.metadata = { imageSize: imageStats.size, processingTime: ocrResult.processingTime };
    await document.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;

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
        pdfUrl: `${baseUrl}/pdfs/${pdfFileName}`,
        imageUrl: `${baseUrl}/uploads/${path.basename(imagePath)}`,
        language,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Processing Error:', error);
    if (document) { document.status = 'failed'; await document.save(); }
    if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    return res.status(500).json({ success: false, message: 'Failed to process image', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const processBase64Image = async (req, res) => {
  const { imageBase64, title, language, userId } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ success: false, message: 'No image data provided' });
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  const fileName = `${uuidv4()}.jpg`;
  const imagePath = path.join(uploadDir, fileName);

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
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

const processMultipleImages = async (req, res) => {
  const { images, userId } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, message: 'No images provided' });
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  const savedPaths = [];

  try {
    for (let i = 0; i < images.length; i++) {
      const fileName = `${uuidv4()}_page${i + 1}.jpg`;
      const imagePath = path.join(uploadDir, fileName);
      const base64Data = images[i].replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
      savedPaths.push(imagePath);
    }

    const ocrResults = [];
    for (let i = 0; i < savedPaths.length; i++) {
      console.log(`🔍 OCR on page ${i + 1} of ${savedPaths.length}`);
      try {
        const result = await extractTextFromImage(savedPaths[i]);
        ocrResults.push({ text: result.text, imagePath: savedPaths[i], confidence: result.confidence, wordCount: result.wordCount });
      } catch (err) {
        console.error(`Page ${i + 1} OCR failed:`, err.message);
        ocrResults.push({ text: '', imagePath: savedPaths[i], confidence: 0, wordCount: 0 });
      }
    }

    const combinedText = ocrResults.map((r, i) => `--- Page ${i + 1} ---\n${r.text}`).join('\n\n');
    const totalWords = ocrResults.reduce((sum, r) => sum + r.wordCount, 0);
    const avgConfidence = Math.round(ocrResults.reduce((sum, r) => sum + r.confidence, 0) / ocrResults.length);

    const pdfFileName = `${uuidv4()}_combined.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    const title = `Notes_${new Date().toISOString().slice(0, 10)}_${ocrResults.length}pages`;

    await generateMultiPagePDF(ocrResults, title, pdfPath);

    const document = await Document.create({
      userId: userId || null, title,
      originalImagePath: savedPaths[0],
      extractedText: combinedText,
      pdfPath, confidence: avgConfidence,
      wordCount: totalWords, status: 'completed',
      pageCount: ocrResults.length
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return res.status(200).json({
      success: true,
      message: `${ocrResults.length} pages processed successfully`,
      data: {
        documentId: document._id, title,
        extractedText: combinedText,
        wordCount: totalWords,
        confidence: avgConfidence,
        pageCount: ocrResults.length,
        pdfUrl: `${baseUrl}/pdfs/${pdfFileName}`,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Multi-image Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    savedPaths.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
  }
};

module.exports = { processImage, processBase64Image, processMultipleImages };