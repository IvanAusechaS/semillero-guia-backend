import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

// Middleware para proteger rutas
export const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Obtener token del header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2) Verificar que existe el token
  if (!token) {
    return next(
      new AppError("No tienes autorización para acceder a esta ruta", 401)
    );
  }

  try {
    // 3) Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Verificar que el usuario aún existe
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError("El usuario del token ya no existe", 401));
    }

    // 5) Verificar que el usuario está activo
    if (!user.isActive) {
      return next(new AppError("Tu cuenta ha sido desactivada", 401));
    }

    // 6) Adjuntar usuario a la request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Token inválido", 401));
    } else if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expirado", 401));
    }
    return next(new AppError("Error de autenticación", 401));
  }
});

// Middleware para restringir por roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("No tienes permisos para realizar esta acción", 403)
      );
    }
    next();
  };
};

// Middleware para verificar propietario del recurso
export const checkOwnership = (Model, paramField = "id") => {
  return catchAsync(async (req, res, next) => {
    const resource = await Model.findByPk(req.params[paramField]);

    if (!resource) {
      return next(new AppError("Recurso no encontrado", 404));
    }

    // Solo el propietario o admin puede acceder
    if (
      resource.userId &&
      resource.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new AppError("No tienes permisos para acceder a este recurso", 403)
      );
    }

    req.resource = resource;
    next();
  });
};
