import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  technologies: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['planificado', 'en-desarrollo', 'completado', 'pausado'],
    default: 'planificado'
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    }
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  repositoryUrl: {
    type: String,
    match: [/^https?:\/\/(www\.)?(github|gitlab)\.com\/[\w-]+\/[\w-]+$/, 'Please enter a valid repository URL']
  },
  demoUrl: {
    type: String,
    match: [/^https?:\/\/.*$/, 'Please enter a valid URL']
  },
  images: [{
    type: String
  }],
  image: {
    type: String,
    default: '/api/placeholder/600/400'
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
projectSchema.index({ status: 1 });
projectSchema.index({ featured: 1 });
projectSchema.index({ 'team.user': 1 });

// Virtual para determinar duración del proyecto
projectSchema.virtual('duration').get(function() {
  if (!this.endDate) return null;
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual para contar miembros del equipo
projectSchema.virtual('teamSize').get(function() {
  return this.team.length;
});

export default mongoose.model('Project', projectSchema);