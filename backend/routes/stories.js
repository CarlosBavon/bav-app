const express = require('express');
const {
  createStory,
  getFeedStories,
  viewStory,
  getStoryViews,
  deleteStory
} = require('../controllers/storyController');
const auth = require('../middleware/auth');
const { uploadStory } = require('../middleware/upload');

const router = express.Router();

router.get('/feed', auth, getFeedStories);
router.post('/', auth, uploadStory.single('media'), createStory);
router.post('/:id/view', auth, viewStory);
router.get('/:id/views', auth, getStoryViews);
router.delete('/:id', auth, deleteStory);

module.exports = router;