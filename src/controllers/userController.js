import User from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  res.status(200).json({
    success: true,
    data: user.toPublicJSON(),
  });
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
export const updateMe = catchAsync(async (req, res, next) => {
  // Create filtered object with allowed fields
  const allowedFields = [
    "name",
    "career",
    "semester",
    "roleInSemillero",
    "skills",
    "socialLinks",
  ];
  const filteredBody = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // Don't allow password updates through this route
  if (req.body.password) {
    return next(
      new AppError(
        "Esta ruta no es para actualizar contraseñas. Usa /update-password",
        400
      )
    );
  }

  const updatedUser = await User.findByPk(req.user.id);
  await updatedUser.update(filteredBody);

  res.status(200).json({
    success: true,
    data: updatedUser.toPublicJSON(),
  });
});

// @desc    Get all users (Admin/Teacher only)
// @route   GET /api/users
// @access  Private (Admin/Teacher)
export const getAllUsers = catchAsync(async (req, res, next) => {
  // Check if user has admin or teacher role
  if (req.user.role !== "admin" && req.user.role !== "docente") {
    return next(
      new AppError("No tienes permisos para acceder a esta información", 403)
    );
  }

  const users = await User.find().select('-password');

  res.status(200).json({
    success: true,
    results: users.length,
    data: users,
  });
});

// @desc    Get user by ID (Admin/Teacher only)
// @route   GET /api/users/:id
// @access  Private (Admin/Teacher)
export const getUserById = catchAsync(async (req, res, next) => {
  // Check if user has admin or teacher role
  if (req.user.role !== "admin" && req.user.role !== "docente") {
    return next(
      new AppError("No tienes permisos para acceder a esta información", 403)
    );
  }

  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Get user by ID (simplified for routes)
// @route   GET /api/users/:id
// @access  Private
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return next(
      new AppError("Solo los administradores pueden cambiar roles", 403)
    );
  }

  const { role } = req.body;

  if (!["estudiante", "docente", "admin"].includes(role)) {
    return next(new AppError("Rol inválido", 400));
  }

  const user = await User.findByPk(req.params.id);

  if (!user) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  await user.update({ role });

  res.status(200).json({
    success: true,
    data: user.toPublicJSON(),
  });
});

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return next(
      new AppError("Solo los administradores pueden actualizar usuarios", 403)
    );
  }

  // Create filtered object with allowed fields
  const allowedFields = [
    "name",
    "email",
    "role",
    "career",
    "semester",
    "roleInSemillero",
    "skills",
    "socialLinks",
  ];
  const filteredBody = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // Don't allow password updates through this route
  if (req.body.password) {
    return next(
      new AppError("Esta ruta no es para actualizar contraseñas", 400)
    );
  }

  const updatedUser = await User.findByPk(req.params.id);

  if (!updatedUser) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  await updatedUser.update(filteredBody);

  res.status(200).json({
    success: true,
    data: updatedUser.toPublicJSON(),
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return next(
      new AppError("Solo los administradores pueden eliminar usuarios", 403)
    );
  }

  // Don't allow admin to delete themselves
  if (req.params.id === req.user.id) {
    return next(new AppError("No puedes eliminar tu propia cuenta", 400));
  }

  const user = await User.findByPk(req.params.id);

  if (!user) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  await user.destroy();

  res.status(204).json({
    success: true,
    data: null,
  });
});

