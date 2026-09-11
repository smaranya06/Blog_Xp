/**
 * @fileoverview Database Configuration Module
 * @description Configures and manages the Mongoose MongoDB connection pool,
 * providing connection lifecycle logging and terminating the process on fatal faults.
 * @module config/db
 */

const mongoose = require('mongoose');

/**
 * Initializes connection to the MongoDB cluster/instance using the configured URI.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blog_xp';
    const conn = await mongoose.connect(mongoUri);

    console.log(
      `[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`
    );
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    // Terminate application process on unrecoverable database connection failure
    process.exit(1);
  }
};

module.exports = connectDB;
