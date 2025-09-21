import express from 'express'
import multer from 'multer'
import path from 'path'
import { 
  getAssignments,
  createAssignment,
  getAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission
} from '../controllers/forumController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/submissions/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false)
  }
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
})

// Todas las rutas requieren autenticación
router.use(protect)

// Rutas para tareas/asignaciones
router.route('/assignments')
  .get(getAssignments)
  .post(restrictTo('docente', 'admin'), createAssignment)

router.route('/assignments/:id')
  .get(getAssignment)

// Rutas para entregas
router.post('/assignments/:id/submit', upload.single('file'), submitAssignment)
router.get('/assignments/:id/submissions', restrictTo('docente', 'admin'), getSubmissions)
router.put('/submissions/:id/grade', restrictTo('docente', 'admin'), gradeSubmission)

export default router