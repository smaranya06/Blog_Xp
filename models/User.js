/**
 * @fileoverview User Data Model
 * @description Mongoose schema and model definition for registered users.
 * Encapsulates credentials, access roles, pre-save bcrypt password hashing,
 * and instance validation methods.
 * @module models/User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema definition
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true, // Automatically records createdAt and updatedAt timestamps
  }
);

/**
 * Pre-save middleware hook.
 * Cryptographically hashes the user password with a salt factor of 10
 * prior to saving whenever the password field has been modified.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compares an incoming plain-text candidate password against the stored bcrypt hash.
 *
 * @async
 * @method comparePassword
 * @memberof module:models/User~userSchema
 * @param {string} candidatePassword - Plaintext password provided during login.
 * @returns {Promise<boolean>} True if the password matches, false otherwise.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Sanitizes the serialized user document by stripping the sensitive password hash.
 * Automatically invoked when `res.json(user)` or `JSON.stringify(user)` is executed.
 *
 * @method toJSON
 * @memberof module:models/User~userSchema
 * @returns {Object} User document representation devoid of password hash.
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
