import express from 'express';
import * as submissionController from '../controllers/submissionController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas principales
router.route('/')
  .post(upload.array('attachments', 5), submissionController.createSubmission);

// Ruta para obtener mis submissions
router.get('/my', submissionController.getMySubmissions);

// Rutas específicas por ID
router.route('/:id')
  .get(submissionController.getSubmissionById)
  .put(upload.array('attachments', 5), submissionController.updateSubmission)
  .delete(submissionController.deleteSubmission);

// Ruta para calificar
router.put('/:id/grade', submissionController.gradeSubmission);

export default router;