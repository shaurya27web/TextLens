const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// GET all documents (with optional userId filter)
const getAllDocuments = async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const filter = { status: 'completed' };
    if (userId) filter.userId = userId;

    const total = await Document.countDocuments(filter);
    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-extractedText'); // Exclude large text for list view

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formatted = documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      wordCount: doc.wordCount,
      confidence: Math.round(doc.confidence),
      language: doc.language,
      pdfUrl: `${baseUrl}/pdfs/${path.basename(doc.pdfPath)}`,
      imageUrl: `${baseUrl}/uploads/${path.basename(doc.originalImagePath)}`,
      createdAt: doc.createdAt
    }));

    res.json({ success: true, total, page: Number(page), data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET single document with full text
const getDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      data: {
        id: doc._id,
        title: doc.title,
        extractedText: doc.extractedText,
        wordCount: doc.wordCount,
        confidence: Math.round(doc.confidence),
        language: doc.language,
        status: doc.status,
        pdfUrl: `${baseUrl}/pdfs/${path.basename(doc.pdfPath)}`,
        imageUrl: `${baseUrl}/uploads/${path.basename(doc.originalImagePath)}`,
        metadata: doc.metadata,
        createdAt: doc.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE document
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Delete files
    [doc.originalImagePath, doc.pdfPath].forEach(filePath => {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await doc.deleteOne();
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE document title
const updateDocument = async (req, res) => {
  try {
    const { title } = req.body;
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: { id: doc._id, title: doc.title } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllDocuments, getDocument, deleteDocument, updateDocument };
