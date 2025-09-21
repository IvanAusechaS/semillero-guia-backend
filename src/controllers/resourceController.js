import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Mock data for resources (replace with database model when ready)
let resources = [
  {
    id: '1',
    title: 'Introducción a Machine Learning con Python',
    description: 'Guía completa para comenzar en machine learning utilizando Python, scikit-learn y pandas.',
    type: 'tutorial',
    category: 'machine-learning',
    format: 'pdf',
    url: '/api/placeholder/document.pdf',
    downloadUrl: 'https://example.com/ml-intro.pdf',
    author: 'Prof. María López',
    authorId: 'prof1',
    level: 'beginner',
    tags: ['python', 'machine-learning', 'scikit-learn', 'pandas'],
    language: 'español',
    pages: 45,
    fileSize: '2.5MB',
    downloadCount: 127,
    rating: 4.5,
    isPublic: true,
    isFeatured: true,
    createdAt: '2024-08-15T10:00:00Z',
    updatedAt: '2024-08-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Deep Learning Fundamentals',
    description: 'Conceptos fundamentales de deep learning, redes neuronales y aplicaciones prácticas.',
    type: 'book',
    category: 'deep-learning',
    format: 'pdf',
    url: '/api/placeholder/document.pdf',
    downloadUrl: 'https://example.com/deep-learning-fundamentals.pdf',
    author: 'Dr. Carlos Rodríguez',
    authorId: 'prof2',
    level: 'intermediate',
    tags: ['deep-learning', 'neural-networks', 'tensorflow', 'keras'],
    language: 'english',
    pages: 156,
    fileSize: '8.2MB',
    downloadCount: 89,
    rating: 4.8,
    isPublic: true,
    isFeatured: true,
    createdAt: '2024-07-20T14:30:00Z',
    updatedAt: '2024-07-20T14:30:00Z'
  },
  {
    id: '3',
    title: 'Datasets para Práctica en IA',
    description: 'Colección curada de datasets para practicar diferentes técnicas de inteligencia artificial.',
    type: 'dataset',
    category: 'data',
    format: 'zip',
    url: '/api/placeholder/datasets.zip',
    downloadUrl: 'https://example.com/ai-datasets.zip',
    author: 'Equipo Semillero GUIA',
    authorId: 'team',
    level: 'all-levels',
    tags: ['datasets', 'data', 'practice', 'training'],
    language: 'multilingual',
    pages: null,
    fileSize: '245MB',
    downloadCount: 201,
    rating: 4.3,
    isPublic: true,
    isFeatured: false,
    createdAt: '2024-06-10T09:15:00Z',
    updatedAt: '2024-09-01T11:00:00Z'
  },
  {
    id: '4',
    title: 'Plantillas de Código para TensorFlow',
    description: 'Plantillas y ejemplos de código reutilizable para proyectos con TensorFlow.',
    type: 'code',
    category: 'programming',
    format: 'zip',
    url: '/api/placeholder/tensorflow-templates.zip',
    downloadUrl: 'https://github.com/semillero-guia/tensorflow-templates',
    author: 'Ana García',
    authorId: 'student1',
    level: 'intermediate',
    tags: ['tensorflow', 'templates', 'code', 'python'],
    language: 'python',
    pages: null,
    fileSize: '12MB',
    downloadCount: 67,
    rating: 4.2,
    isPublic: true,
    isFeatured: false,
    createdAt: '2024-09-05T16:45:00Z',
    updatedAt: '2024-09-05T16:45:00Z'
  },
  {
    id: '5',
    title: 'Ética en Inteligencia Artificial - Lecturas',
    description: 'Compilación de artículos y lecturas sobre ética, sesgo y responsabilidad en IA.',
    type: 'article',
    category: 'ethics',
    format: 'pdf',
    url: '/api/placeholder/document.pdf',
    downloadUrl: 'https://example.com/ai-ethics-readings.pdf',
    author: 'Dra. Ana García',
    authorId: 'prof3',
    level: 'all-levels',
    tags: ['ethics', 'bias', 'responsibility', 'society'],
    language: 'español',
    pages: 78,
    fileSize: '3.8MB',
    downloadCount: 143,
    rating: 4.7,
    isPublic: true,
    isFeatured: true,
    createdAt: '2024-08-01T12:00:00Z',
    updatedAt: '2024-08-01T12:00:00Z'
  }
];

