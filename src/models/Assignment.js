import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'El proyecto es obligatorio']
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El asignador es obligatorio']
  },
  dueDate: {
    type: Date,
    required: [true, 'La fecha de vencimiento es obligatoria']
  },
  priority: {
    type: String,
    enum: {
      values: ['baja', 'media', 'alta', 'critica'],
      message: 'La prioridad debe ser: baja, media, alta o critica'
    },
    default: 'media'
  },
  status: {
    type: String,
    enum: {
      values: ['pendiente', 'en_progreso', 'completado', 'vencido'],
      message: 'El estado debe ser: pendiente, en_progreso, completado o vencido'
    },
    default: 'pendiente'
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
    mimetype: String,
    size: Number,
    path: String
  }],
  instructions: {
    type: String,
    maxlength: [3000, 'Las instrucciones no pueden exceder 3000 caracteres']
  },
  deliverables: [{
    type: String,
    trim: true
  }],
  estimatedHours: {
    type: Number,
    min: [0.5, 'Las horas estimadas deben ser al menos 0.5'],
    max: [200, 'Las horas estimadas no pueden exceder 200']
  },
  maxPoints: {
    type: Number,
    required: [true, 'Los puntos máximos son obligatorios'],
    min: [0, 'Los puntos no pueden ser negativos'],
    default: 100
  },
  allowLateSubmissions: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    min: [0, 'La penalización no puede ser negativa'],
    max: [100, 'La penalización no puede exceder 100%'],
    default: 10
  },
  fileTypes: [{
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'mp4', 'avi']
  }],
  maxFileSize: {
    type: Number,
    default: 10485760 // 10MB
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para verificar si está vencido
assignmentSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'completado';
});

// Virtual para días restantes
assignmentSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual para calcular progreso basado en submissions
assignmentSchema.virtual('progress').get(function() {
  if (this.status === 'completado') return 100;
  if (this.status === 'en_progreso') return 50;
  if (this.status === 'pendiente') return 0;
  return 0;
});

// Middleware para actualizar estado automáticamente
assignmentSchema.pre('save', function(next) {
  // Actualizar estado a vencido si la fecha pasó
  if (this.dueDate < new Date() && this.status === 'pendiente') {
    this.status = 'vencido';
  }
  next();
});

// Índices para optimizar consultas
assignmentSchema.index({ assignedTo: 1, status: 1 });
assignmentSchema.index({ project: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ assignedBy: 1 });
assignmentSchema.index({ priority: 1 });
assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ isActive: 1 });

// Método estático para obtener estadísticas
assignmentSchema.statics.getStatsByUser = function(userId) {
  return this.aggregate([
    { $match: { assignedTo: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        stats: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    }
  ]);
};

// Método estático para obtener asignaciones próximas a vencer
assignmentSchema.statics.getUpcomingDeadlines = function(userId, days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    assignedTo: userId,
    dueDate: { 
      $gte: new Date(),
      $lte: futureDate
    },
    status: { $in: ['pendiente', 'en_progreso'] }
  })
  .populate('project', 'title')
  .sort({ dueDate: 1 })
  .limit(10);
};

// Método de instancia para verificar permisos
assignmentSchema.methods.canBeEditedBy = function(userId) {
  return this.assignedBy.toString() === userId.toString();
};

assignmentSchema.methods.canBeViewedBy = function(userId) {
  return this.assignedTo.includes(userId) || 
         this.assignedBy.toString() === userId.toString();
};

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;