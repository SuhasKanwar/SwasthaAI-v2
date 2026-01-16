import express, { Router, RequestHandler } from 'express';
import { verifyToken } from '../../../middleware/auth';
import { emergencyProfileController } from '../../../controllers/userController/emergencyProfileController';
import { validateBody } from '../../../middleware/validation';
import { updateEmergencyProfileSchema, updateSosSettingsSchema } from '../../../schemas/emergencyProfileSchemas';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken as unknown as RequestHandler);

// Get emergency profile
router.get('/', emergencyProfileController.getEmergencyProfile as unknown as RequestHandler);

// Update emergency profile
router.put('/',
  validateBody(updateEmergencyProfileSchema) as RequestHandler,
  emergencyProfileController.updateEmergencyProfile as unknown as RequestHandler
);

// Update SOS settings
router.put('/sos',
  validateBody(updateSosSettingsSchema) as RequestHandler,
  emergencyProfileController.updateSosSettings as unknown as RequestHandler
);

// Generate emergency profile from medical profile
router.post('/generate',
  emergencyProfileController.generateEmergencyProfile as unknown as RequestHandler
);

export default router;