let downloads = [
  {
    id: '1',
    resourceId: '1',
    userId: 'student1',
    userName: 'Ana García',
    downloadedAt: '2024-09-10T10:30:00Z',
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    resourceId: '2',
    userId: 'student1',
    userName: 'Ana García',
    downloadedAt: '2024-09-12T14:15:00Z',
    ipAddress: '192.168.1.100'
  }
];

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
export const getAllResources = catchAsync(async (req, res, next) => {
  const { 
    category, 
    type, 
    level, 
    format, 
    language,
    featured,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    limit = 10,
    page = 1
  } = req.query;
  
  let filteredResources = [...resources];
  
  // Filter by category
  if (category) {
    filteredResources = filteredResources.filter(resource => 
      resource.category === category
    );
  }
  
  // Filter by type
  if (type) {
    filteredResources = filteredResources.filter(resource => 
      resource.type === type
    );
  }
  
  // Filter by level
  if (level) {
    filteredResources = filteredResources.filter(resource => 
      resource.level === level || resource.level === 'all-levels'
    );
  }
  
  // Filter by format
  if (format) {
    filteredResources = filteredResources.filter(resource => 
      resource.format === format
    );
  }
  
  // Filter by language
  if (language) {
    filteredResources = filteredResources.filter(resource => 
      resource.language === language || resource.language === 'multilingual'
    );
  }
  
  // Filter featured resources
  if (featured === 'true') {
    filteredResources = filteredResources.filter(resource => resource.isFeatured);
  }
  
  // Search in title, description, and tags
  if (search) {
    const searchLower = search.toLowerCase();
    filteredResources = filteredResources.filter(resource => 
      resource.title.toLowerCase().includes(searchLower) ||
      resource.description.toLowerCase().includes(searchLower) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      resource.author.toLowerCase().includes(searchLower)
    );
  }
  
  // Only show public resources unless user is authenticated
  filteredResources = filteredResources.filter(resource => resource.isPublic);
  
  // Sort resources
  filteredResources.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (sortOrder === 'desc') {
      return bVal > aVal ? 1 : -1;
    } else {
      return aVal > bVal ? 1 : -1;
    }
  });
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedResources = filteredResources.slice(startIndex, endIndex);
  
  res.status(200).json({
    success: true,
    results: paginatedResources.length,
    total: filteredResources.length,
    page: parseInt(page),
    pages: Math.ceil(filteredResources.length / limit),
    data: paginatedResources
  });
});

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Public
export const getResourceById = catchAsync(async (req, res, next) => {
  const resource = resources.find(r => r.id === req.params.id);
  
  if (!resource) {
    return next(new AppError('Recurso no encontrado', 404));
  }
  
  if (!resource.isPublic) {
    return next(new AppError('Recurso no disponible', 403));
  }
  
  res.status(200).json({
    success: true,
    data: resource
  });
});

