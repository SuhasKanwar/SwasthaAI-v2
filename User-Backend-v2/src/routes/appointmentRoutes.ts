import express, { RequestHandler } from 'express';
import { verifyToken as auth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { appointmentController } from '../controllers/appointmentController';
import {
  createAppointmentSchema,
  // updateAppointmentSchema,
  appointmentListSchema,
  rescheduleAppointmentSchema // Import the new schema
} from '../schemas/doctorSearchSchemas';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected
router.use(auth);

// Book appointment
router.post('/', 
  upload.array('documents'),
  validateBody(createAppointmentSchema),
  appointmentController.createAppointment as RequestHandler
);

// Get all appointments
router.get('/', 
  validateQuery(appointmentListSchema),
  appointmentController.getAppointments as RequestHandler
);

// Get single appointment
router.get('/:id', appointmentController.getAppointment as RequestHandler);

// Update appointment (status, details, etc.) - Using form-data
// router.put('/:id',
//   upload.none(), // Use multer to handle form-data parsing even without files
//   validateBody(updateAppointmentSchema),
//   appointmentController.updateAppointment as RequestHandler
// );

// Reschedule appointment
router.patch('/:id/reschedule',
  validateBody(rescheduleAppointmentSchema),
  appointmentController.rescheduleAppointment as RequestHandler
);

export default router;
