import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Mock data for events (replace with database model when ready)
let events = [
  {
    id: '1',
    title: 'Workshop: Introducción a TensorFlow',
    description: 'Taller práctico sobre los fundamentos de TensorFlow para machine learning. Incluye ejercicios hands-on y casos de uso reales.',
    date: '2024-10-15',
    time: '14:00',
    duration: '3 horas',
    location: 'Laboratorio de IA - Edificio 383',
    type: 'workshop',
    instructor: 'Prof. María López',
    capacity: 25,
    registered: 18,
    status: 'upcoming',
    tags: ['tensorflow', 'machine-learning', 'python'],
    requirements: ['Conocimientos básicos de Python', 'Laptop personal'],
    image: '/api/placeholder/600/400',
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-09-10T15:30:00Z'
  },
  {
    id: '2',
    title: 'Conferencia: IA en la Industria',
    description: 'Charla magistral sobre aplicaciones de inteligencia artificial en diferentes sectores industriales.',
    date: '2024-10-22',
    time: '16:00',
    duration: '2 horas',
    location: 'Auditorio Central',
    type: 'conference',
    instructor: 'Dr. Carlos Rodríguez',
    capacity: 100,
    registered: 45,
    status: 'upcoming',
    tags: ['ia', 'industria', 'aplicaciones'],
    requirements: [],
    image: '/api/placeholder/600/400',
    createdAt: '2024-09-05T09:00:00Z',
    updatedAt: '2024-09-05T09:00:00Z'
  },
  {
    id: '3',
    title: 'Hackathon IA para la Salud',
    description: 'Competencia de 48 horas para desarrollar soluciones de IA aplicadas al sector salud.',
    date: '2024-11-08',
    time: '08:00',
    duration: '48 horas',
    location: 'Campus Univalle - Múltiples espacios',
    type: 'hackathon',
    instructor: 'Equipo Organizador',
    capacity: 60,
    registered: 12,
    status: 'upcoming',
    tags: ['hackathon', 'salud', 'innovacion'],
    requirements: ['Equipo de 3-5 personas', 'Conocimientos en programación'],
    image: '/api/placeholder/600/400',
    createdAt: '2024-09-15T11:00:00Z',
    updatedAt: '2024-09-15T11:00:00Z'
  },
  {
    id: '4',
    title: 'Seminario: Ética en IA',
    description: 'Discusión sobre las implicaciones éticas del desarrollo y uso de sistemas de inteligencia artificial.',
    date: '2024-09-10',
    time: '15:00',
    duration: '1.5 horas',
    location: 'Sala de Conferencias 201',
    type: 'seminar',
    instructor: 'Dra. Ana García',
    capacity: 40,
    registered: 40,
    status: 'completed',
    tags: ['etica', 'filosofia', 'responsabilidad'],
    requirements: [],
    image: '/api/placeholder/600/400',
    createdAt: '2024-08-20T10:00:00Z',
    updatedAt: '2024-09-10T16:30:00Z'
  }
];

let registrations = [
  {
    id: '1',
    eventId: '1',
    userId: 'student1',
    userName: 'Ana García',
    userEmail: 'ana.garcia@correounivalle.edu.co',
    registeredAt: '2024-09-05T10:30:00Z',
    status: 'confirmed'
  },
  {
    id: '2',
    eventId: '4',
    userId: 'student1',
    userName: 'Ana García',
    userEmail: 'ana.garcia@correounivalle.edu.co',
    registeredAt: '2024-09-01T14:20:00Z',
    status: 'attended'
  }
];

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getAllEvents = catchAsync(async (req, res, next) => {
  const { status, type, upcoming } = req.query;
  
  let filteredEvents = [...events];
  
  // Filter by status if provided
  if (status) {
    filteredEvents = filteredEvents.filter(event => event.status === status);
  }
  
  // Filter by type if provided
  if (type) {
    filteredEvents = filteredEvents.filter(event => event.type === type);
  }
  
  // Filter upcoming events
  if (upcoming === 'true') {
    const today = new Date().toISOString().split('T')[0];
    filteredEvents = filteredEvents.filter(event => 
      event.date >= today && event.status === 'upcoming'
    );
  }
  
  // Sort by date
  filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  res.status(200).json({
    success: true,
    results: filteredEvents.length,
    data: filteredEvents
  });
});

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = catchAsync(async (req, res, next) => {
  const event = events.find(e => e.id === req.params.id);
  
  if (!event) {
    return next(new AppError('Evento no encontrado', 404));
  }
  
  res.status(200).json({
    success: true,
    data: event
  });
});

