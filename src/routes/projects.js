import express from 'express'
import { 
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

// Rutas públicas
router.get('/', getAllProjects)
router.get('/:id', getProject)

// Rutas protegidas
router.use(protect)

router.post('/', restrictTo('docente', 'admin'), createProject)
router.put('/:id', restrictTo('docente', 'admin'), updateProject)
router.delete('/:id', restrictTo('docente', 'admin'), deleteProject)

export default router