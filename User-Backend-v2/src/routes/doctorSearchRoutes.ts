import express, { RequestHandler } from 'express';
import { validateQuery } from '../middleware/validation';
import { doctorController } from '../controllers/doctorSearchController';
import { doctorSearchSchema } from '../schemas/doctorSearchSchemas';
 
const router = express.Router();

// Search routes
router.get('/search', validateQuery(doctorSearchSchema), doctorController.searchDoctors as RequestHandler);
router.get('/nearby', doctorController.getNearbyDoctors as RequestHandler);

// Profile routes
router.get('/:id', doctorController.getDoctorProfile as RequestHandler);
router.get('/:id/availability', doctorController.getDoctorAvailability as RequestHandler);

export default router;