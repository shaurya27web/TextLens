const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalImagePath: {
    type: String,
    required: true
  },
 extractedText: {
  type: String,
  default: ''
},
  pdfPath: {
  type: String,
  default: ''
},
  confidence: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'eng'
  },
  wordCount: {
    type: Number,
    default: 0
  },
  pageCount: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  metadata: {
    imageSize: Number,
    imageWidth: Number,
    imageHeight: Number,
    processingTime: Number
  }
}, {
  timestamps: true
});

// Index for faster queries
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);