// Alias for route compatibility
export const getResource = getResourceById;

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private (Teacher/Admin)
export const createResource = catchAsync(async (req, res, next) => {
  // Check if user has permission to create resources
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para crear recursos', 403));
  }
  
  const {
    title,
    description,
    type,
    category,
    format,
    downloadUrl,
    level,
    tags,
    language,
    pages,
    fileSize,
    isPublic,
    isFeatured
  } = req.body;
  
  // Validate required fields
  if (!title || !description || !type || !category || !format) {
    return next(new AppError('Título, descripción, tipo, categoría y formato son requeridos', 400));
  }
  
  // Create new resource
  const newResource = {
    id: String(resources.length + 1),
    title,
    description,
    type,
    category,
    format,
    url: req.file ? `/uploads/resources/${req.file.filename}` : '/api/placeholder/document.pdf',
    downloadUrl: downloadUrl || (req.file ? `/uploads/resources/${req.file.filename}` : null),
    author: req.user.name,
    authorId: req.user.id,
    level: level || 'all-levels',
    tags: tags || [],
    language: language || 'español',
    pages: pages || null,
    fileSize: req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)}MB` : fileSize || 'N/A',
    downloadCount: 0,
    rating: 0,
    isPublic: isPublic !== undefined ? isPublic : true,
    isFeatured: isFeatured !== undefined ? isFeatured : false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  resources.push(newResource);
  
  res.status(201).json({
    success: true,
    data: newResource
  });
});

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Teacher/Admin - only own resources)
export const updateResource = catchAsync(async (req, res, next) => {
  const resource = resources.find(r => r.id === req.params.id);
  
  if (!resource) {
    return next(new AppError('Recurso no encontrado', 404));
  }
  
  // Check if user has permission to update this resource
  if (req.user.role !== 'admin' && resource.authorId !== req.user.id) {
    return next(new AppError('No tienes permisos para actualizar este recurso', 403));
  }
  
  // Update resource fields
  const allowedFields = [
    'title', 'description', 'type', 'category', 'format',
    'downloadUrl', 'level', 'tags', 'language', 'pages',
    'fileSize', 'isPublic', 'isFeatured'
  ];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      resource[field] = req.body[field];
    }
  });
  
  resource.updatedAt = new Date().toISOString();
  
  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Teacher/Admin - only own resources or admin)
export const deleteResource = catchAsync(async (req, res, next) => {
  const resourceIndex = resources.findIndex(r => r.id === req.params.id);
  
  if (resourceIndex === -1) {
    return next(new AppError('Recurso no encontrado', 404));
  }
  
  const resource = resources[resourceIndex];
  
  // Check if user has permission to delete this resource
  if (req.user.role !== 'admin' && resource.authorId !== req.user.id) {
    return next(new AppError('No tienes permisos para eliminar este recurso', 403));
  }
  
  // Remove related downloads
  downloads = downloads.filter(download => download.resourceId !== req.params.id);
  
  // Remove resource
  resources.splice(resourceIndex, 1);
  
  res.status(204).json({
    success: true,
    data: null
  });
});

// @desc    Download resource
// @route   GET /api/resources/:id/download
// @access  Private
export const downloadResource = catchAsync(async (req, res, next) => {
  const resource = resources.find(r => r.id === req.params.id);
  
  if (!resource) {
    return next(new AppError('Recurso no encontrado', 404));
  }
  
  if (!resource.isPublic) {
    return next(new AppError('Recurso no disponible', 403));
  }
  
  // Record download
  const newDownload = {
    id: String(downloads.length + 1),
    resourceId: req.params.id,
    userId: req.user ? req.user.id : 'anonymous',
    userName: req.user ? req.user.name : 'Usuario Anónimo',
    downloadedAt: new Date().toISOString(),
    ipAddress: req.ip || 'unknown'
  };
  
  downloads.push(newDownload);
  
  // Increment download count
  resource.downloadCount += 1;
  resource.updatedAt = new Date().toISOString();
  
  res.status(200).json({
    success: true,
    message: 'Descarga iniciada',
    data: {
      downloadUrl: resource.downloadUrl,
      fileName: `${resource.title}.${resource.format}`,
      fileSize: resource.fileSize
    }
  });
});

// @desc    Rate resource
// @route   POST /api/resources/:id/rate
// @access  Private
export const rateResource = catchAsync(async (req, res, next) => {
  const { rating } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError('La calificación debe estar entre 1 y 5', 400));
  }
  
  const resource = resources.find(r => r.id === req.params.id);
  
  if (!resource) {
    return next(new AppError('Recurso no encontrado', 404));
  }
  
  // For simplicity, just update the rating (in real app, you'd store individual ratings)
  // This is a mock implementation
  const currentRating = resource.rating;
  const downloadCount = resource.downloadCount;
  
  // Simple average calculation (not accurate for production)
  const newRating = downloadCount > 0 ? 
    ((currentRating * downloadCount) + rating) / (downloadCount + 1) : 
    rating;
  
  resource.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
  resource.updatedAt = new Date().toISOString();
  
  res.status(200).json({
    success: true,
    message: 'Calificación registrada',
    data: {
      rating: resource.rating
    }
  });
});

// @desc    Get resource categories
// @route   GET /api/resources/categories
// @access  Public
export const getResourceCategories = catchAsync(async (req, res, next) => {
  const categories = [...new Set(resources.map(r => r.category))];
  const types = [...new Set(resources.map(r => r.type))];
  const levels = [...new Set(resources.map(r => r.level))];
  const formats = [...new Set(resources.map(r => r.format))];
  const languages = [...new Set(resources.map(r => r.language))];
  
  res.status(200).json({
    success: true,
    data: {
      categories,
      types,
      levels,
      formats,
      languages
    }
  });
});

// @desc    Get resource statistics
// @route   GET /api/resources/stats
// @access  Private (Teacher/Admin)
export const getResourceStats = catchAsync(async (req, res, next) => {
  // Check if user has permission
  if (req.user.role !== 'docente' && req.user.role !== 'admin') {
    return next(new AppError('No tienes permisos para ver estadísticas', 403));
  }
  
  const stats = {
    total: resources.length,
    public: resources.filter(r => r.isPublic).length,
    featured: resources.filter(r => r.isFeatured).length,
    totalDownloads: downloads.length,
    categories: {},
    types: {},
    averageRating: 0
  };
  
  // Count by category
  resources.forEach(resource => {
    stats.categories[resource.category] = (stats.categories[resource.category] || 0) + 1;
    stats.types[resource.type] = (stats.types[resource.type] || 0) + 1;
  });
  
  // Calculate average rating
  const ratedResources = resources.filter(r => r.rating > 0);
  if (ratedResources.length > 0) {
    const totalRating = ratedResources.reduce((sum, resource) => sum + resource.rating, 0);
    stats.averageRating = Math.round((totalRating / ratedResources.length) * 10) / 10;
  }
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get my downloads
// @route   GET /api/resources/my-downloads
// @access  Private
export const getMyDownloads = catchAsync(async (req, res, next) => {
  const myDownloads = downloads.filter(download => download.userId === req.user.id);
  
  // Add resource information to each download
  const enrichedDownloads = myDownloads.map(download => {
    const resource = resources.find(r => r.id === download.resourceId);
    return {
      ...download,
      resourceTitle: resource ? resource.title : 'Recurso eliminado',
      resourceType: resource ? resource.type : 'N/A',
      resourceCategory: resource ? resource.category : 'N/A',
      resourceAuthor: resource ? resource.author : 'N/A'
    };
  });
  
  res.status(200).json({
    success: true,
    results: enrichedDownloads.length,
    data: enrichedDownloads
  });
});