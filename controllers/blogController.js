/**
 * @fileoverview Blog Controller Module
 * @description Implements CRUD operations for blog posts, supporting tag filtering,
 * text search queries, author population, snippet auto-generation, and author ownership guards.
 * @module controllers/blogController
 */

const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');

/**
 * Retrieves a list of blog posts with optional keyword search and tag filtering.
 *
 * Populates the author document (`username`, `email`) and orders results descending by creation date.
 *
 * @async
 * @function getAllBlogs
 * @route GET /api/blogs
 * @access Public
 * @param {import('express').Request} req - Express request with query params: { search, tag }
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void|import('express').Response>}
 */
const getAllBlogs = async (req, res) => {
  try {
    const { search, tag } = req.query;
    const filter = {};

    // Case-insensitive regex search over title, body content, and author username
    if (search) {
      const cleanSearch = search.trim();
      const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const authorQuery = cleanSearch.replace(/^@/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const matchingUsers = await User.find(
        { username: { $regex: authorQuery, $options: 'i' } },
        '_id'
      );
      const userIds = matchingUsers.map((u) => u._id);

      const orConditions = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { content: { $regex: escapedSearch, $options: 'i' } },
      ];

      if (userIds.length > 0) {
        orConditions.push({ author: { $in: userIds } });
      }

      filter.$or = orConditions;
    }

    // Exact match filter for tags
    if (tag) {
      filter.tags = tag;
    }

    const blogs = await Blog.find(filter)
      .populate('author', 'username email profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    console.error('[Blog:getAllBlogs Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blogs.',
    });
  }
};

/**
 * Retrieves a single blog post by its unique MongoDB ObjectId.
 *
 * @async
 * @function getBlogById
 * @route GET /api/blogs/:id
 * @access Public
 * @param {import('express').Request} req - Express request with param `id`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void|import('express').Response>}
 */
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format before querying database
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format.',
      });
    }

    const blog = await Blog.findById(id).populate('author', 'username email profileImage');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error('[Blog:getBlogById Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog post.',
    });
  }
};

/**
 * Creates and persists a new blog post attributed to the authenticated user.
 *
 * Normalizes tags (array or comma-delimited string) and allows Mongoose
 * pre-save hooks to generate an excerpt snippet if one is not provided.
 *
 * @async
 * @function createBlog
 * @route POST /api/blogs
 * @access Private (Requires JWT authentication)
 * @param {import('express').Request} req - Express request with body: { title, content, snippet, tags }
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void|import('express').Response>}
 */
const createBlog = async (req, res) => {
  try {
    const { title, content, snippet, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for the blog post.',
      });
    }

    // Normalize tags into an array of lowercase, trimmed strings
    let processedTags = [];
    if (typeof tags === 'string') {
      processedTags = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    } else if (Array.isArray(tags)) {
      processedTags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    }

    const newBlog = await Blog.create({
      title,
      content,
      snippet,
      tags: processedTags,
      author: req.user._id,
    });

    const populatedBlog = await newBlog.populate('author', 'username email');

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully.',
      blog: populatedBlog,
    });
  } catch (error) {
    console.error('[Blog:createBlog Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating blog post.',
    });
  }
};

/**
 * Updates an existing blog post after verifying author ownership.
 *
 * Only the original author or users possessing the 'admin' role are authorized.
 *
 * @async
 * @function updateBlog
 * @route PUT /api/blogs/:id
 * @access Private (Author or Admin only)
 * @param {import('express').Request} req - Express request with param `id` and body fields to update.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void|import('express').Response>}
 */
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, snippet, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format.',
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
    }

    // Enforce author ownership access control
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to edit this post.',
      });
    }

    // Apply partial updates
    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (snippet !== undefined) blog.snippet = snippet;

    if (tags !== undefined) {
      if (typeof tags === 'string') {
        blog.tags = tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
      } else if (Array.isArray(tags)) {
        blog.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
      }
    }

    await blog.save();
    const updatedBlog = await blog.populate('author', 'username email');

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully.',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('[Blog:updateBlog Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating blog post.',
    });
  }
};

/**
 * Permanently removes a blog post after verifying author ownership.
 *
 * Only the original author or an admin can trigger deletion.
 *
 * @async
 * @function deleteBlog
 * @route DELETE /api/blogs/:id
 * @access Private (Author or Admin only)
 * @param {import('express').Request} req - Express request with param `id`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void|import('express').Response>}
 */
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format.',
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
    }

    // Enforce author ownership access control
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete this post.',
      });
    }

    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully.',
    });
  } catch (error) {
    console.error('[Blog:deleteBlog Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting blog post.',
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
};
