const fetch = require('node-fetch');
const fs = require('fs');

const extractTextFromImage = async (imagePath) => {
  const startTime = Date.now();
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    console.log('🔍 Sending to OCR.space...');

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
  }
};

module.exports = { extractTextFromImage };