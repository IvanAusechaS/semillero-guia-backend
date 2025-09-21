import Project from '../models/Project.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getAllProjects = catchAsync(async (req, res, next) => {
  const { status, technology, page = 1, limit = 10 } = req.query;
  
  // Construir filtro
  const filter = {};
  
  // Filter by status if provided
  if (status) {
    filter.status = status;
  }
  
  // Filter by technology if provided (buscar en array de technologies)
  if (technology) {
    filter.technologies = { $regex: technology, $options: 'i' };
  }
  
  // Paginación
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Consulta con populate
  const projects = await Project.find(filter)
    .populate('createdBy', 'name email role')
    .populate('team.user', 'name email profileImage')
    .sort({ featured: -1, createdAt: -1 })
    .limit(limitNum)
    .skip(skip);

  const total = await Project.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    results: projects.length,
    data: projects,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1
    }
  });
});

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public
export const getProjectById = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'name email role profileImage')
    .populate('team.user', 'name email profileImage role');
  
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
    shortDescription,
    technologies,
    status,
    team,
    startDate,
    endDate,
    repositoryUrl,
    demoUrl,
    images,
    featured
  } = req.body;
  
  // Validate required fields
  if (!title || !description) {
    return next(new AppError('Título y descripción son requeridos', 400));
  }

  // Validar fechas
  if (endDate && new Date(startDate) >= new Date(endDate)) {
    return next(new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400));
  }

  // Validar miembros del equipo si se proporcionan
  if (team && team.length > 0) {
    const userIds = team.map(member => member.user);
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return next(new AppError('Algunos miembros del equipo no existen', 404));
    }
  }
  
  // Create new project
  const newProject = await Project.create({
    title,
    description,
    shortDescription,
    technologies: technologies || [],
    status: status || 'planificado',
    team: team || [],
    startDate: startDate || new Date(),
    endDate,
    repositoryUrl,
    demoUrl,
    images: images || [],
    featured: featured || false,
    createdBy: req.user._id
  });

  // Populate para respuesta
  await newProject.populate([
    { path: 'createdBy', select: 'name email role' },
    { path: 'team.user', select: 'name email profileImage' }
  ]);
  
  res.status(201).json({
    success: true,
    data: newProject
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Teacher/Admin/Creator)
export const updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('Proyecto no encontrado', 404));
  }

  // Check permissions: admin, docente, or project creator
  if (req.user.role !== 'admin' && 
      req.user.role !== 'docente' && 
      project.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('No tienes permisos para actualizar este proyecto', 403));
  }

  // Validar fechas si se actualizan
  if (req.body.endDate && req.body.startDate) {
    if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
      return next(new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400));
    }
  }

  // Validar miembros del equipo si se actualizan
  if (req.body.team && req.body.team.length > 0) {
    const userIds = req.body.team.map(member => member.user);
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return next(new AppError('Algunos miembros del equipo no existen', 404));
    }
  }
  
  // Update project
  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    { 
      new: true, 
      runValidators: true 
    }
  )
    .populate('createdBy', 'name email role')
    .populate('team.user', 'name email profileImage');
  
  res.status(200).json({
    success: true,
    data: updatedProject
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin or Creator)
export const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('Proyecto no encontrado', 404));
  }

  // Check permissions: admin or project creator
  if (req.user.role !== 'admin' && 
      project.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Solo los administradores o creadores del proyecto pueden eliminarlo', 403));
  }

  // Verificar si hay asignaciones asociadas
  const { default: Assignment } = await import('../models/Assignment.js');
  const assignmentCount = await Assignment.countDocuments({ 
    project: req.params.id, 
    isActive: true 
  });

  if (assignmentCount > 0) {
    return next(new AppError('No se puede eliminar un proyecto que tiene asignaciones activas', 400));
  }
  
  await Project.findByIdAndDelete(req.params.id);
  
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
  
  // Aggregate statistics
  const stats = await Project.aggregate([
    {
      $facet: {
        statusCount: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        techCount: [
          { $unwind: '$technologies' },
          { $group: { _id: '$technologies', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        totalProjects: [
          { $count: 'total' }
        ],
        featuredCount: [
          { $match: { featured: true } },
          { $count: 'featured' }
        ]
      }
    }
  ]);

  const result = stats[0];
  
  // Format response
  const formattedStats = {
    total: result.totalProjects[0]?.total || 0,
    featured: result.featuredCount[0]?.featured || 0,
    byStatus: result.statusCount.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    topTechnologies: result.techCount.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
  
  res.status(200).json({
    success: true,
    data: formattedStats
  });
});

// @desc    Join project as team member
// @route   POST /api/projects/:id/join
// @access  Private
export const joinProject = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  
  if (!role) {
    return next(new AppError('El rol es requerido para unirse al proyecto', 400));
  }

  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('Proyecto no encontrado', 404));
  }

  // Verificar si ya es miembro
  const isAlreadyMember = project.team.some(
    member => member.user.toString() === req.user._id.toString()
  );

  if (isAlreadyMember) {
    return next(new AppError('Ya eres miembro de este proyecto', 400));
  }

  // Agregar al equipo
  project.team.push({
    user: req.user._id,
    role: role
  });

  await project.save();

  // Populate para respuesta
  await project.populate('team.user', 'name email profileImage');

  res.status(200).json({
    success: true,
    message: 'Te has unido al proyecto exitosamente',
    data: project
  });
});

// @desc    Leave project
// @route   DELETE /api/projects/:id/leave
// @access  Private
export const leaveProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('Proyecto no encontrado', 404));
  }

  // Verificar si es miembro
  const memberIndex = project.team.findIndex(
    member => member.user.toString() === req.user._id.toString()
  );

  if (memberIndex === -1) {
    return next(new AppError('No eres miembro de este proyecto', 400));
  }

  // Verificar si es el creador
  if (project.createdBy.toString() === req.user._id.toString()) {
    return next(new AppError('El creador del proyecto no puede abandonarlo', 400));
  }

  // Remover del equipo
  project.team.splice(memberIndex, 1);
  await project.save();

  res.status(200).json({
    success: true,
    message: 'Has abandonado el proyecto exitosamente'
  });
});