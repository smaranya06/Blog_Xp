/**
 * @fileoverview Main Application Entry Point
 * @description Configures the Express application instance, boots the MongoDB
 * database connection, configures body parsers and cookie handling, mounts the EJS
 * view engine, attaches authentication context middleware, registers modular API and SSR view routes,
 * and handles global error/404 handling.
 * @module server
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const os = require('os');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Modular Route Handlers
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const viewRoutes = require('./routes/viewRoutes');

// Middlewares
const { checkUser } = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

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
app.use('/', viewRoutes);

/**
 * Fallback 404 handler for undefined routes.
 * Gracefully serves EJS 404 page for browser navigations or JSON for API calls.
 */
app.use((req, res) => {
  if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} not found.`,
    });
  }
  res.status(404).render('pages/404', { title: '404 - Page Not Found' });
});

/**
 * Centralized error-handling middleware.
 * Intercepts unhandled synchronous or asynchronous exceptions across the application.
 */
app.use((err, req, res, next) => {
  console.error('[Unhandled Application Error]:', err.stack || err);

  const statusCode = err.statusCode || 500;
  if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  res.status(statusCode).render('pages/404', {
    title: 'Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

/**
 * Retrieves the local IPv4 address of this machine on the local network (Wi-Fi/Ethernet).
 * Used to display the exact URL to access the site from mobile phones and other LAN devices.
 * @returns {string}
 */
const getLocalNetworkIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Start HTTP Listener bound to all network interfaces (0.0.0.0)
const server = app.listen(PORT, HOST, () => {
  const networkIp = getLocalNetworkIp();
  console.log(`\n======================================================`);
  console.log(`[Blog_Xp Server] Running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`  ➜ Local:   http://localhost:${PORT}`);
  console.log(`  ➜ Network: http://${networkIp}:${PORT}`);
  console.log(`  ➜ Mobile:  Open http://${networkIp}:${PORT} on your phone`);
  console.log(`======================================================\n`);
});

module.exports = { app, server };
