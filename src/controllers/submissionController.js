import Submission from '../models/Submission.js';
import Assignment from '../models/Assignment.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// POST /api/submissions - Crear nueva submission
const createSubmission = catchAsync(async (req, res, next) => {
  const { assignment, content, comments } = req.body;
  const student = req.user._id;
  
  // Verificar que la asignación existe
  const assignmentExists = await Assignment.findById(assignment);
  if (!assignmentExists) {
    return next(new AppError('Asignación no encontrada', 404));
  }

  // Verificar que el usuario está asignado a esta tarea
  if (!assignmentExists.assignedTo.includes(student)) {
    return next(new AppError('No tienes permisos para enviar esta asignación', 403));
  }

  // Verificar que no haya enviado ya
  const existingSubmission = await Submission.findOne({ assignment, student });
  if (existingSubmission) {
    return next(new AppError('Ya has enviado una solución para esta asignación', 400));
  }

  // Verificar fecha de vencimiento si no se permiten entregas tardías
  const now = new Date();
  const isLate = now > assignmentExists.dueDate;
  
  if (isLate && !assignmentExists.allowLateSubmissions) {
    return next(new AppError('Esta asignación ya venció y no permite entregas tardías', 400));
  }

  // Manejar archivos adjuntos
  const attachments = req.files ? req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype
  })) : [];

  const submission = await Submission.create({
    assignment,
    student,
    content,
    attachments,
    comments,
    isLate
  });

  // Populate para respuesta
  await submission.populate([
    { path: 'assignment', select: 'title dueDate maxPoints' },
    { path: 'student', select: 'name email' }
  ]);

  res.status(201).json({
    status: 'success',
    submission
  });
});

// GET /api/assignments/:assignmentId/submissions - Obtener submissions de una asignación
const getAssignmentSubmissions = catchAsync(async (req, res, next) => {
  const { assignmentId } = req.params;
  const { page = 1, limit = 20, status } = req.query;

  // Verificar que la asignación existe
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return next(new AppError('Asignación no encontrada', 404));
  }

  // Solo docentes/admins o el creador pueden ver todas las submissions
  if (req.user.role === 'estudiante') {
    if (!assignment.assignedTo.includes(req.user._id)) {
      return next(new AppError('No tienes permisos para ver estas entregas', 403));
    }
    
    // Si es estudiante, solo devolver su propia submission
    const mySubmission = await Submission.findOne({ 
      assignment: assignmentId, 
      student: req.user._id 
    })
      .populate('student', 'name email')
      .populate('gradedBy', 'name email');

    return res.status(200).json({
      status: 'success',
      results: mySubmission ? 1 : 0,
      submissions: mySubmission ? [mySubmission] : []
    });
  }

  // Para docentes/admins
  const filter = { assignment: assignmentId };
  if (status) filter.status = status;

  // Paginación
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const submissions = await Submission.find(filter)
    .populate('student', 'name email profileImage')
    .populate('gradedBy', 'name email')
    .sort({ submittedAt: -1 })
    .limit(limitNum)
    .skip(skip);

  const total = await Submission.countDocuments(filter);

  // Estadísticas
  const stats = await Submission.aggregate([
    { $match: { assignment: assignment._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: submissions.length,
    submissions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    },
    stats: stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  });
});

// GET /api/submissions/:id - Obtener submission específica
const getSubmissionById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const submission = await Submission.findById(id)
    .populate('assignment', 'title description dueDate maxPoints')
    .populate('student', 'name email profileImage')
    .populate('gradedBy', 'name email');

  if (!submission) {
    return next(new AppError('Entrega no encontrada', 404));
  }

  // Verificar permisos
  const canView = submission.student._id.toString() === req.user._id.toString() ||
                  req.user.role === 'docente' ||
                  req.user.role === 'admin';

  if (!canView) {
    return next(new AppError('No tienes permisos para ver esta entrega', 403));
  }

  res.status(200).json({
    status: 'success',
    submission
  });
});

