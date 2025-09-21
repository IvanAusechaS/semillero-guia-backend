import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// GET /api/assignments/my - Obtener asignaciones del usuario actual
const getMyAssignments = catchAsync(async (req, res, next) => {
  const { 
    status, 
    priority, 
    page = 1, 
    limit = 20,
    project,
    search 
  } = req.query;
  
  const userId = req.user._id;

  // Construir filtro
  const filter = {
    assignedTo: userId,
    isActive: true
  };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;
  
  // Búsqueda por texto
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Paginación
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Consulta con populate
  const assignments = await Assignment.find(filter)
    .populate('project', 'title description status')
    .populate('assignedBy', 'name email role')
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1, priority: -1, createdAt: -1 })
    .limit(limitNum)
    .skip(skip);

  // Contar total para paginación
  const total = await Assignment.countDocuments(filter);

  // Estadísticas adicionales
  const stats = await Assignment.aggregate([
    { $match: { assignedTo: userId, isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Próximas fechas de vencimiento
  const upcomingDeadlines = await Assignment.getUpcomingDeadlines(userId, 7);

  res.status(200).json({
    status: 'success',
    results: assignments.length,
    assignments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1
    },
    stats: stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    upcomingDeadlines
  });
});

// GET /api/assignments/:id - Obtener asignación específica
const getAssignmentById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  const assignment = await Assignment.findById(id)
    .populate('project', 'title description status supervisor')
    .populate('assignedTo', 'name email role profileImage')
    .populate('assignedBy', 'name email role profileImage');

  if (!assignment) {
    return next(new AppError('Asignación no encontrada', 404));
  }

  // Verificar permisos
  if (!assignment.canBeViewedBy(userId)) {
    return next(new AppError('No tienes permisos para ver esta asignación', 403));
  }

  // Obtener estadísticas de submissions si es docente/admin
  let submissionStats = null;
  if (req.user.role === 'docente' || req.user.role === 'admin') {
    const { default: Submission } = await import('../models/Submission.js');
    submissionStats = await Submission.aggregate([
      { $match: { assignment: assignment._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
  }

  res.status(200).json({
    status: 'success',
    assignment,
    submissionStats: submissionStats ? submissionStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}) : null
  });
});

// GET /api/assignments - Obtener todas las asignaciones (admin/docente)
const getAllAssignments = catchAsync(async (req, res, next) => {
  const { 
    status, 
    priority, 
    page = 1, 
    limit = 20,
    project,
    assignedBy,
    search 
  } = req.query;

  // Solo admin y docentes pueden ver todas las asignaciones
  if (req.user.role !== 'admin' && req.user.role !== 'docente') {
    return next(new AppError('No tienes permisos para realizar esta acción', 403));
  }

  // Construir filtro
  const filter = { isActive: true };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;
  if (assignedBy) filter.assignedBy = assignedBy;
  
  // Si es docente, solo ver sus asignaciones
  if (req.user.role === 'docente') {
    filter.assignedBy = req.user._id;
  }
  
  // Búsqueda por texto
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Paginación
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Consulta
  let assignments = [];
  let total = 0;
  
  try {
    assignments = await Assignment.find(filter)
      .populate('project', 'title description')
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    total = await Assignment.countDocuments(filter);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return next(new AppError('Error al obtener las asignaciones', 500));
  }

  res.status(200).json({
    status: 'success',
    results: assignments ? assignments.length : 0,
    assignments: assignments || [],
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// POST /api/assignments - Crear nueva asignación
const createAssignment = catchAsync(async (req, res, next) => {
  // Solo docentes y admins pueden crear asignaciones
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para crear asignaciones', 403));
  }

  const {
    title,
    description,
    project,
    assignedTo,
    dueDate,
    priority,
    instructions,
    deliverables,
    estimatedHours,
    maxPoints,
    allowLateSubmissions,
    lateSubmissionPenalty,
    fileTypes,
    maxFileSize,
    tags
  } = req.body;

  // Debug: Log del body recibido
  console.log('📝 CREATE ASSIGNMENT - Body recibido:', JSON.stringify(req.body, null, 2));
  console.log('📝 assignedTo value:', assignedTo);
  console.log('📝 assignedTo type:', typeof assignedTo);
  console.log('📝 assignedTo is array:', Array.isArray(assignedTo));

  // Verificar que el proyecto existe
  const projectExists = await Project.findById(project);
  if (!projectExists) {
    return next(new AppError('El proyecto especificado no existe', 404));
  }

  // Verificar y normalizar assignedTo
  let normalizedAssignedTo = [];
  if (assignedTo) {
    if (Array.isArray(assignedTo)) {
      normalizedAssignedTo = assignedTo;
    } else if (typeof assignedTo === 'string') {
      normalizedAssignedTo = [assignedTo];
    } else {
      return next(new AppError('assignedTo debe ser un array de IDs de usuario o un string', 400));
    }
  }

  console.log('📝 normalizedAssignedTo:', normalizedAssignedTo);

  // Verificar que los usuarios asignados existen
  if (normalizedAssignedTo.length > 0) {
    const users = await User.find({ _id: { $in: normalizedAssignedTo } });
    if (users.length !== normalizedAssignedTo.length) {
      return next(new AppError('Algunos usuarios asignados no existen', 404));
    }
  }

  console.log('🔍 About to create assignment...');
  console.log('🔍 deliverables:', deliverables);
  console.log('🔍 fileTypes:', fileTypes);
  console.log('🔍 tags:', tags);

  // Crear la asignación
  let assignment;
  try {
    assignment = await Assignment.create({
      title,
      description,
      project,
      assignedTo: normalizedAssignedTo,
      assignedBy: req.user._id,
      dueDate,
      priority,
      instructions,
      deliverables,
      estimatedHours,
      maxPoints,
      allowLateSubmissions,
      lateSubmissionPenalty,
      fileTypes,
      maxFileSize,
      tags
    });

    console.log('✅ Assignment created successfully:', assignment._id);
  } catch (createError) {
    console.error('❌ Error creating assignment:', createError);
    return next(new AppError('Error al crear la asignación: ' + createError.message, 400));
  }

  console.log('🔍 About to populate assignment...');
  console.log('🔍 assignment before populate:', assignment ? 'exists' : 'undefined');

  // Temporal: Enviar respuesta sin populate para debug
  console.log('🔍 Sending response without populate for debugging...');
  res.status(201).json({
    status: 'success',
    assignment: {
      _id: assignment._id,
      title: assignment.title,
      project: assignment.project,
      assignedTo: assignment.assignedTo,
      assignedBy: assignment.assignedBy,
      status: assignment.status,
      priority: assignment.priority,
      createdAt: assignment.createdAt
    },
    message: 'Assignment created successfully (debug mode)'
  });
  console.log('✅ Response sent successfully (debug mode)');
  return;

  // Populate para respuesta (comentado temporalmente)
  /*
  try {
    await assignment.populate([
      { path: 'project', select: 'title description' },
      { path: 'assignedBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email' }
    ]);
    console.log('✅ Assignment populated successfully');
  } catch (populateError) {
    console.error('❌ Error in populate:', populateError);
    return next(new AppError('Error al poblar la asignación: ' + populateError.message, 500));
  }

  console.log('🔍 About to send response...');
  res.status(201).json({
    status: 'success',
    assignment
  });
  console.log('✅ Response sent successfully');
  */
});

// PUT /api/assignments/:id - Actualizar asignación
const updateAssignment = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return next(new AppError('Asignación no encontrada', 404));
  }

  // Verificar permisos
  if (!assignment.canBeEditedBy(req.user._id) && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para editar esta asignación', 403));
  }

  // Actualizar
  const updatedAssignment = await Assignment.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('project', 'title description')
    .populate('assignedBy', 'name email role')
    .populate('assignedTo', 'name email');

  res.status(200).json({
    status: 'success',
    assignment: updatedAssignment
  });
});

// DELETE /api/assignments/:id - Eliminar asignación (soft delete)
const deleteAssignment = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return next(new AppError('Asignación no encontrada', 404));
  }

  // Verificar permisos
  if (!assignment.canBeEditedBy(req.user._id) && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para eliminar esta asignación', 403));
  }

  // Soft delete
  assignment.isActive = false;
  await assignment.save();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// PUT /api/assignments/:id/status - Actualizar estado de asignación
const updateAssignmentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return next(new AppError('Asignación no encontrada', 404));
  }

  // Los estudiantes pueden actualizar a 'en_progreso' o 'completado'
  if (assignment.assignedTo.includes(req.user._id)) {
    if (!['en_progreso', 'completado'].includes(status)) {
      return next(new AppError('Estado no válido para estudiantes', 400));
    }
  } else if (!assignment.canBeEditedBy(req.user._id) && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para cambiar el estado', 403));
  }

  assignment.status = status;
  await assignment.save();

  res.status(200).json({
    status: 'success',
    assignment
  });
});

// GET /api/projects/:projectId/assignments - Obtener asignaciones de un proyecto
const getProjectAssignments = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20, status } = req.query;

  // Verificar que el proyecto existe
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Proyecto no encontrado', 404));
  }

  // Construir filtro
  const filter = {
    project: projectId,
    isActive: true
  };

  if (status) filter.status = status;

  // Si es estudiante, solo ver sus asignaciones del proyecto
  if (req.user.role === 'estudiante') {
    filter.assignedTo = req.user._id;
  }

  // Paginación
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const assignments = await Assignment.find(filter)
    .populate('assignedBy', 'name email role')
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1 })
    .limit(limitNum)
    .skip(skip);

  const total = await Assignment.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: assignments.length,
    assignments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

export {
  getMyAssignments,
  getAssignmentById,
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
  getProjectAssignments
};