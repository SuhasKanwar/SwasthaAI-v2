import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyToken as auth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { medAlertController } from '../controllers/medAlertController';
import { 
  medAlertSettingsSchema, 
  medAlertReminderSchema,
  medAlertReminderUpdateSchema 
} from '../schemas/medAlertSchemas';
import multer from 'multer';
import { AuthRequest } from '../types/auth.types';

// Create a type helper for controllers that use AuthRequest
const asHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => fn(req as AuthRequest, res, next);
};

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected
router.use(asHandler(auth));

// Auto-reminder settings
router.get('/settings', asHandler(medAlertController.getSettings));
router.put('/settings', validateBody(medAlertSettingsSchema), asHandler(medAlertController.updateSettings));

// Categories
router.get('/categories', asHandler(medAlertController.getCategories));
router.post('/categories', asHandler(medAlertController.createCategory));
router.put('/categories/:id', asHandler(medAlertController.updateCategory));
router.delete('/categories/:id', asHandler(medAlertController.deleteCategory));

// Reminders
router.get('/reminders', asHandler(medAlertController.getReminders));
router.post('/reminders', 
  upload.single('prescription'),
  // Middleware to ensure form data is properly formatted
  (req: Request & { body: any }, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body === 'string') {
        req.body = JSON.parse(req.body);
      }
      next();
    } catch (e) {
      next(); // Let Zod handle validation
    }
  },
  validateBody(medAlertReminderSchema),
  asHandler(medAlertController.createReminder)
);
router.get('/reminders/:id', asHandler(medAlertController.getReminder));
router.put('/reminders/:id', validateBody(medAlertReminderUpdateSchema), asHandler(medAlertController.updateReminder));
router.delete('/reminders/:id', asHandler(medAlertController.deleteReminder));
router.put('/reminders/:id/pause', asHandler(medAlertController.pauseReminder));

// Suggested reminders
router.get('/suggested', asHandler(medAlertController.getSuggestedReminders));
router.post('/suggested/:id/activate', asHandler(medAlertController.activateSuggestedReminder));

export default router;
