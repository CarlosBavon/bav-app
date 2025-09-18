const multer = require("multer");
const path = require("path");

// === Storage for posts ===
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/posts/"),
  filename: (req, file, cb) =>
    cb(null, `post-${Date.now()}${path.extname(file.originalname)}`),
});

// === Storage for stories ===
const storyStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/stories/"),
  filename: (req, file, cb) =>
    cb(null, `story-${Date.now()}${path.extname(file.originalname)}`),
});

// === Storage for profile images ===
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/profiles/"),
  filename: (req, file, cb) =>
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`),
});

// === File filter (only images/videos) ===
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed!"), false);
  }
};

// === Exported upload middlewares ===
exports.uploadPost = multer({
  storage: postStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

exports.uploadStory = multer({
  storage: storyStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

exports.uploadProfile = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
