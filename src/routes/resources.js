import express from 'express'
import { 
  getAllResources,
  getResource,
  createResource,
  updateResource,
  deleteResource
} from '../controllers/resourceController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

// Rutas públicas
router.get('/', getAllResources)
router.get('/:id', getResource)

// Rutas protegidas
router.use(protect)

router.post('/', restrictTo('docente', 'admin'), createResource)
router.put('/:id', restrictTo('docente', 'admin'), updateResource)
router.delete('/:id', restrictTo('docente', 'admin'), deleteResource)

export default router