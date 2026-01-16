import express, { RequestHandler } from 'express';
import { verifyToken as auth } from '../../../middleware/auth';
import { profileController } from '../../../controllers/userController/profileController';
import multer from 'multer';
import { validateBody } from '../../../middleware/validation';
import { 
  updateBasicInfoSchema, 
  updateContactInfoSchema, 
  updatePreferencesSchema,
  emailVerifySchema 
} from '../../../schemas/profileSchemas';

const router = express.Router();

// Configure multer for profile photo uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Get profile
router.get('/profile', auth as RequestHandler, (profileController.getProfile as unknown) as RequestHandler);

// Update basic info (firstName, lastName, DOB, Sex)
router.put('/profile/basic-info', 
  auth as RequestHandler, 
  validateBody(updateBasicInfoSchema) as RequestHandler, 
  (profileController.updateBasicInfo as unknown) as RequestHandler
);

// Update contact info (email and phone)
router.put('/profile/contact-info', 
  auth as RequestHandler, 
  validateBody(updateContactInfoSchema) as RequestHandler, 
  (profileController.updateContactInfo as unknown) as RequestHandler
);

// Update preferences (ethnicity, defaultHomeScreen, languages)
router.put('/profile/preferences', 
  auth as RequestHandler, 
  validateBody(updatePreferencesSchema) as RequestHandler, 
  (profileController.updatePreferences as unknown) as RequestHandler
);

// Upload/Update profile photo
router.post('/profile/photo', 
  auth as RequestHandler, 
  upload.single('photo') as RequestHandler, 
  (profileController.updateProfilePhoto as unknown) as RequestHandler
);

// Delete profile photo
router.delete('/profile/photo', 
  auth as RequestHandler, 
  (profileController.deleteProfilePhoto as unknown) as RequestHandler
);

// Verify email change with OTP
router.post('/profile/verify-email', 
  auth as RequestHandler, 
  validateBody(emailVerifySchema) as RequestHandler, 
  (profileController.verifyEmailChange as unknown) as RequestHandler
);

export default router;
