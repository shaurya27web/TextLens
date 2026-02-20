const express = require('express');
const router = express.Router();
const { getAllDocuments, getDocument, deleteDocument, updateDocument } = require('../controllers/documentController');

router.get('/', getAllDocuments);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
