import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Mock data for projects (replace with database model when ready)
let projects = [
  {
    id: '1',
    title: 'Sistema de Reconocimiento Facial',
    description: 'Desarrollo de un sistema de reconocimiento facial usando deep learning para control de acceso.',
    status: 'activo',
    team: ['Ana García', 'Carlos López'],
    technologies: ['Python', 'TensorFlow', 'OpenCV'],
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    image: '/api/placeholder/600/400',
    repository: 'https://github.com/semillero-guia/facial-recognition',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Chatbot Inteligente para Atención Estudiantil',
    description: 'Bot conversacional con procesamiento de lenguaje natural para resolver dudas académicas.',
    status: 'en-desarrollo',
    team: ['María Rodriguez', 'José Martínez'],
    technologies: ['Python', 'NLTK', 'Flask', 'MongoDB'],
    startDate: '2024-02-01',
    endDate: '2024-08-01',
    image: '/api/placeholder/600/400',
    repository: 'https://github.com/semillero-guia/chatbot-estudiantil',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '3',
    title: 'Análisis Predictivo de Deserción Estudiantil',
    description: 'Modelo de machine learning para predecir riesgo de deserción académica.',
    status: 'completado',
    team: ['Laura Fernández', 'Diego Ramírez'],
    technologies: ['Python', 'Scikit-learn', 'Pandas', 'Jupyter'],
    startDate: '2023-08-01',
    endDate: '2023-12-15',
    image: '/api/placeholder/600/400',
    repository: 'https://github.com/semillero-guia/prediccion-desercion',
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2023-12-15')
  }
];

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getAllProjects = catchAsync(async (req, res, next) => {
  const { status, technology } = req.query;
  
  let filteredProjects = [...projects];
  
  // Filter by status if provided
  if (status) {
    filteredProjects = filteredProjects.filter(project => 
      project.status === status
    );
  }
  
  // Filter by technology if provided
  if (technology) {
    filteredProjects = filteredProjects.filter(project => 
      project.technologies.some(tech => 
        tech.toLowerCase().includes(technology.toLowerCase())
      )
    );
  }
  
  res.status(200).json({
    success: true,
    results: filteredProjects.length,
    data: filteredProjects
  });
});

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public
export const getProjectById = catchAsync(async (req, res, next) => {
  const project = projects.find(p => p.id === req.params.id);
  
  if (!project) {
    return next(new AppError('Proyecto no encontrado', 404));
  }
  
  res.status(200).json({
    success: true,
    data: project
  });
});

// Alias for route compatibility
export const getProject = getProjectById;

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Teacher/Admin)
export const createProject = catchAsync(async (req, res, next) => {
  // Check if user has permission to create projects
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para crear proyectos', 403));
  }
  
  const {
    title,
    description,
    team,
    technologies,
    startDate,
    endDate,
    repository
  } = req.body;
  
  // Validate required fields
  if (!title || !description) {
    return next(new AppError('Título y descripción son requeridos', 400));
  }
  
  // Create new project
  const newProject = {
    id: String(projects.length + 1),
    title,
    description,
    status: 'en-desarrollo',
    team: team || [],
    technologies: technologies || [],
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate,
    image: '/api/placeholder/600/400',
    repository,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  projects.push(newProject);
  
  res.status(201).json({
    success: true,
    data: newProject
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Teacher/Admin)
export const updateProject = catchAsync(async (req, res, next) => {
  // Check if user has permission to update projects
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para actualizar proyectos', 403));
  }
  
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    return next(new AppError('Proyecto no encontrado', 404));
  }
  
  // Update project fields
  const allowedFields = [
    'title', 'description', 'status', 'team', 
    'technologies', 'startDate', 'endDate', 'repository'
  ];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      projects[projectIndex][field] = req.body[field];
    }
  });
  
  projects[projectIndex].updatedAt = new Date();
  
  res.status(200).json({
    success: true,
    data: projects[projectIndex]
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
export const deleteProject = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new AppError('Solo los administradores pueden eliminar proyectos', 403));
  }
  
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    return next(new AppError('Proyecto no encontrado', 404));
  }
  
  projects.splice(projectIndex, 1);
  
  res.status(204).json({
    success: true,
    data: null
  });
});

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Private (Teacher/Admin)
export const getProjectStats = catchAsync(async (req, res, next) => {
  // Check if user has permission
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para ver estadísticas', 403));
  }
  
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'activo').length,
    inDevelopment: projects.filter(p => p.status === 'en-desarrollo').length,
    completed: projects.filter(p => p.status === 'completado').length,
    technologies: {}
  };
  
  // Count technologies
  projects.forEach(project => {
    project.technologies.forEach(tech => {
      stats.technologies[tech] = (stats.technologies[tech] || 0) + 1;
    });
  });
  
  res.status(200).json({
    success: true,
    data: stats
  });
});