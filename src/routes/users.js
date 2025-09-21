import express from 'express'
import { 
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getTeamMembers
} from '../controllers/userController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

// Rutas públicas
router.get('/team', getTeamMembers)

// Todas las rutas siguientes requieren autenticación
router.use(protect)

// Rutas para usuarios
router.route('/')
  .get(restrictTo('admin', 'docente'), getAllUsers)

router.route('/:id')
  .get(getUser)
  .put(restrictTo('admin', 'docente'), updateUser)
  .delete(restrictTo('admin'), deleteUser)

export default router