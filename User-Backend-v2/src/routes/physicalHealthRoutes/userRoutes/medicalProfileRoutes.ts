import express, { Router, RequestHandler } from 'express';
import { verifyToken } from '../../../middleware/auth';
import { medicalProfileController } from '../../../controllers/userController/medicalProfileController';
import { validateBody } from '../../../middleware/validation';
import { updateMedicalProfileSchema } from '../../../schemas/medicalProfileSchemas';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken as unknown as RequestHandler);

// Get medical profile
router.get('/', medicalProfileController.getMedicalProfile as unknown as RequestHandler);

// Update medical profile
router.put('/',
  validateBody(updateMedicalProfileSchema) as RequestHandler,
  medicalProfileController.updateMedicalProfile as unknown as RequestHandler
);

export default router;
