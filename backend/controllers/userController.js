const User = require("../models/User");
const Post = require("../models/Post");
const Story = require("../models/Story");
const Notification = require("../models/Notification");

// === Get user profile ===
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "username profileImage")
      .populate("following", "username profileImage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ user: user._id });
    const stories = await Story.find({ user: user._id });

    res.json({ user, posts, stories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Update user profile ===
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Username change logic with limit
    if (username && username !== user.username) {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      if (
        user.usernameChanges.lastChange > oneWeekAgo &&
        user.usernameChanges.count >= 2
      ) {
        return res
          .status(400)
          .json({
            message: "You can only change your username twice per week",
          });
      }

      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      if (user.usernameChanges.lastChange > oneWeekAgo) {
        user.usernameChanges.count += 1;
      } else {
        user.usernameChanges.count = 1;
      }
      user.usernameChanges.lastChange = now;
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;

    // ✅ If a new profile image is uploaded
    if (req.file) {
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Follow/Unfollow user ===
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      currentUser.following.pull(userToFollow._id);
      userToFollow.followers.pull(currentUser._id);
    } else {
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);

      await Notification.create({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: "follow",
      });
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({
      message: isFollowing
        ? "Unfollowed successfully"
        : "Followed successfully",
      isFollowing: !isFollowing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Search users ===
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      username: { $regex: q, $options: "i" },
    }).select("username profileImage");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
