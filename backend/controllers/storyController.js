const Story = require('../models/Story');
const Notification = require('../models/Notification');
const User = require('../models/User'); // Add this import

// Create story
exports.createStory = async (req, res) => {
  try {
    const mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
    
    const story = await Story.create({
      user: req.user.id,
      media: req.file.path,
      mediaType
    });

    await story.populate('user', 'username profileImage');
    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stories for feed
exports.getFeedStories = async (req, res) => {
  try {
    // Get the current user with populated following array
    const currentUser = await User.findById(req.user.id).populate('following');
    
    // Extract the IDs of users that the current user is following
    const followingIds = currentUser.following.map(user => user._id);
    
    const stories = await Story.find({
      user: { $in: followingIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'username profileImage')
    .populate('views', 'username profileImage');

    // Group stories by user
    const storiesByUser = {};
    stories.forEach(story => {
      if (!storiesByUser[story.user._id]) {
        storiesByUser[story.user._id] = {
          user: story.user,
          stories: []
        };
      }
      storiesByUser[story.user._id].stories.push(story);
    });

    res.json(Object.values(storiesByUser));
  } catch (error) {
    console.error('Error in getFeedStories:', error);
    res.status(500).json({ message: error.message });
  }
};

// View story
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (!story.views.includes(req.user.id)) {
      story.views.push(req.user.id);
      await story.save();
      
      // Create notification if not the story owner
      if (story.user.toString() !== req.user.id) {
        await Notification.create({
          recipient: story.user,
          sender: req.user.id,
          type: 'view',
          story: story._id
        });
      }
    }

    res.json({ message: 'Story viewed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get story views
exports.getStoryViews = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('views', 'username profileImage');
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(story.views);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};