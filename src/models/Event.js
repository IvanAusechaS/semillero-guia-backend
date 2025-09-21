const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  type: {
    type: String,
    enum: ['workshop', 'conferencia', 'seminario', 'taller', 'reunion', 'otro'],
    required: [true, 'Event type is required']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  endDate: {
    type: Date
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  virtualLink: {
    type: String,
    required: function() { return this.isVirtual; },
    match: [/^https?:\/\/.*$/, 'Please enter a valid URL']
  },
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1']
  },
  registrationRequired: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    attended: {
      type: Boolean,
      default: false
    }
  }],
  speakers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      maxlength: [500, 'Speaker bio cannot exceed 500 characters']
    },
    image: {
      type: String
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  image: {
    type: String
  },
  materials: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
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
eventSchema.index({ date: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ featured: 1 });
eventSchema.index({ isPublic: 1 });

// Virtual para determinar si está en el pasado
eventSchema.virtual('isPast').get(function() {
  return new Date() > this.date;
});

// Virtual para contar asistentes registrados
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.length;
});

// Virtual para determinar si está lleno
eventSchema.virtual('isFull').get(function() {
  return this.capacity ? this.attendees.length >= this.capacity : false;
});

module.exports = mongoose.model('Event', eventSchema);