/**
 * @fileoverview File Upload Middleware
 * @description Configures Multer storage engines and file filters for user avatars
 * and blog post media (images and videos). Handles directory initialization,
 * file validation, and file size quotas.
 * @module middlewares/uploadMiddleware
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure destination storage directories exist
const avatarsDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
const blogsDir = path.join(__dirname, '..', 'public', 'uploads', 'blogs');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
if (!fs.existsSync(blogsDir)) {
  fs.mkdirSync(blogsDir, { recursive: true });
}

/**
 * Storage configuration for user profile avatars
 */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

/**
 * Storage configuration for blog post media (images and videos)
 */
const blogMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, blogsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `media-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter validator for profile images
 */
const avatarFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|webp|gif|svg/;
  const mimeType = file.mimetype.toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  if (allowedExts.test(ext) || mimeType.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WebP, GIF, SVG) are allowed for profile pictures!'), false);
  }
};

/**
 * File filter validator for blog post media (images or videos)
 */
const blogMediaFilter = (req, file, cb) => {
  const allowedImageExts = /jpeg|jpg|png|webp|gif/;
  const allowedVideoExts = /mp4|webm|ogg|mov|mkv/;
  const mimeType = file.mimetype.toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  const isImage = allowedImageExts.test(ext) || mimeType.startsWith('image/');
  const isVideo = allowedVideoExts.test(ext) || mimeType.startsWith('video/');

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Only image or video files (JPG, PNG, WebP, GIF, MP4, WebM, OGG, MOV) are allowed!'), false);
  }
};

/**
 * Multer instance for avatar uploads (max 5MB)
 */
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Multer instance for blog post media uploads (max 60MB)
 */
const uploadBlogMedia = multer({
  storage: blogMediaStorage,
  fileFilter: blogMediaFilter,
  limits: { fileSize: 60 * 1024 * 1024 },
});

/**
 * Graceful avatar upload handler with view error forwarding
 */
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar.single('profileImage')(req, res, (err) => {
    if (err) {
      return res.status(400).render('pages/signup', {
        error: err.message,
        username: req.body.username || '',
        email: req.body.email || '',
      });
    }
    next();
  });
};

/**
 * Graceful blog media upload handler with view error forwarding
 */
const handleBlogMediaUpload = (req, res, next) => {
  uploadBlogMedia.single('media')(req, res, (err) => {
    if (err) {
      const isEdit = !!req.params.id;
      return res.status(400).render('pages/blog-form', {
        isEdit,
        blog: { ...req.body, _id: req.params.id },
        error: err.message,
      });
    }
    next();
  });
};

module.exports = {
  uploadAvatar,
  uploadBlogMedia,
  handleAvatarUpload,
  handleBlogMediaUpload,
};

