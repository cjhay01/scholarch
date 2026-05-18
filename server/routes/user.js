const express = require('express');
const router = express.Router();
const { createUser, batchCreateStudents, generateUserCredentials, getPendingUsers, generateAllCredentials, listUsersByRole, getMyAdviser, getMyClassmates, getMyCreatedUsers, updateProfile, changePassword } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadCSV } = require('../middleware/uploadMiddleware');

router.post('/create', protect, restrictTo('Admin', 'Faculty'), createUser);

router.post('/batch-students', protect, restrictTo('Faculty'), uploadCSV.single('file'), batchCreateStudents);

router.get('/pending', protect, restrictTo('Admin', 'Faculty'), getPendingUsers);
router.post('/generate-all-credentials', protect, restrictTo('Admin', 'Faculty'), generateAllCredentials);
router.get('/list', protect, listUsersByRole);
router.get('/my-adviser', protect, getMyAdviser);
router.get('/my-classmates', protect, getMyClassmates);
router.get('/my-created', protect, restrictTo('Admin', 'Faculty'), getMyCreatedUsers);

router.post('/:id/generate-credentials', protect, restrictTo('Admin', 'Faculty'), generateUserCredentials);

router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
