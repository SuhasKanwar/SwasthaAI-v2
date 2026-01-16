import { z } from 'zod';

export const medAlertSettingsSchema = z.object({
  autoReminder: z.boolean(),
  notifyEmail: z.boolean(),
  notifyPush: z.boolean(),
  notifySms: z.boolean().optional(),
  notifySMS: z.boolean()
}).transform(data => ({
  autoReminder: data.autoReminder,
  notifyEmail: data.notifyEmail,
  notifyPush: data.notifyPush,
  notifySms: data.notifySms ?? data.notifySMS
}));

export const medAlertCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().optional()
});

const timeSlotSchema = z.object({
  hour: z.string(),
  minute: z.string(),
  period: z.enum(["AM", "PM"])
});

// Common fields for both create and update
const reminderFields = {
  medicineName: z.string({
    required_error: "Medicine name is required"
  }).min(1, "Medicine name cannot be empty"),
  dosage: z.string({
    required_error: "Dosage is required"
  }),
  frequency: z.string({
    required_error: "Frequency is required"
  }),
  startDate: z.string({
    required_error: "Start date is required"
  }).refine((val: string) => {
    try {
      new Date(val).toISOString();
      return true;
    } catch {
      return false;
    }
  }, "Invalid date format"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  prescription: z.any().optional(),
  timeSlot: z.array(timeSlotSchema).default([]),
  form: z.string().default("tablet")
} as const;

// Schema for creating new reminders (requires categoryId)
export const medAlertReminderSchema = z.object({
  ...reminderFields,
  categoryId: z.string({
    required_error: "Category ID is required"
  })
}).refine((data: any) => {
  if (data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate >= startDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

// Schema for updating reminders (categoryId is optional)
export const medAlertReminderUpdateSchema = z.object({
  ...reminderFields
}).refine((data: any) => {
  if (data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate >= startDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export type MedAlertSettings = z.infer<typeof medAlertSettingsSchema>;
export type MedAlertCategory = z.infer<typeof medAlertCategorySchema>;
export type MedAlertReminder = z.infer<typeof medAlertReminderSchema>;
