const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    }
  }],
  comments: {
    type: String,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  },
  grade: {
    points: {
      type: Number,
      min: [0, 'Points cannot be negative']
    },
    feedback: {
      type: String,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters']
    },
    gradedAt: {
      type: Date
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indices únicos para evitar múltiples entregas del mismo estudiante
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ submittedAt: 1 });

// Virtual para calcular porcentaje de calificación
submissionSchema.virtual('gradePercentage').get(function() {
  if (!this.grade.points || !this.populated('assignment')) return null;
  return (this.grade.points / this.assignment.maxPoints) * 100;
});

module.exports = mongoose.model('Submission', submissionSchema);