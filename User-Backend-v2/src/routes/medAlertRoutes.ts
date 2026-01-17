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
import prisma from '../config/prisma';

// Create a type helper for controllers that use AuthRequest
const asHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => fn(req as AuthRequest, res, next);
};

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const validateApiKey = (req: any, res: Response, next: NextFunction) => {
  const apiKey = process.env.API_KEY;
  const headerKey = req.headers?.['x-api-key'];
  const bodyKey = req.body?.apiKey || req.body?.api_key;
  if (!apiKey || (headerKey !== apiKey && bodyKey !== apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// WhatsApp reminder creation (API key only, no JWT)
router.post(
  '/whatsapp/reminders',
  asHandler(validateApiKey),
  asHandler(async (req: Request & { body?: any }, res: Response) => {
    try {
      const { phoneNumber, countryCode, categoryId, reminders, timeSlot } = req.body;
      if (!phoneNumber || !Array.isArray(reminders) || reminders.length === 0) {
        return res.status(400).json({ error: 'phoneNumber and reminders are required' });
      }

      const user = await prisma.user.findFirst({
        where: {
          phoneNumber,
          ...(countryCode ? { countryCode } : {})
        },
        select: { id: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const normalizedCategoryId =
        typeof categoryId === 'string' && categoryId.trim() ? categoryId.trim() : undefined;
      let resolvedCategoryId = normalizedCategoryId;
      if (!resolvedCategoryId) {
        const existing = await prisma.medAlertCategory.findFirst({
          where: {
            userId: user.id,
            name: 'WhatsApp Alerts'
          }
        });
        if (existing) {
          resolvedCategoryId = existing.id;
        } else {
          const created = await prisma.medAlertCategory.create({
            data: {
              userId: user.id,
              name: 'WhatsApp Alerts',
              description: 'Auto-created from WhatsApp onboarding',
              color: '#2DD4BF'
            }
          });
          resolvedCategoryId = created.id;
        }
      }

      if (!resolvedCategoryId) {
        return res.status(400).json({ error: 'Failed to resolve category for reminders' });
      }
      const finalCategoryId = resolvedCategoryId;

      const normalizedTimeSlot = Array.isArray(timeSlot) ? timeSlot : [];

      const created = await Promise.all(reminders.map((reminder: any) => {
        return prisma.medAlertReminder.create({
          data: {
            userId: user.id,
            categoryId: finalCategoryId,
            medicineName: reminder.medicineName,
            dosage: reminder.dosage,
            frequency: reminder.frequency,
            startDate: new Date(reminder.startDate),
            endDate: reminder.endDate ? new Date(reminder.endDate) : null,
            notes: reminder.notes || null,
            timeSlot: normalizedTimeSlot,
            form: reminder.form || 'tablet',
            isSuggested: false
          }
        });
      }));

      res.status(201).json({ status: 'success', reminders: created });
    } catch (error: any) {
      res.status(400).json({ error: error?.message || 'Invalid reminder data' });
    }
  }
));

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
