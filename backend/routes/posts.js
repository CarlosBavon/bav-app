const express = require('express');
const {
  createPost,
  getFeedPosts,
  likePost,
  addComment,
  deletePost
} = require('../controllers/postController');
const auth = require('../middleware/auth');
const { uploadPost } = require('../middleware/upload');

const router = express.Router();

router.get('/feed', auth, getFeedPosts);
router.post('/', auth, uploadPost.single('image'), createPost);
router.post('/:id/like', auth, likePost);
router.post('/:id/comment', auth, addComment);
router.delete('/:id', auth, deletePost);

module.exports = router;