/**
 * @fileoverview View Controller Module (SSR)
 * @description Renders server-side EJS templates and processes traditional HTML form
 * submissions for blog browsing, article reading, authoring, and session authentication.
 * @module controllers/viewController
 */

const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Helper to set authentication cookie on SSR responses.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {string} token - Signed JWT string.
 */
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

/**
 * Renders the home page displaying the blog feed, search bar, and active filters.
 *
 * @async
 * @function renderHome
 * @route GET /
 * @access Public
 * @param {import('express').Request} req - Express request with optional query params `search` and `tag`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
const renderHome = async (req, res) => {
  try {
    const { search, tag } = req.query;
    const filter = {};

    if (search) {
      const cleanSearch = search.trim();
      const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const authorQuery = cleanSearch.replace(/^@/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Find any users matching username (with or without leading @)
      const matchingUsers = await User.find(
        { username: { $regex: authorQuery, $options: 'i' } },
        '_id'
      );
      const userIds = matchingUsers.map((u) => u._id);

      const orConditions = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { content: { $regex: escapedSearch, $options: 'i' } },
      ];

      // If user(s) found, include all blogs authored by them
      if (userIds.length > 0) {
        orConditions.push({ author: { $in: userIds } });
      }

      filter.$or = orConditions;
    }

    if (tag) {
      filter.tags = tag.trim().toLowerCase();
    }

    const blogs = await Blog.find(filter)
      .populate('author', 'username email profileImage')
      .sort({ createdAt: -1 });

    res.render('pages/index', {
      blogs,
      search: search || '',
      tag: tag || '',
      query: req.query,
    });
  } catch (error) {
    console.error('[View:renderHome Error]:', error);
    res.status(500).render('pages/404', { title: 'Error Loading Feed' });
  }
};

/**
 * Renders the authenticated user's private dashboard displaying only blogs written by them,
 * with full controls to edit or delete their articles.
 *
 * @async
 * @function renderMyBlogs
 * @route GET /my-blogs
 * @access Private (Authenticated users only)
 * @param {import('express').Request} req - Express request with populated `req.user`.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const renderMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate('author', 'username email profileImage')
      .sort({ createdAt: -1 });

    res.render('pages/my-blogs', {
      title: 'My Stories',
      blogs,
      deleted: req.query.deleted === 'true',
    });
  } catch (error) {
    console.error('[View:renderMyBlogs Error]:', error);
    res.status(500).render('pages/404', { title: 'Error Loading Your Stories' });
  }
};

/**
 * Renders the user account settings view.
 *
 * @async
 * @function renderSettings
 * @route GET /settings
 * @access Private (Authenticated users only)
 * @param {import('express').Request} req - Express request with populated `req.user`.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const renderSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('pages/settings', {
      title: 'Account Details',
      user: user || req.user,
      error: null,
      success: req.query.updated === 'true' ? 'Profile updated successfully!' : null,
      editMode: req.query.edit === 'true',
    });
  } catch (error) {
    console.error('[View:renderSettings Error]:', error);
    res.status(500).render('pages/404', { title: 'Error Loading Account Details' });
  }
};

/**
 * Handles profile updates (username, email, password, profile image).
 *
 * @async
 * @function handleUpdateProfile
 * @route POST /settings
 * @access Private (Authenticated users only)
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const handleUpdateProfile = async (req, res) => {
  try {
    const { username, email, password, selectedAvatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.redirect('/auth/login');
    }

    // Validate Username
    if (username && username.trim() !== user.username) {
      const trimmedUser = username.trim();
      if (trimmedUser.length < 3 || trimmedUser.length > 30) {
        return res.render('pages/settings', {
          title: 'Account Details',
          user,
          error: 'Username must be between 3 and 30 characters long.',
          success: null,
          editMode: true,
        });
      }
      const existingUser = await User.findOne({ username: trimmedUser, _id: { $ne: user._id } });
      if (existingUser) {
        return res.render('pages/settings', {
          title: 'Account Details',
          user,
          error: 'Username is already taken by another account.',
          success: null,
          editMode: true,
        });
      }
      user.username = trimmedUser;
    }

    // Validate Email
    if (email && email.trim().toLowerCase() !== user.email) {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.render('pages/settings', {
          title: 'Account Details',
          user,
          error: 'Please enter a valid email address.',
          success: null,
          editMode: true,
        });
      }
      const existingEmail = await User.findOne({ email: trimmedEmail, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.render('pages/settings', {
          title: 'Account Details',
          user,
          error: 'Email address is already in use.',
          success: null,
          editMode: true,
        });
      }
      user.email = trimmedEmail;
    }

    // Validate and update Password (if provided)
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.render('pages/settings', {
          title: 'Account Details',
          user,
          error: 'New password must be at least 6 characters long.',
          success: null,
          editMode: true,
        });
      }
      user.password = password; // Pre-save hook will hash this!
    }

    // Profile Image update
    if (req.file) {
      user.profileImage = '/uploads/avatars/' + req.file.filename;
    } else if (selectedAvatar && typeof selectedAvatar === 'string' && (selectedAvatar.startsWith('/images/avatars/') || selectedAvatar === '/images/default-avatar.svg')) {
      user.profileImage = selectedAvatar;
    }

    await user.save();

    // Re-issue JWT cookie so active session is immediately updated
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.render('pages/settings', {
      title: 'Account Details',
      user,
      success: 'Profile updated successfully!',
      error: null,
      editMode: false,
    });
  } catch (error) {
    console.error('[View:handleUpdateProfile Error]:', error);
    res.render('pages/settings', {
      title: 'Account Details',
      user: req.user,
      error: error.message || 'Failed to update profile.',
      success: null,
      editMode: true,
    });
  }
};


/**
 * Renders the single blog article reader view.
 *
 * @async
 * @function renderBlogDetail
 * @route GET /blogs/:id
 * @access Public
 * @param {import('express').Request} req - Express request with param `id`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
const renderBlogDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('pages/404', { title: 'Article Not Found' });
    }

    const blog = await Blog.findById(id).populate('author', 'username email profileImage');
    if (!blog) {
      return res.status(404).render('pages/404', { title: 'Article Not Found' });
    }

    res.render('pages/blog-detail', { blog });
  } catch (error) {
    console.error('[View:renderBlogDetail Error]:', error);
    res.status(500).render('pages/404', { title: 'Error Loading Article' });
  }
};

/**
 * Renders the form to publish a new blog post.
 *
 * @function renderCreateBlog
 * @route GET /blogs/create
 * @access Private
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
const renderCreateBlog = (req, res) => {
  res.render('pages/blog-form', {
    isEdit: false,
    blog: {},
    error: null,
  });
};

/**
 * Handles HTML form submission for creating a new blog post.
 *
 * @async
 * @function handleCreateBlog
 * @route POST /blogs/create
 * @access Private
 * @param {import('express').Request} req - Express request with body { title, tags, content }.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const handleCreateBlog = async (req, res) => {
  try {
    const { title, tags, content } = req.body;

    if (!title || !content) {
      return res.render('pages/blog-form', {
        isEdit: false,
        blog: { title, content, tags: tags ? tags.split(',').map((t) => t.trim()) : [] },
        error: 'Please provide both an article title and content body.',
      });
    }

    let processedTags = [];
    if (typeof tags === 'string' && tags.trim()) {
      processedTags = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }

    let mediaUrl = null;
    let mediaType = 'none';

    if (req.file) {
      mediaUrl = '/uploads/blogs/' + req.file.filename;
      const mime = req.file.mimetype.toLowerCase();
      mediaType = mime.startsWith('video/') ? 'video' : 'image';
    }

    const newBlog = await Blog.create({
      title: title.trim(),
      content: content.trim(),
      tags: processedTags,
      author: req.user._id,
      mediaUrl,
      mediaType,
    });

    res.redirect(`/blogs/${newBlog._id}`);
  } catch (error) {
    console.error('[View:handleCreateBlog Error]:', error);
    res.render('pages/blog-form', {
      isEdit: false,
      blog: req.body,
      error: error.message || 'Failed to publish story.',
    });
  }
};

/**
 * Renders the edit form for an existing blog post after validating author ownership.
 *
 * @async
 * @function renderEditBlog
 * @route GET /blogs/:id/edit
 * @access Private (Author only)
 * @param {import('express').Request} req - Express request with param `id`.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const renderEditBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('pages/404', { title: 'Article Not Found' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).render('pages/404', { title: 'Article Not Found' });
    }

    // Authorization verification
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.redirect(`/blogs/${id}`);
    }

    res.render('pages/blog-form', {
      isEdit: true,
      blog,
      error: null,
    });
  } catch (error) {
    console.error('[View:renderEditBlog Error]:', error);
    res.status(500).render('pages/404', { title: 'Error Loading Article' });
  }
};

/**
 * Handles HTML form submission for updating an existing blog post.
 *
 * @async
 * @function handleEditBlog
 * @route POST /blogs/:id/edit
 * @access Private (Author only)
 * @param {import('express').Request} req - Express request with param `id` and body.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const handleEditBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tags, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('pages/404', { title: 'Article Not Found' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).render('pages/404', { title: 'Article Not Found' });
    }

    // Ownership check
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.redirect(`/blogs/${id}`);
    }

    if (!title || !content) {
      return res.render('pages/blog-form', {
        isEdit: true,
        blog: { ...blog.toObject(), title, content },
        error: 'Title and content cannot be empty.',
      });
    }

    let processedTags = [];
    if (typeof tags === 'string') {
      processedTags = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }

    blog.title = title.trim();
    blog.content = content.trim();
    blog.tags = processedTags;

    // Handle media updates
    if (req.file) {
      blog.mediaUrl = '/uploads/blogs/' + req.file.filename;
      const mime = req.file.mimetype.toLowerCase();
      blog.mediaType = mime.startsWith('video/') ? 'video' : 'image';
    } else if (req.body.removeMedia === 'true') {
      blog.mediaUrl = null;
      blog.mediaType = 'none';
    }

    await blog.save();

    res.redirect(`/blogs/${blog._id}`);
  } catch (error) {
    console.error('[View:handleEditBlog Error]:', error);
    res.render('pages/blog-form', {
      isEdit: true,
      blog: { _id: req.params.id, ...req.body },
      error: error.message || 'Failed to update story.',
    });
  }
};

/**
 * Handles deleting a blog post via form submission.
 *
 * @async
 * @function handleDeleteBlog
 * @route POST /blogs/:id/delete
 * @access Private (Author only)
 * @param {import('express').Request} req - Express request with param `id`.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const handleDeleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('pages/404', { title: 'Article Not Found' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).render('pages/404', { title: 'Article Not Found' });
    }

    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.redirect(`/blogs/${id}`);
    }

    await Blog.findByIdAndDelete(id);
    const referer = req.headers.referer || '';
    if (referer.includes('/my-blogs')) {
      return res.redirect('/my-blogs?deleted=true');
    }
    res.redirect('/my-blogs?deleted=true');
  } catch (error) {
    console.error('[View:handleDeleteBlog Error]:', error);
    res.redirect('/my-blogs');
  }
};

/**
 * Renders the user login page.
 * Redirects to home if a session is already active.
 *
 * @function renderLogin
 * @route GET /auth/login
 * @access Public
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
const renderLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('pages/login', {
    error: null,
    email: '',
    query: req.query,
  });
};

/**
 * Handles HTML form submission for user login.
 *
 * @async
 * @function handleLogin
 * @route POST /auth/login
 * @access Public
 * @param {import('express').Request} req - Express request with body { email, password }.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('pages/login', {
        error: 'Please enter both your email address and password.',
        email: email || '',
        query: {},
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.render('pages/login', {
        error: 'Invalid email or password.',
        email: email || '',
        query: {},
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('pages/login', {
        error: 'Invalid email or password.',
        email: email || '',
        query: {},
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);
    res.redirect('/?login=success');
  } catch (error) {
    console.error('[View:handleLogin Error]:', error);
    res.render('pages/login', {
      error: 'An unexpected error occurred during login. Please try again.',
      email: req.body.email || '',
      query: {},
    });
  }
};

/**
 * Renders the registration (signup) page.
 * Redirects to home if user is already authenticated.
 *
 * @function renderSignup
 * @route GET /auth/signup
 * @access Public
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
const renderSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('pages/signup', {
    error: null,
    username: '',
    email: '',
  });
};

/**
 * Handles HTML form submission for new user registration.
 *
 * @async
 * @function handleSignup
 * @route POST /auth/signup
 * @access Public
 * @param {import('express').Request} req - Express request with body { username, email, password }.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<void>}
 */
const handleSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.render('pages/signup', {
        error: 'All fields are required.',
        username: username || '',
        email: email || '',
      });
    }

    if (password.length < 6) {
      return res.render('pages/signup', {
        error: 'Password must be at least 6 characters long.',
        username: username || '',
        email: email || '',
      });
    }

    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.render('pages/signup', {
        error: 'Email address is already registered.',
        username: username || '',
        email: email || '',
      });
    }

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.render('pages/signup', {
        error: 'Username is already taken. Please choose another.',
        username: username || '',
        email: email || '',
      });
    }

    // Profile image: use uploaded file if provided, otherwise chosen avatar or fallback default
    let profileImage = '/images/default-avatar.svg';
    if (req.file) {
      profileImage = '/uploads/avatars/' + req.file.filename;
    } else if (req.body.selectedAvatar && typeof req.body.selectedAvatar === 'string' && (req.body.selectedAvatar.startsWith('/images/avatars/') || req.body.selectedAvatar === '/images/default-avatar.svg')) {
      profileImage = req.body.selectedAvatar;
    }

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      profileImage,
    });

    const token = generateToken(newUser._id);
    setAuthCookie(res, token);
    res.redirect('/?welcome=true');
  } catch (error) {
    console.error('[View:handleSignup Error]:', error);
    res.render('pages/signup', {
      error: error.message || 'An error occurred during account creation.',
      username: req.body.username || '',
      email: req.body.email || '',
    });
  }
};

/**
 * Logs out the active user and redirects to the login screen with feedback.
 *
 * @function handleLogout
 * @route GET /auth/logout
 * @access Public
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
const handleLogout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.redirect('/auth/login?logout=success');
};

module.exports = {
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
};
