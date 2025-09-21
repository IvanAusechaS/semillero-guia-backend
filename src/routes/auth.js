import express from 'express'
import { body } from 'express-validator'
import { 
  register, 
  login, 
  getMe, 
  updateProfile,
  changePassword,
  logout
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'

const router = express.Router()

// Validaciones
const registerValidation = [
  body('name')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('career')
    .notEmpty()
    .withMessage('La carrera es requerida'),
  body('role')
    .isIn(['estudiante', 'docente'])
    .withMessage('El rol debe ser estudiante o docente'),
  body('semester')
    .if(body('role').equals('estudiante'))
    .isInt({ min: 1, max: 12 })
    .withMessage('El semestre debe ser un número entre 1 y 12')
]

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
]

const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La biografía no puede exceder 500 caracteres'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Las habilidades deben ser un array'),
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('El enlace de GitHub debe ser una URL válida'),
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('El enlace de LinkedIn debe ser una URL válida')
]

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden')
      }
      return true
    })
]

// Rutas públicas
router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)

// Rutas protegidas
router.use(protect) // Todas las rutas siguientes requieren autenticación

router.get('/me', getMe)
router.put('/profile', updateProfileValidation, validate, updateProfile)
router.put('/change-password', changePasswordValidation, validate, changePassword)
router.post('/logout', logout)

export default router