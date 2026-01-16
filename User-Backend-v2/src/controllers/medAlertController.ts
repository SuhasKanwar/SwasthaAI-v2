import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { medAlertSettingsSchema, medAlertCategorySchema, medAlertReminderSchema } from '../schemas/medAlertSchemas';

// Extend Request type to include user
interface AuthRequest extends Request {
  user: {
    id: string;
  };
  body: any;
  params: {
    id?: string;
  };
  file?: Express.Multer.File;
}

export const medAlertController = {
  // Settings Controllers
  async getSettings(req: AuthRequest, res: Response) {
    try {
      const settings = await prisma.medAlertSettings.findUnique({
        where: { userId: req.user.id }
      });

      if (!settings) {
        // Create default settings if not exists
        const defaultSettings = await prisma.medAlertSettings.create({
          data: {
            userId: req.user.id,
            autoReminder: false,
            notifyEmail: true,
            notifyPush: true,
            notifySms: false
          }
        });
        return res.json(defaultSettings);
      }

      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  },

  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const data = req.body; // body is already validated by middleware
      const settings = await prisma.medAlertSettings.upsert({
        where: { userId: req.user.id },
        update: {
          autoReminder: data.autoReminder,
          notifyEmail: data.notifyEmail,
          notifyPush: data.notifyPush,
          notifySms: data.notifySms
        },
        create: {
          userId: req.user.id,
          autoReminder: data.autoReminder,
          notifyEmail: data.notifyEmail,
          notifyPush: data.notifyPush,
          notifySms: data.notifySms
        }
      });

      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: 'Invalid settings data' });
    }
  },

  // Category Controllers
  async getCategories(req: AuthRequest, res: Response) {
    try {
      const categories = await prisma.medAlertCategory.findMany({
        where: { userId: req.user.id }
      });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const data = medAlertCategorySchema.parse(req.body);
      const category = await prisma.medAlertCategory.create({
        data: {
          ...data,
          userId: req.user.id
        }
      });
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: 'Invalid category data' });
    }
  },

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = medAlertCategorySchema.parse(req.body);
      
      const category = await prisma.medAlertCategory.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const updated = await prisma.medAlertCategory.update({
        where: { id },
        data
      });

      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: 'Invalid category data' });
    }
  },

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const category = await prisma.medAlertCategory.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      await prisma.medAlertCategory.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  },

  // Reminder Controllers
  async getReminders(req: AuthRequest, res: Response) {
    try {
      const reminders = await prisma.medAlertReminder.findMany({
        where: { 
          userId: req.user.id,
          isSuggested: false
        },
        include: {
          category: true
        }
      });
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reminders' });
    }
  },

  async createReminder(req: AuthRequest, res: Response) {
    try {
      const data = medAlertReminderSchema.parse(req.body); // Body is already validated by middleware
      
      // Check if category exists and belongs to user
      const category = await prisma.medAlertCategory.findFirst({
        where: { 
          id: data.categoryId,
          userId: req.user.id 
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // File upload is not handled in this version
      const prescriptionFileId = null; 

      const reminder = await prisma.medAlertReminder.create({
        data: {
          userId: req.user.id,
          categoryId: data.categoryId,
          medicineName: data.medicineName,
          dosage: data.dosage,
          frequency: data.frequency,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          notes: data.notes,
          prescriptionId: prescriptionFileId, // Set to null as file upload isn't handled
          timeSlot: data.timeSlot || [],
          form: data.form || "tablet"
        },
        include: {
          category: true
        }
      });

      res.status(201).json(reminder);
    } catch (error) {
      res.status(400).json({ error: 'Invalid reminder data' });
    }
  },

  async getReminder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const reminder = await prisma.medAlertReminder.findFirst({
        where: { 
          id,
          userId: req.user.id
        },
        include: {
          category: true
        }
      });

      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      res.json(reminder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reminder' });
    }
  },

  async updateReminder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body; // Already validated by middleware

      const reminder = await prisma.medAlertReminder.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      // Only update the fields that are provided
      const updateData: any = {};
      
      if (data.medicineName !== undefined) updateData.medicineName = data.medicineName;
      if (data.dosage !== undefined) updateData.dosage = data.dosage;
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.timeSlot !== undefined) updateData.timeSlot = data.timeSlot;
      if (data.form !== undefined) updateData.form = data.form;

      const updated = await prisma.medAlertReminder.update({
        where: { id },
        data: updateData,
        include: {
          category: true
        }
      });

      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: 'Invalid reminder data' });
    }
  },

  async deleteReminder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const reminder = await prisma.medAlertReminder.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      await prisma.medAlertReminder.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete reminder' });
    }
  },

  async pauseReminder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const reminder = await prisma.medAlertReminder.findFirst({
        where: { id, userId: req.user.id }
      });

      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      const updated = await prisma.medAlertReminder.update({
        where: { id },
        data: {
          isPaused: !reminder.isPaused
        },
        include: {
          category: true
        }
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update reminder status' });
    }
  },

  // Suggested Reminders Controllers
  async getSuggestedReminders(req: AuthRequest, res: Response) {
    try {
      const reminders = await prisma.medAlertReminder.findMany({
        where: { 
          userId: req.user.id,
          isSuggested: true
        },
        include: {
          category: true
        }
      });
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch suggested reminders' });
    }
  },

  async activateSuggestedReminder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const reminder = await prisma.medAlertReminder.findFirst({
        where: { 
          id,
          userId: req.user.id,
          isSuggested: true
        }
      });

      if (!reminder) {
        return res.status(404).json({ error: 'Suggested reminder not found' });
      }

      const activated = await prisma.medAlertReminder.update({
        where: { id },
        data: {
          isSuggested: false,
          isActive: true
        },
        include: {
          category: true
        }
      });

      res.json(activated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to activate reminder' });
    }
  }
} as const;
