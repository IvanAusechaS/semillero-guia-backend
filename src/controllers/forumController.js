import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Mock data for forum tasks (replace with database model when ready)
let tasks = [
  {
    id: '1',
    title: 'Implementación de Red Neuronal Convolucional',
    description: 'Desarrollar una CNN para clasificación de imágenes utilizando TensorFlow. Entregar código comentado y reporte técnico.',
    dueDate: '2024-10-15',
    professor: 'Prof. María López',
    professorId: 'prof1',
    subject: 'Deep Learning',
    status: 'active',
    maxFileSize: '10MB',
    allowedFileTypes: ['.pdf', '.py', '.ipynb'],
    submissions: [
      {
        id: 'sub1',
        studentId: 'student1',
        studentName: 'Ana García',
        fileName: 'cnn_implementation.pdf',
        fileSize: '2.5MB',
        submittedAt: '2024-09-10T14:30:00Z',
        grade: null,
        feedback: null
      }
    ],
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-09-10T14:30:00Z'
  },
  {
    id: '2',
    title: 'Análisis de Algoritmos de Clustering',
    description: 'Comparar rendimiento de K-means, DBSCAN y hierarchical clustering en diferentes datasets.',
    dueDate: '2024-10-22',
    professor: 'Prof. Carlos Rodríguez',
    professorId: 'prof2',
    subject: 'Machine Learning',
    status: 'active',
    maxFileSize: '15MB',
    allowedFileTypes: ['.pdf', '.py', '.R'],
    submissions: [],
    createdAt: '2024-09-08T09:00:00Z',
    updatedAt: '2024-09-08T09:00:00Z'
  }
];

let submissions = [
  {
    id: 'sub1',
    taskId: '1',
    studentId: 'student1',
    studentName: 'Ana García',
    fileName: 'cnn_implementation.pdf',
    originalName: 'CNN_Implementation_Ana_Garcia.pdf',
    fileSize: '2621440', // bytes
    mimeType: 'application/pdf',
    filePath: '/uploads/submissions/cnn_implementation.pdf',
    submittedAt: '2024-09-10T14:30:00Z',
    grade: null,
    feedback: null,
    isLate: false
  }
];

// @desc    Get all tasks
// @route   GET /api/forum
// @access  Private
export const getAllTasks = catchAsync(async (req, res, next) => {
  const { status, subject } = req.query;
  
  let filteredTasks = [...tasks];
  
  // Filter by status if provided
  if (status) {
    filteredTasks = filteredTasks.filter(task => task.status === status);
  }
  
  // Filter by subject if provided
  if (subject) {
    filteredTasks = filteredTasks.filter(task => 
      task.subject.toLowerCase().includes(subject.toLowerCase())
    );
  }
  
  // If user is student, only show active tasks
  if (req.user.role === 'estudiante') {
    filteredTasks = filteredTasks.filter(task => task.status === 'active');
  }
  
  res.status(200).json({
    success: true,
    results: filteredTasks.length,
    data: filteredTasks
  });
});

// Aliases for route compatibility
export const getAssignments = getAllTasks;

// @desc    Get task by ID
// @route   GET /api/forum/:id
// @access  Private
export const getTaskById = catchAsync(async (req, res, next) => {
  const task = tasks.find(t => t.id === req.params.id);
  
  if (!task) {
    return next(new AppError('Tarea no encontrada', 404));
  }
  
  // If user is student, only show active tasks
  if (req.user.role === 'estudiante' && task.status !== 'active') {
    return next(new AppError('Tarea no encontrada', 404));
  }
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Create new task
// @route   POST /api/forum
// @access  Private (Teacher/Admin)
export const createTask = catchAsync(async (req, res, next) => {
  // Check if user has permission to create tasks
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para crear tareas', 403));
  }
  
  const {
    title,
    description,
    dueDate,
    subject,
    maxFileSize,
    allowedFileTypes
  } = req.body;
  
  // Validate required fields
  if (!title || !description || !dueDate) {
    return next(new AppError('Título, descripción y fecha de entrega son requeridos', 400));
  }
  
  // Create new task
  const newTask = {
    id: String(tasks.length + 1),
    title,
    description,
    dueDate,
    professor: req.user.name,
    professorId: req.user.id,
    subject: subject || 'General',
    status: 'active',
    maxFileSize: maxFileSize || '10MB',
    allowedFileTypes: allowedFileTypes || ['.pdf'],
    submissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  
  res.status(201).json({
    success: true,
    data: newTask
  });
});

// Aliases for route compatibility
export const createAssignment = createTask;

// @desc    Update task
// @route   PUT /api/forum/:id
// @access  Private (Teacher/Admin - only own tasks)
export const updateTask = catchAsync(async (req, res, next) => {
  const task = tasks.find(t => t.id === req.params.id);
  
  if (!task) {
    return next(new AppError('Tarea no encontrada', 404));
  }
  
  // Check if user has permission to update this task
  if (req.user.role !== 'admin' && task.professorId !== req.user.id) {
    return next(new AppError('No tienes permisos para actualizar esta tarea', 403));
  }
  
  // Update task fields
  const allowedFields = [
    'title', 'description', 'dueDate', 'subject', 
    'status', 'maxFileSize', 'allowedFileTypes'
  ];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  });
  
  task.updatedAt = new Date().toISOString();
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Delete task
// @route   DELETE /api/forum/:id
// @access  Private (Teacher/Admin - only own tasks)
export const deleteTask = catchAsync(async (req, res, next) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return next(new AppError('Tarea no encontrada', 404));
  }
  
  const task = tasks[taskIndex];
  
  // Check if user has permission to delete this task
  if (req.user.role !== 'admin' && task.professorId !== req.user.id) {
    return next(new AppError('No tienes permisos para eliminar esta tarea', 403));
  }
  
  // Remove related submissions
  submissions = submissions.filter(sub => sub.taskId !== req.params.id);
  
  // Remove task
  tasks.splice(taskIndex, 1);
  
  res.status(204).json({
    success: true,
    data: null
  });
});

