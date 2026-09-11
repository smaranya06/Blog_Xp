/**
 * @fileoverview Main Application Entry Point
 * @description Configures the Express application instance, boots the MongoDB
 * database connection, configures body parsers and cookie handling, mounts the EJS
 * view engine, attaches authentication context middleware, registers modular routes,
 * and handles global error/404 handling.
 * @module server
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Modular Route Handlers
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');

// Middlewares
const { checkUser } = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database Connection
connectDB();

// Core Middleware Pipeline
app.use(express.json());                               // Parse application/json request bodies
app.use(express.urlencoded({ extended: true }));        // Parse application/x-www-form-urlencoded form submissions
app.use(cookieParser());                              // Parse Cookie header and populate req.cookies

// Static Asset Delivery
app.use(express.static(path.join(__dirname, 'public')));

// Server-Side View Engine Configuration (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Context Middleware: populates `req.user` and `res.locals.user` for all routes and views
app.use(checkUser);

/**
 * Health check probe endpoint.
 * @route GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Blog_Xp backend API is active and operational.',
    user: req.user ? { id: req.user._id, username: req.user.username } : null,
  });
});

// Mount Feature Routers
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

/**
 * Fallback 404 handler for undefined routes.
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found.`,
  });
});

/**
 * Centralized error-handling middleware.
 * Intercepts unhandled synchronous or asynchronous exceptions across the application.
 */
app.use((err, req, res, next) => {
  console.error('[Unhandled Application Error]:', err.stack || err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start HTTP Listener
const server = app.listen(PORT, () => {
  console.log(
    `[Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`
  );
});

module.exports = { app, server };
