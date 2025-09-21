import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

// Generar JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Enviar respuesta con token
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user.id);

  // Actualizar último login
  user.update({ lastLogin: new Date() });

  res.status(statusCode).json({
    status: "success",
    message,
    token,
    user: user.toPublicJSON(),
  });
};

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role, career, semester, roleInSemillero } =
    req.body;

  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError("El usuario ya existe con este email", 400));
  }

  // Crear usuario
  const userData = {
    name,
    email,
    password,
    role,
    career,
    roleInSemillero: roleInSemillero || "Miembro",
  };

  // Solo agregar semestre si el rol es estudiante
  if (role === "estudiante") {
    userData.semester = semester;
  }

  const user = await User.create(userData);

  sendTokenResponse(user, 201, res, "Usuario registrado exitosamente");
});

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Buscar usuario
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return next(new AppError("Credenciales inválidas", 401));
  }

  // Verificar password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError("Credenciales inválidas", 401));
  }

  // Verificar si el usuario está activo
  if (!user.isActive) {
    return next(
      new AppError(
        "Tu cuenta ha sido desactivada. Contacta al administrador.",
        401
      )
    );
  }

  sendTokenResponse(user, 200, res, "Inicio de sesión exitoso");
});

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: "success",
    user: user.toPublicJSON(),
  });
});

// @desc    Actualizar perfil
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = catchAsync(async (req, res, next) => {
  const allowedFields = [
    "name",
    "bio",
    "skills",
    "socialLinks",
    "roleInSemillero",
  ];
  const updates = {};

  // Solo permitir campos específicos
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "Perfil actualizado exitosamente",
    user: user.toPublicJSON(),
  });
});

// @desc    Cambiar contraseña
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Obtener usuario con password
  const user = await User.findById(req.user.id).select("+password");

  // Verificar contraseña actual
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError("La contraseña actual es incorrecta", 400));
  }

  // Actualizar contraseña
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Contraseña actualizada exitosamente",
  });
});

// @desc    Cerrar sesión
// @route   POST /api/auth/logout
// @access  Private
export const logout = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "Sesión cerrada exitosamente",
  });
});
