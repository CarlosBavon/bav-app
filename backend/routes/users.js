const express = require('express');
const {
  getUserProfile,
  updateProfile,
  followUser,
  searchUsers
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

const router = express.Router();

router.get('/search', auth, searchUsers);
router.get('/:id', auth, getUserProfile);
router.put('/profile', auth, uploadProfile.single('image'), updateProfile);
router.post('/:id/follow', auth, followUser);

module.exports = router;