// Alias for route compatibility
export const getEvent = getEventById;

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Teacher/Admin)
export const createEvent = catchAsync(async (req, res, next) => {
  // Check if user has permission to create events
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para crear eventos', 403));
  }
  
  const {
    title,
    description,
    date,
    time,
    duration,
    location,
    type,
    instructor,
    capacity,
    tags,
    requirements
  } = req.body;
  
  // Validate required fields
  if (!title || !description || !date || !time || !location) {
    return next(new AppError('Título, descripción, fecha, hora y ubicación son requeridos', 400));
  }
  
  // Validate event date is not in the past
  const eventDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (eventDate < today) {
    return next(new AppError('La fecha del evento no puede ser en el pasado', 400));
  }
  
  // Create new event
  const newEvent = {
    id: String(events.length + 1),
    title,
    description,
    date,
    time,
    duration: duration || '1 hora',
    location,
    type: type || 'seminar',
    instructor: instructor || req.user.name,
    capacity: capacity || 30,
    registered: 0,
    status: 'upcoming',
    tags: tags || [],
    requirements: requirements || [],
    image: '/api/placeholder/600/400',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  events.push(newEvent);
  
  res.status(201).json({
    success: true,
    data: newEvent
  });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Teacher/Admin)
export const updateEvent = catchAsync(async (req, res, next) => {
  const event = events.find(e => e.id === req.params.id);
  
  if (!event) {
    return next(new AppError('Evento no encontrado', 404));
  }
  
  // Check if user has permission to update events
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para actualizar eventos', 403));
  }
  
  // Don't allow updating past events
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (eventDate < today && event.status === 'completed') {
    return next(new AppError('No se pueden modificar eventos completados', 400));
  }
  
  // Update event fields
  const allowedFields = [
    'title', 'description', 'date', 'time', 'duration', 
    'location', 'type', 'instructor', 'capacity', 'status',
    'tags', 'requirements'
  ];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      event[field] = req.body[field];
    }
  });
  
  event.updatedAt = new Date().toISOString();
  
  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
export const deleteEvent = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(new AppError('Solo los administradores pueden eliminar eventos', 403));
  }
  
  const eventIndex = events.findIndex(e => e.id === req.params.id);
  
  if (eventIndex === -1) {
    return next(new AppError('Evento no encontrado', 404));
  }
  
  // Remove related registrations
  registrations = registrations.filter(reg => reg.eventId !== req.params.id);
  
  // Remove event
  events.splice(eventIndex, 1);
  
  res.status(204).json({
    success: true,
    data: null
  });
});

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
export const registerForEvent = catchAsync(async (req, res, next) => {
  const event = events.find(e => e.id === req.params.id);
  
  if (!event) {
    return next(new AppError('Evento no encontrado', 404));
  }
  
  // Check if event is available for registration
  if (event.status !== 'upcoming') {
    return next(new AppError('Este evento no está disponible para registro', 400));
  }
  
  // Check if event is full
  if (event.registered >= event.capacity) {
    return next(new AppError('El evento está lleno', 400));
  }
  
  // Check if user is already registered
  const existingRegistration = registrations.find(
    reg => reg.eventId === req.params.id && reg.userId === req.user.id
  );
  
  if (existingRegistration) {
    return next(new AppError('Ya estás registrado para este evento', 400));
  }
  
  // Check if event date is not in the past
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (eventDate < today) {
    return next(new AppError('No puedes registrarte para eventos pasados', 400));
  }
  
  // Create registration
  const newRegistration = {
    id: String(registrations.length + 1),
    eventId: req.params.id,
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    registeredAt: new Date().toISOString(),
    status: 'confirmed'
  };
  
  registrations.push(newRegistration);
  
  // Update event registered count
  event.registered += 1;
  event.updatedAt = new Date().toISOString();
  
  res.status(201).json({
    success: true,
    message: 'Registro exitoso para el evento',
    data: newRegistration
  });
});

