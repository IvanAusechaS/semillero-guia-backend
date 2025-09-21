import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads/submissions');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    // Limpiar nombre del archivo
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${cleanBaseName}-${uniqueSuffix}${extension}`;
    
    cb(null, fileName);
  }
});

// Filtro de tipos de archivo
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar|ppt|pptx|xls|xlsx/;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  // Verificar extensión
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Verificar mimetype
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.originalname}. Tipos permitidos: images, PDF, DOC, DOCX, TXT, ZIP, RAR, PPT, PPTX, XLS, XLSX`));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por archivo
    files: 5 // Máximo 5 archivos por request
  },
  fileFilter: fileFilter
});

// Middleware de manejo de errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          status: 'error',
          message: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          status: 'error',
          message: 'Demasiados archivos. Máximo: 5 archivos'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          status: 'error',
          message: 'Campo de archivo inesperado'
        });
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Error al subir archivo: ' + err.message
        });
    }
  } else if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  next();
};

// Funciones auxiliares para manejo de archivos
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const deleteFiles = async (files) => {
  const deletePromises = files.map(file => {
    const filePath = typeof file === 'string' ? file : file.path;
    return deleteFile(filePath);
  });
  
  try {
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error eliminando archivos:', error);
  }
};

// Middleware para limpiar archivos en caso de error
const cleanupFiles = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Si hay error y archivos subidos, eliminarlos
    if (res.statusCode >= 400 && req.files && req.files.length > 0) {
      deleteFiles(req.files).catch(console.error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Validación personalizada de archivos
const validateFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(); // No hay archivos, continuar
  }

  // Validaciones adicionales
  const errors = [];
  
  req.files.forEach((file, index) => {
    // Validar nombre de archivo
    if (file.originalname.length > 255) {
      errors.push(`Archivo ${index + 1}: Nombre demasiado largo`);
    }
    
    // Validar que el archivo no esté vacío
    if (file.size === 0) {
      errors.push(`Archivo ${index + 1}: El archivo está vacío`);
    }
  });

  if (errors.length > 0) {
    // Limpiar archivos subidos
    deleteFiles(req.files).catch(console.error);
    
    return res.status(400).json({
      status: 'error',
      message: 'Errores de validación de archivos',
      errors
    });
  }

  next();
};

// URL pública para acceder a archivos
const getFileUrl = (filename) => {
  return `/uploads/submissions/${filename}`;
};

// Verificar si un archivo existe
const fileExists = (filename) => {
  const filePath = path.join(uploadsDir, filename);
  return fs.existsSync(filePath);
};

export default upload;
export { 
  handleMulterError, 
  cleanupFiles, 
  validateFiles, 
  deleteFile, 
  deleteFiles, 
  getFileUrl, 
  fileExists 
};