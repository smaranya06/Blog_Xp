/**
 * @fileoverview Blog Router
 * @description Exposes public endpoints for browsing articles and protected endpoints
 * for creating, modifying, and deleting blog entries under author ownership enforcement.
 * @module routes/blogRoutes
 */

const express = require('express');
const router = express.Router();

const {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} = require('../controllers/blogController');

const { protect } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/blogs
 * @desc    Fetch paginated/filtered list of blogs with populated authors
 * @access  Public
 */
router.get('/', getAllBlogs);

/**
 * @route   GET /api/blogs/:id
 * @desc    Fetch a single blog post by its unique ObjectId
 * @access  Public
 */
router.get('/:id', getBlogById);

/**
 * @route   POST /api/blogs
 * @desc    Publish a new blog post authored by the authenticated user
 * @access  Private
 */
router.post('/', protect, createBlog);

/**
 * @route   PUT /api/blogs/:id
 * @desc    Update an existing blog post (Author or Admin only)
 * @access  Private
 */
router.put('/:id', protect, updateBlog);

/**
 * @route   DELETE /api/blogs/:id
 * @desc    Delete a blog post (Author or Admin only)
 * @access  Private
 */
router.delete('/:id', protect, deleteBlog);

module.exports = router;
