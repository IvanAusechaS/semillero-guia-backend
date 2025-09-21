import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import * as submissionController from '../controllers/submissionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas principales
router.route('/')
  .get(assignmentController.getAllAssignments)
  .post(assignmentController.createAssignment);

// Ruta especial para obtener asignaciones del usuario actual
router.get('/my', assignmentController.getMyAssignments);

// Rutas específicas por ID
router.route('/:id')
  .get(assignmentController.getAssignmentById)
  .put(assignmentController.updateAssignment)
  .delete(assignmentController.deleteAssignment);

// Ruta para actualizar estado
router.put('/:id/status', assignmentController.updateAssignmentStatus);

// Ruta para obtener submissions de una asignación
router.get('/:assignmentId/submissions', submissionController.getAssignmentSubmissions);

export default router;