// PUT /api/submissions/:id/grade - Calificar submission
const gradeSubmission = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { grade, feedback, status } = req.body;

  // Solo docentes y admins pueden calificar
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para calificar entregas', 403));
  }

  const submission = await Submission.findById(id);
  if (!submission) {
    return next(new AppError('Entrega no encontrada', 404));
  }

  // Validar calificación
  if (grade !== undefined) {
    if (grade < 0 || grade > 5) {
      return next(new AppError('La calificación debe estar entre 0 y 5', 400));
    }
  }

  // Actualizar submission
  const updateData = {
    gradedBy: req.user._id,
    gradedAt: new Date()
  };

  if (grade !== undefined) updateData.grade = grade;
  if (feedback) updateData.feedback = feedback;
  if (status) updateData.status = status;

  const updatedSubmission = await Submission.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('assignment', 'title maxPoints')
    .populate('student', 'name email')
    .populate('gradedBy', 'name email');

  res.status(200).json({
    status: 'success',
    submission: updatedSubmission
  });
});

// PUT /api/submissions/:id - Actualizar submission (solo estudiante)
const updateSubmission = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { content, comments } = req.body;

  const submission = await Submission.findById(id);
  if (!submission) {
    return next(new AppError('Entrega no encontrada', 404));
  }

  // Solo el estudiante puede actualizar su entrega
  if (submission.student.toString() !== req.user._id.toString()) {
    return next(new AppError('Solo puedes editar tus propias entregas', 403));
  }

  // No se puede editar si ya fue calificada
  if (submission.grade || submission.status !== 'enviado') {
    return next(new AppError('No puedes editar una entrega que ya fue revisada', 400));
  }

  // Verificar la asignación para fechas límite
  const assignment = await Assignment.findById(submission.assignment);
  const now = new Date();
  const isLate = now > assignment.dueDate;
  
  if (isLate && !assignment.allowLateSubmissions) {
    return next(new AppError('Ya no puedes editar esta entrega después de la fecha límite', 400));
  }

  // Manejar nuevos archivos si los hay
  let newAttachments = submission.attachments;
  if (req.files && req.files.length > 0) {
    const fileAttachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));
    newAttachments = [...newAttachments, ...fileAttachments];
  }

  const updatedSubmission = await Submission.findByIdAndUpdate(
    id,
    {
      content,
      comments,
      attachments: newAttachments,
      isLate,
      revisionCount: submission.revisionCount + 1
    },
    { new: true, runValidators: true }
  )
    .populate('assignment', 'title dueDate')
    .populate('student', 'name email');

  res.status(200).json({
    status: 'success',
    submission: updatedSubmission
  });
});

// DELETE /api/submissions/:id - Eliminar submission
const deleteSubmission = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const submission = await Submission.findById(id);
  if (!submission) {
    return next(new AppError('Entrega no encontrada', 404));
  }

  // Solo el estudiante o admin pueden eliminar
  const canDelete = submission.student.toString() === req.user._id.toString() ||
                   req.user.role === 'admin';

  if (!canDelete) {
    return next(new AppError('No tienes permisos para eliminar esta entrega', 403));
  }

  // No se puede eliminar si ya fue calificada
  if (submission.grade) {
    return next(new AppError('No puedes eliminar una entrega que ya fue calificada', 400));
  }

  await Submission.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// GET /api/submissions/my - Obtener mis submissions
const getMySubmissions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, assignment } = req.query;

  const filter = { student: req.user._id };
  if (status) filter.status = status;
  if (assignment) filter.assignment = assignment;

  // Paginación
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const submissions = await Submission.find(filter)
    .populate('assignment', 'title dueDate maxPoints project')
    .populate('gradedBy', 'name email')
    .populate({
      path: 'assignment',
      populate: {
        path: 'project',
        select: 'title'
      }
    })
    .sort({ submittedAt: -1 })
    .limit(limitNum)
    .skip(skip);

  const total = await Submission.countDocuments(filter);

  // Estadísticas del estudiante
  let stats = {};
  try {
    const aggregatedStats = await Submission.aggregate([
      { $match: { student: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgGrade: { $avg: '$grade' }
        }
      }
    ]);

    stats = aggregatedStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgGrade: stat.avgGrade || 0
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error calculating stats:', error);
    stats = {};
  }

  res.status(200).json({
    status: 'success',
    results: submissions ? submissions.length : 0,
    submissions: submissions || [],
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    },
    stats
  });
});

export {
  createSubmission,
  getAssignmentSubmissions,
  getSubmissionById,
  gradeSubmission,
  updateSubmission,
  deleteSubmission,
  getMySubmissions
};