const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Resource description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'dataset', 'codigo', 'libro', 'articulo', 'tutorial', 'otro'],
    required: [true, 'Resource type is required']
  },
  category: {
    type: String,
    enum: ['machine-learning', 'deep-learning', 'nlp', 'computer-vision', 'data-science', 'programming', 'mathematics', 'statistics', 'otro'],
    required: [true, 'Resource category is required']
  },
  url: {
    type: String,
    match: [/^https?:\/\/.*$/, 'Please enter a valid URL']
  },
  filePath: {
    type: String
  },
  fileSize: {
    type: Number
  },
  author: {
    type: String,
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  source: {
    type: String,
    trim: true,
    maxlength: [100, 'Source cannot exceed 100 characters']
  },
  publishedDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['principiante', 'intermedio', 'avanzado'],
    default: 'intermedio'
  },
  language: {
    type: String,
    enum: ['español', 'ingles', 'portugues', 'otro'],
    default: 'español'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  downloads: {
    type: Number,
    default: 0
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      required: true
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indices
resourceSchema.index({ type: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ featured: 1 });
resourceSchema.index({ isPublic: 1 });
resourceSchema.index({ difficulty: 1 });

// Virtual para calcular rating promedio
resourceSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual para contar total de ratings
resourceSchema.virtual('totalRatings').get(function() {
  return this.ratings.length;
});

module.exports = mongoose.model('Resource', resourceSchema);