// @desc    Get team members for public display
// @route   GET /api/users/team
// @access  Public
export const getTeamMembers = catchAsync(async (req, res, next) => {
  // Mock data for team members (replace with actual database query)
  const teamMembers = [
    {
      id: "1",
      name: "Ana García Rodríguez",
      role: "Coordinadora del Semillero",
      career: "Ingeniería de Sistemas",
      semester: 9,
      roleInSemillero: "Coordinadora General",
      skills: ["Python", "TensorFlow", "Machine Learning", "Deep Learning"],
      bio: "Estudiante apasionada por la inteligencia artificial y el machine learning. Lidera proyectos de investigación en redes neuronales.",
      image: "/api/placeholder/300/300",
      socialLinks: {
        github: "https://github.com/ana-garcia",
        linkedin: "https://linkedin.com/in/ana-garcia-ia",
        email: "ana.garcia@correounivalle.edu.co",
      },
      achievements: ["Mejor proyecto de grado 2023", "Ponente en COLCACI 2024"],
      joinDate: "2022-02-15",
    },
    {
      id: "2",
      name: "Carlos López Mendoza",
      role: "Desarrollador Senior",
      career: "Ingeniería de Sistemas",
      semester: 8,
      roleInSemillero: "Líder de Desarrollo",
      skills: ["Python", "React", "Node.js", "MongoDB", "Docker"],
      bio: "Especialista en desarrollo full-stack con enfoque en aplicaciones de IA. Mentor de nuevos miembros.",
      image: "/api/placeholder/300/300",
      socialLinks: {
        github: "https://github.com/carlos-lopez",
        linkedin: "https://linkedin.com/in/carlos-lopez-dev",
        email: "carlos.lopez@correounivalle.edu.co",
      },
      achievements: [
        "Hackathon Univalle 2023 - 1er lugar",
        "Certificación TensorFlow Developer",
      ],
      joinDate: "2022-03-20",
    },
    {
      id: "3",
      name: "María Fernández Silva",
      role: "Investigadora",
      career: "Ingeniería Electrónica",
      semester: 7,
      roleInSemillero: "Especialista en Visión Computacional",
      skills: ["OpenCV", "PyTorch", "Computer Vision", "Image Processing"],
      bio: "Investigadora enfocada en visión computacional y procesamiento de imágenes médicas.",
      image: "/api/placeholder/300/300",
      socialLinks: {
        github: "https://github.com/maria-fernandez",
        linkedin: "https://linkedin.com/in/maria-fernandez-cv",
        email: "maria.fernandez@correounivalle.edu.co",
      },
      achievements: [
        "Publicación en revista indexada",
        "Beca de investigación Minciencias",
      ],
      joinDate: "2022-08-10",
    },
    {
      id: "4",
      name: "Diego Ramírez Castro",
      role: "Analista de Datos",
      career: "Estadística",
      semester: 6,
      roleInSemillero: "Especialista en Data Science",
      skills: ["R", "Python", "Pandas", "Scikit-learn", "Tableau"],
      bio: "Experto en análisis de datos y estadística aplicada a problemas de inteligencia artificial.",
      image: "/api/placeholder/300/300",
      socialLinks: {
        github: "https://github.com/diego-ramirez",
        linkedin: "https://linkedin.com/in/diego-ramirez-stats",
        email: "diego.ramirez@correounivalle.edu.co",
      },
      achievements: [
        "Competencia Kaggle - Top 10%",
        "Certificación Google Analytics",
      ],
      joinDate: "2023-01-15",
    },
    {
      id: "5",
      name: "Laura Jiménez Torres",
      role: "Desarrolladora Junior",
      career: "Ingeniería de Sistemas",
      semester: 5,
      roleInSemillero: "Desarrolladora Frontend",
      skills: ["JavaScript", "React", "Vue.js", "CSS", "UX/UI"],
      bio: "Desarrolladora frontend especializada en interfaces de usuario para aplicaciones de IA.",
      image: "/api/placeholder/300/300",
      socialLinks: {
        github: "https://github.com/laura-jimenez",
        linkedin: "https://linkedin.com/in/laura-jimenez-frontend",
        email: "laura.jimenez@correounivalle.edu.co",
      },
      achievements: ["Mejor interfaz de usuario - Demo Day 2023"],
      joinDate: "2023-02-28",
    },
    {
      id: "6",
      name: "Prof. María López Herrera",
      role: "Asesora Académica",
      career: "Docente - Escuela de Ingeniería de Sistemas",
      semester: null,
      roleInSemillero: "Directora Académica",
      skills: [
        "Machine Learning",
        "Deep Learning",
        "Investigación",
        "Publicaciones",
      ],
      bio: "Doctora en Ciencias de la Computación con especialización en Inteligencia Artificial. Mentora y guía académica del semillero.",
      image: "/api/placeholder/300/300",
      socialLinks: {
        linkedin: "https://linkedin.com/in/maria-lopez-phd",
        email: "maria.lopez@correounivalle.edu.co",
        scholar: "https://scholar.google.com/citations?user=marialopez",
      },
      achievements: [
        "Ph.D. en Computer Science",
        "20+ publicaciones en revistas indexadas",
        "Premio a la excelencia docente 2022",
      ],
      joinDate: "2021-08-01",
    },
  ];

  res.status(200).json({
    success: true,
    results: teamMembers.length,
    data: teamMembers,
  });
});
