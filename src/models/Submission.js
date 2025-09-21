import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'La asignación es obligatoria']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El estudiante es obligatorio']
  },
  content: {
    type: String,
    required: [true, 'El contenido es obligatorio'],
    maxlength: [5000, 'El contenido no puede exceder 5000 caracteres']
  },
  attachments: [{
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
  submittedAt: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    min: [0, 'La calificación no puede ser negativa'],
    max: [5, 'La calificación no puede exceder 5']
  },
  feedback: {
    type: String,
    maxlength: [2000, 'El feedback no puede exceder 2000 caracteres']
  },
  status: {
    type: String,
    enum: {
      values: ['enviado', 'revisado', 'aprobado', 'rechazado'],
      message: 'El estado debe ser: enviado, revisado, aprobado o rechazado'
    },
    default: 'enviado'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revisionCount: {
    type: Number,
    default: 0
  },
  comments: {
    type: String,
    maxlength: [1000, 'Los comentarios no pueden exceder 1000 caracteres']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices únicos para evitar múltiples entregas del mismo estudiante
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ submittedAt: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ gradedAt: 1 });

// Virtual para calcular porcentaje de calificación
submissionSchema.virtual('gradePercentage').get(function() {
  if (!this.grade || !this.populated('assignment')) return null;
  return (this.grade / 5) * 100; // Basado en escala de 0-5
});

// Virtual para verificar si necesita revisión
submissionSchema.virtual('needsReview').get(function() {
  return this.status === 'enviado';
});

// Middleware para verificar entregas tardías
submissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Verificar si es una entrega tardía
    const assignment = await this.model('Assignment').findById(this.assignment);
    if (assignment && this.submittedAt > assignment.dueDate) {
      this.isLate = true;
    }
  }
  next();
});

// Método para verificar permisos
submissionSchema.methods.canBeViewedBy = function(userId) {
  return this.student.toString() === userId.toString();
};

submissionSchema.methods.canBeGradedBy = function(userId) {
  // Solo docentes y admins pueden calificar
  return true; // Se verificará en el middleware de autenticación
};

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;