/**
 * @fileoverview Authentication Middleware Module
 * @description Intercepts incoming HTTP requests to validate JWT credentials
 * from HTTP-Only cookies or Bearer Authorization headers. Enforces route guards
 * and establishes user context for downstream controllers and view templates.
 * @module middlewares/authMiddleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Strict route protection middleware.
 * Verifies that the requester possesses a valid, non-expired JWT.
 *
 * Execution flow:
 * 1. Inspects request cookies for 'token'; falls back to Authorization Bearer header.
 * 2. Decodes and cryptographically verifies the token against JWT_SECRET.
 * 3. Fetches the active user from the database, excluding the password hash.
 * 4. Mounts the user object onto `req.user` and `res.locals.user` (accessible in EJS views).
 * 5. Handles API responses (401 JSON) vs. Browser navigations (redirect to /auth/login).
 *
 * @async
 * @function protect
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void|import('express').Response>}
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Extract token from cookie (preferred for SSR web apps) or Bearer header (REST API clients)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token exists, deny access
  if (!token) {
    if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }
    return res.redirect('/auth/login');
  }

  try {
    // 2. Verify signature & expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // 3. Confirm user still exists in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.clearCookie('token');
      if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }
      return res.redirect('/auth/login');
    }

    // 4. Attach user context
    req.user = user;
    res.locals.user = user; // Exposes `user` globally inside EJS templates
    next();
  } catch (error) {
    // Clear invalid or expired cookie
    res.clearCookie('token');
    if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }
    return res.redirect('/auth/login');
  }
};

/**
 * Non-blocking user context resolver middleware.
 * Attaches the authenticated user to `res.locals.user` if a valid session exists,
 * but allows the request to continue unhindered if unauthenticated.
 * Ideal for public-facing views (home, blog posts) that dynamically show login/logout links.
 *
 * @async
 * @function checkUser
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
const checkUser = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token is provided, initialize null user context and proceed
  if (!token) {
    res.locals.user = null;
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('-password');
    req.user = user || null;
    res.locals.user = user || null;
    next();
  } catch (error) {
    // If token verification fails, gracefully default to unauthenticated state
    res.locals.user = null;
    req.user = null;
    next();
  }
};

module.exports = {
  protect,
  checkUser,
};
