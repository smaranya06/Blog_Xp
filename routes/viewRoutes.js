/**
 * @fileoverview Web View Router
 * @description Directs browser navigation and SSR form submissions to the corresponding
 * view controller methods with authentication route guards where necessary.
 * @module routes/viewRoutes
 */

const express = require('express');
const router = express.Router();

const {
  renderHome,
  renderMyBlogs,
  renderSettings,
  handleUpdateProfile,
  renderBlogDetail,
  renderCreateBlog,
  handleCreateBlog,
  renderEditBlog,
  handleEditBlog,
  handleDeleteBlog,
  renderLogin,
  handleLogin,
  renderSignup,
  handleSignup,
  handleLogout,
} = require('../controllers/viewController');

const { protect } = require('../middlewares/authMiddleware');
const { handleAvatarUpload, handleBlogMediaUpload } = require('../middlewares/uploadMiddleware');

// Home & Feed
router.get('/', renderHome);

// User Authored Blogs Dashboard & Account Settings
router.get('/my-blogs', protect, renderMyBlogs);
router.get('/settings', protect, renderSettings);
router.post('/settings', protect, handleAvatarUpload, handleUpdateProfile);

// Blog Authoring & Reading
router.get('/blogs/create', protect, renderCreateBlog);
router.post('/blogs/create', protect, handleBlogMediaUpload, handleCreateBlog);
router.get('/blogs/:id', renderBlogDetail);
router.get('/blogs/:id/edit', protect, renderEditBlog);
router.post('/blogs/:id/edit', protect, handleBlogMediaUpload, handleEditBlog);
router.post('/blogs/:id/delete', protect, handleDeleteBlog);

// User Authentication Views & Form Handlers
router.get('/auth/login', renderLogin);
router.post('/auth/login', handleLogin);
router.get('/auth/signup', renderSignup);
router.post('/auth/signup', handleAvatarUpload, handleSignup);
router.get('/auth/logout', handleLogout);

module.exports = router;
