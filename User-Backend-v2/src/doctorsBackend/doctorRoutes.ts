import { Router, RequestHandler } from 'express';
import { DoctorController } from './doctorController';
import { DoctorHealthVaultController } from './doctorHealthVaultController';
import doctorAppointmentRoutes from './doctorAppointmentRoutes';

const router = Router();
const doctorController = new DoctorController();
const doctorHealthVaultController = new DoctorHealthVaultController();

// Doctor routes
router.post('/', doctorController.createDoctor as RequestHandler);
router.get('/', doctorController.getAllDoctors as RequestHandler);

router.get('/:id', doctorController.getDoctorById as RequestHandler);

// Doctor profile routes
router.post('/:doctorId/profile', doctorController.createDoctorProfile as RequestHandler);
router.put('/:doctorId/profile', doctorController.updateDoctorProfile as RequestHandler);

// Clinic routes
router.post('/:doctorId/clinics', doctorController.addClinic as RequestHandler);
router.put('/:doctorId/clinics/:clinicId', doctorController.updateClinic as RequestHandler);

// Doctor health vault routes
router.get('/:doctorId/health-vault', doctorHealthVaultController.getRecords as RequestHandler);

// Doctor appointment routes
router.use(doctorAppointmentRoutes);

export default router; 