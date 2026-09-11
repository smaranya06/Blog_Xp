/**
 * @fileoverview Authentication Router
 * @description Exposes API endpoints for identity registration, credential validation,
 * token invalidation (logout), and authenticated user profile introspection.
 * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registers a new user and issues an authentication cookie
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Validates credentials and establishes an authenticated session
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/logout
 * @desc    Clears the session cookie and terminates authentication
 * @access  Public
 */
router.get('/logout', logout);

/**
 * @route   GET /api/auth/me
 * @desc    Fetches the profile of the currently authenticated user
 * @access  Private
 */
router.get('/me', protect, getMe);

module.exports = router;
