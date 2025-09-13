const express = require('express');
const {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage
} = require('../controllers/messageController');
const auth = require('../middleware/auth');
const { uploadPost } = require('../middleware/upload');

const router = express.Router();

router.get('/conversations', auth, getConversations);
router.get('/:userId', auth, getMessages);
router.post('/', auth, uploadPost.single('media'), sendMessage);
router.delete('/:id', auth, deleteMessage);

module.exports = router;