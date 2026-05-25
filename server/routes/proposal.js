const express = require('express');
const router = express.Router();
const {
  createProposal,
  updateProposal,
  getProposals,
  getProposalById,
  updateProposalStatus,
  addFeedback,
  searchArchives,
  getPublicProposals,
  getPublicProposalById,
  deleteProposal
} = require('../controllers/proposalController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadPDF } = require('../middleware/uploadMiddleware');

// 1. Archive/Search Route (Place BEFORE /:id to prevent "archive" being read as an ID)
router.get('/archive', protect, searchArchives);
router.get('/public', getPublicProposals);
router.get('/public/:id', getPublicProposalById);

// 2. Standard CRUD Routes
router.route('/')
  .post(protect, uploadPDF.single('file'), createProposal)
  .get(protect, getProposals);

router.route('/:id')
  .get(protect, getProposalById)
  .put(protect, uploadPDF.single('file'), updateProposal)
  .delete(protect, restrictTo('Admin'), deleteProposal);

// 3. Workflow Specific Routes
router.post('/:id/status', protect, restrictTo('Faculty', 'Admin'), updateProposalStatus);
router.post('/:id/feedback', protect, restrictTo('Faculty', 'Admin'), addFeedback);

module.exports = router;