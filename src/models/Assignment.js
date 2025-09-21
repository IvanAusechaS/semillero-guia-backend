const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  instructions: {
    type: String,
    maxlength: [3000, 'Instructions cannot exceed 3000 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maxPoints: {
    type: Number,
    required: [true, 'Maximum points is required'],
    min: [0, 'Points cannot be negative'],
    default: 100
  },
  allowLateSubmissions: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    min: [0, 'Penalty cannot be negative'],
    max: [100, 'Penalty cannot exceed 100%'],
    default: 10
  },
  fileTypes: [{
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar']
  }],
  maxFileSize: {
    type: Number,
    default: 5000000 // 5MB
  },
  isActive: {
    type: Boolean,
    default: true
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

// Virtual para determinar si está vencida
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Indices
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ isActive: 1 });
assignmentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);