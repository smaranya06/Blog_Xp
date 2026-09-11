/**
 * @fileoverview Authentication Controller Module
 * @description Handles user identity lifecycle operations including registration,
 * credential validation, JWT cookie establishment, session termination, and profile lookup.
 * @module controllers/authController
 */

const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');

/**
 * Registers a new user account.
 *
 * Validates request payload, ensures uniqueness of username and email,
 * persists the new user document (triggering bcrypt pre-save hashing),
 * and issues an authentication JWT cookie.
 *
 * @async
 * @function register
 * @route POST /api/auth/register
 * @access Public
 * @param {import('express').Request} req - Express request with body: { username, email, password }
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void|import('express').Response>}
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Enforce required payload attributes
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password.',
      });
    }

    // 2. Validate password length constraint
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 3. Check for existing accounts with identical email (case-insensitive)
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.',
      });
    }

    // 4. Check for existing accounts with identical username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken.',
      });
    }

    // 5. Persist user entity (pre-save hook securely hashes password)
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
    });

    // 6. Return response with signed JWT and HTTP-Only cookie
    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (error) {
    console.error('[Auth:Register Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

/**
 * Authenticates an existing user via email and password.
 *
 * Compares candidate password hash using bcrypt, generates a signed JWT,
 * and sets the HTTP-Only authentication cookie.
 *
 * @async
 * @function login
 * @route POST /api/auth/login
 * @access Public
 * @param {import('express').Request} req - Express request with body: { email, password }
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void|import('express').Response>}
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Verify credential presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // 2. Retrieve user record by normalized email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Cryptographic comparison against stored bcrypt hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 4. Issue authenticated session
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('[Auth:Login Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

/**
 * Logs out the authenticated user by clearing the JWT session cookie.
 *
 * @function logout
 * @route GET /api/auth/logout
 * @access Public
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {void}
 */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Retrieves the currently authenticated user's profile information.
 * Requires upstream execution of the `protect` middleware.
 *
 * @async
 * @function getMe
 * @route GET /api/auth/me
 * @access Private
 * @param {import('express').Request} req - Express request with attached `req.user`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
