const fetch = require('node-fetch');
const fs = require('fs');
const sharp = require('sharp');

const compressImage = async (imagePath) => {
  const compressedPath = imagePath.replace(/\.[^/.]+$/, '_compressed.jpg');
  await sharp(imagePath)
    .resize({ width: 1500, withoutEnlargement: true })
    .jpeg({ quality: 60 })
    .toFile(compressedPath);
  return compressedPath;
};

const extractTextFromImage = async (imagePath) => {
  const startTime = Date.now();
  let compressedPath = null;

  try {
    compressedPath = await compressImage(imagePath);
    const imageBuffer = fs.readFileSync(compressedPath);
    const fileSizeKB = imageBuffer.length / 1024;
    console.log(`📦 Compressed: ${fileSizeKB.toFixed(0)} KB`);

    const base64Image = imageBuffer.toString('base64');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': process.env.OCR_SPACE_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        base64Image: `data:image/jpg;base64,${base64Image}`,
        OCREngine: '2',
        detectOrientation: 'true',
        scale: 'true',
        isOverlayRequired: 'false'
      }).toString()
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage?.[0] || 'OCR failed');
    }

    const text = data.ParsedResults?.[0]?.ParsedText || '';
    const processingTime = Date.now() - startTime;
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    console.log(`✅ OCR Complete — ${wordCount} words detected`);
    return { text, confidence: 90, wordCount, processingTime };

  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`OCR failed: ${error.message}`);
  } finally {
    if (compressedPath && fs.existsSync(compressedPath)) {
      fs.unlinkSync(compressedPath);
    }
  }
};

module.exports = { extractTextFromImage };