/**
 * @fileoverview JWT Utility Module
 * @description Provides helper functions to generate JSON Web Tokens (JWT)
 * and serialize authenticated sessions into secure HTTP-Only cookies.
 * @module utils/jwt
 */

const jwt = require('jsonwebtoken');

/**
 * Generates a signed JSON Web Token (JWT) encapsulating the user ID.
 *
 * @function generateToken
 * @param {string|import('mongoose').Types.ObjectId} userId - Unique identifier of the user.
 * @returns {string} Signed JWT string.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Signs a JWT, attaches it as an HTTP-Only cookie to the response,
 * and sends a normalized JSON authentication response payload.
 *
 * @function sendTokenResponse
 * @param {import('../models/User')} user - Authenticated user document.
 * @param {number} statusCode - HTTP status code (e.g., 200 for OK, 201 for Created).
 * @param {import('express').Response} res - Express response object.
 * @param {string} [message='Success'] - Descriptive message for client feedback.
 * @returns {void}
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);

  // Cookie security options:
  // - httpOnly: Prevents client-side scripts from reading the cookie (mitigates XSS attacks)
  // - secure: Transmitted only over HTTPS in production environments
  // - sameSite: 'lax' balances CSRF mitigation with user navigation experience
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

module.exports = {
  generateToken,
  sendTokenResponse,
};
