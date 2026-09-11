/**
 * @fileoverview Blog Data Model
 * @description Mongoose schema and model definition for blog publications.
 * Includes relational reference to the author User document, keyword tags,
 * and automated snippet extraction for card previews.
 * @module models/Blog
 */

const mongoose = require('mongoose');

/**
 * Blog Schema definition
 */
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    snippet: {
      type: String,
      trim: true,
      maxlength: [300, 'Snippet cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blog author is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

/**
 * Pre-save middleware hook.
 * Synthesizes an excerpt snippet from the main blog body if no custom
 * snippet was explicitly provided by the author.
 */
blogSchema.pre('save', function () {
  if (!this.snippet && this.content) {
    // Strip HTML markup tags if present, then extract the initial 150 characters
    const plainText = this.content.replace(/<[^>]+>/g, '').trim();
    this.snippet = plainText.length > 150 ? plainText.slice(0, 147) + '...' : plainText;
  }
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