// @desc    Unregister from event
// @route   DELETE /api/events/:id/register
// @access  Private
export const unregisterFromEvent = catchAsync(async (req, res, next) => {
  const event = events.find(e => e.id === req.params.id);
  
  if (!event) {
    return next(new AppError('Evento no encontrado', 404));
  }
  
  // Find user's registration
  const registrationIndex = registrations.findIndex(
    reg => reg.eventId === req.params.id && reg.userId === req.user.id
  );
  
  if (registrationIndex === -1) {
    return next(new AppError('No estás registrado para este evento', 400));
  }
  
  // Check if event date allows cancellation (at least 24 hours before)
  const eventDateTime = new Date(`${event.date}T${event.time}`);
  const now = new Date();
  const hoursUntilEvent = (eventDateTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilEvent < 24) {
    return next(new AppError('No puedes cancelar tu registro con menos de 24 horas de anticipación', 400));
  }
  
  // Remove registration
  registrations.splice(registrationIndex, 1);
  
  // Update event registered count
  event.registered -= 1;
  event.updatedAt = new Date().toISOString();
  
  res.status(200).json({
    success: true,
    message: 'Registro cancelado exitosamente'
  });
});

// @desc    Get event registrations
// @route   GET /api/events/:id/registrations
// @access  Private (Teacher/Admin)
export const getEventRegistrations = catchAsync(async (req, res, next) => {
  // Check if user has permission to view registrations
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para ver los registros', 403));
  }
  
  const event = events.find(e => e.id === req.params.id);
  
  if (!event) {
    return next(new AppError('Evento no encontrado', 404));
  }
  
  const eventRegistrations = registrations.filter(reg => reg.eventId === req.params.id);
  
  res.status(200).json({
    success: true,
    results: eventRegistrations.length,
    data: eventRegistrations
  });
});

// @desc    Get my registrations
// @route   GET /api/events/my-registrations
// @access  Private
export const getMyRegistrations = catchAsync(async (req, res, next) => {
  const myRegistrations = registrations.filter(reg => reg.userId === req.user.id);
  
  // Add event information to each registration
  const enrichedRegistrations = myRegistrations.map(registration => {
    const event = events.find(e => e.id === registration.eventId);
    return {
      ...registration,
      eventTitle: event ? event.title : 'Evento eliminado',
      eventDate: event ? event.date : null,
      eventTime: event ? event.time : null,
      eventLocation: event ? event.location : null,
      eventType: event ? event.type : null
    };
  });
  
  res.status(200).json({
    success: true,
    results: enrichedRegistrations.length,
    data: enrichedRegistrations
  });
});

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private (Teacher/Admin)
export const getEventStats = catchAsync(async (req, res, next) => {
  // Check if user has permission
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para ver estadísticas', 403));
  }
  
  const stats = {
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    completed: events.filter(e => e.status === 'completed').length,
    totalRegistrations: registrations.length,
    averageAttendance: 0,
    eventTypes: {}
  };
  
  // Count by event type
  events.forEach(event => {
    stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
  });
  
  // Calculate average attendance for completed events
  const completedEvents = events.filter(e => e.status === 'completed');
  if (completedEvents.length > 0) {
    const totalAttendance = completedEvents.reduce((sum, event) => sum + event.registered, 0);
    stats.averageAttendance = Math.round(totalAttendance / completedEvents.length);
  }
  
  res.status(200).json({
    success: true,
    data: stats
  });
});