// @desc    Submit file for task
// @route   POST /api/forum/:id/submit
// @access  Private (Students)
export const submitTask = catchAsync(async (req, res, next) => {
  const task = tasks.find(t => t.id === req.params.id);
  
  if (!task) {
    return next(new AppError('Tarea no encontrada', 404));
  }
  
  if (task.status !== 'active') {
    return next(new AppError('Esta tarea ya no acepta entregas', 400));
  }
  
  // Check if file was uploaded
  if (!req.file) {
    return next(new AppError('Debes subir un archivo', 400));
  }
  
  // Check if student already submitted
  const existingSubmission = submissions.find(
    sub => sub.taskId === req.params.id && sub.studentId === req.user.id
  );
  
  if (existingSubmission) {
    return next(new AppError('Ya has enviado una entrega para esta tarea', 400));
  }
  
  // Check if submission is late
  const isLate = new Date() > new Date(task.dueDate);
  
  // Create submission
  const newSubmission = {
    id: `sub${submissions.length + 1}`,
    taskId: req.params.id,
    studentId: req.user.id,
    studentName: req.user.name,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileSize: req.file.size.toString(),
    mimeType: req.file.mimetype,
    filePath: req.file.path,
    submittedAt: new Date().toISOString(),
    grade: null,
    feedback: null,
    isLate
  };
  
  submissions.push(newSubmission);
  
  // Add submission to task
  task.submissions.push({
    id: newSubmission.id,
    studentId: req.user.id,
    studentName: req.user.name,
    fileName: req.file.filename,
    fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
    submittedAt: newSubmission.submittedAt,
    grade: null,
    feedback: null
  });
  
  task.updatedAt = new Date().toISOString();
  
  res.status(201).json({
    success: true,
    message: isLate ? 'Entrega enviada (tarde)' : 'Entrega enviada exitosamente',
    data: newSubmission
  });
});

// @desc    Get submissions for a task
// @route   GET /api/forum/:id/submissions
// @access  Private (Teacher/Admin - only own tasks)
export const getTaskSubmissions = catchAsync(async (req, res, next) => {
  const task = tasks.find(t => t.id === req.params.id);
  
  if (!task) {
    return next(new AppError('Tarea no encontrada', 404));
  }
  
  // Check if user has permission to view submissions
  if (req.user.role !== 'admin' && task.professorId !== req.user.id) {
    return next(new AppError('No tienes permisos para ver las entregas de esta tarea', 403));
  }
  
  const taskSubmissions = submissions.filter(sub => sub.taskId === req.params.id);
  
  res.status(200).json({
    success: true,
    results: taskSubmissions.length,
    data: taskSubmissions
  });
});

// @desc    Grade submission
// @route   PUT /api/forum/:taskId/submissions/:submissionId/grade
// @access  Private (Teacher/Admin - only own tasks)
export const gradeSubmission = catchAsync(async (req, res, next) => {
  const { grade, feedback } = req.body;
  
  const task = tasks.find(t => t.id === req.params.taskId);
  
  if (!task) {
    return next(new AppError('Tarea no encontrada', 404));
  }
  
  // Check if user has permission to grade this task
  if (req.user.role !== 'admin' && task.professorId !== req.user.id) {
    return next(new AppError('No tienes permisos para calificar esta tarea', 403));
  }
  
  const submission = submissions.find(sub => sub.id === req.params.submissionId);
  
  if (!submission) {
    return next(new AppError('Entrega no encontrada', 404));
  }
  
  if (submission.taskId !== req.params.taskId) {
    return next(new AppError('La entrega no pertenece a esta tarea', 400));
  }
  
  // Validate grade
  if (grade !== undefined && (grade < 0 || grade > 5)) {
    return next(new AppError('La calificación debe estar entre 0 y 5', 400));
  }
  
  // Update submission
  submission.grade = grade;
  submission.feedback = feedback;
  
  // Update task submission
  const taskSubmission = task.submissions.find(sub => sub.id === req.params.submissionId);
  if (taskSubmission) {
    taskSubmission.grade = grade;
    taskSubmission.feedback = feedback;
  }
  
  res.status(200).json({
    success: true,
    data: submission
  });
});

// @desc    Get my submissions
// @route   GET /api/forum/my-submissions
// @access  Private (Students)
export const getMySubmissions = catchAsync(async (req, res, next) => {
  const mySubmissions = submissions.filter(sub => sub.studentId === req.user.id);
  
  // Add task information to each submission
  const enrichedSubmissions = mySubmissions.map(submission => {
    const task = tasks.find(t => t.id === submission.taskId);
    return {
      ...submission,
      taskTitle: task ? task.title : 'Tarea eliminada',
      taskSubject: task ? task.subject : 'N/A',
      taskDueDate: task ? task.dueDate : null
    };
  });
  
  res.status(200).json({
    success: true,
    results: enrichedSubmissions.length,
    data: enrichedSubmissions
  });
});

// Additional aliases for route compatibility
export const getAssignment = getTaskById;
export const submitAssignment = submitTask;
export const getSubmissions = getTaskSubmissions;