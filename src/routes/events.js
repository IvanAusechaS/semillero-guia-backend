import express from 'express'
import { 
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

// Rutas públicas
router.get('/', getAllEvents)
router.get('/:id', getEvent)

// Rutas protegidas
router.use(protect)

router.post('/', restrictTo('docente', 'admin'), createEvent)
router.put('/:id', restrictTo('docente', 'admin'), updateEvent)
router.delete('/:id', restrictTo('docente', 'admin'), deleteEvent)

export default router