const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User'); // Add this import

// Create post
exports.createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    
    const post = await Post.create({
      user: req.user.id,
      image: req.file.path,
      caption
    });

    await post.populate('user', 'username profileImage');
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all posts (for feed)
exports.getFeedPosts = async (req, res) => {
  try {
    // Get the current user with populated following array
    const currentUser = await User.findById(req.user.id).populate('following');
    
    // Extract the IDs of users that the current user is following, plus the current user
    const followingIds = currentUser.following.map(user => user._id);
    followingIds.push(req.user.id);
    
    const posts = await Post.find({
      user: { $in: followingIds }
    })
    .populate('user', 'username profileImage')
    .populate('comments.user', 'username profileImage')
    .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error in getFeedPosts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Like/Unlike post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);
      
      // Create notification if not the post owner
      if (post.user.toString() !== req.user.id) {
        await Notification.create({
          recipient: post.user,
          sender: req.user.id,
          type: 'like',
          post: post._id
        });
      }
    }

    await post.save();
    res.json({ 
      message: isLiked ? 'Post unliked' : 'Post liked',
      likes: post.likes.length 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.user.id,
      text
    };

    post.comments.push(comment);
    await post.save();
    
    // Populate comment user info
    await post.populate('comments.user', 'username profileImage');
    const newComment = post.comments[post.comments.length - 1];
    
    // Create notification if not the post owner
    if (post.user.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.user,
        sender: req.user.id,
        type: 'comment',
        post: post._id
      });
    }

    res.json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};