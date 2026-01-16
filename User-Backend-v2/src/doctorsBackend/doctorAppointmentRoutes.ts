import { Router, RequestHandler } from 'express';
import { validateQuery, validateBody } from '../middleware/validation';
import { DoctorAppointmentController } from './doctorAppointmentController';
import { z } from 'zod';
import { AppointmentFilters, UpdateAppointmentStatus, AppointmentParams } from './types';

const router = Router();
const appointmentController = new DoctorAppointmentController();

// Validation schemas
const appointmentListSchema = z.object({
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional()
});

const timeSlotSchema = z.object({
  hour: z.string(),
  minute: z.string(),
  period: z.enum(['AM', 'PM'])
});

const prescribedMedicineSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  instructions: z.string().min(1),
  duration: z.number().int().nonnegative(),
  chemicalComposition: z.string().min(1),
  timeSlot: z.array(timeSlotSchema).optional(),
  form: z.string().optional()
});

const prescriptionSchema = z.object({
  diagnosis: z.string().min(1),
  symptoms: z.array(z.string().min(1)).min(1),
  doctorAdvice: z.string().optional(),
  followUpDate: z.string().optional(),
  medicines: z.array(prescribedMedicineSchema).min(1)
});

const updateAppointmentSchema = z.object({
  appointmentStatus: z.enum(['Confirmed', 'Rejected', 'Completed', 'Cancelled']),
  confirmationMessage: z.string().optional(),
  cancelReason: z.string().optional(),
  prescriptionUrl: z.string().optional(),
  prescription: prescriptionSchema.optional()
}).superRefine((data, ctx) => {
  if (data.appointmentStatus === 'Completed' && !data.prescription) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Prescription details are required when completing an appointment',
      path: ['prescription']
    });
  }
});

// Get doctor's appointments with filters
router.get(
  '/:doctorId/appointments',
  validateQuery(appointmentListSchema),
  appointmentController.getAppointments as RequestHandler<AppointmentParams, any, any, AppointmentFilters>
);

// Get single appointment details
router.get(
  '/:doctorId/appointments/:appointmentId',
  appointmentController.getAppointment as RequestHandler<AppointmentParams>
);

// Update appointment status
router.patch(
  '/:doctorId/appointments/:appointmentId',
  validateBody(updateAppointmentSchema),
  appointmentController.updateAppointmentStatus as RequestHandler<AppointmentParams, any, UpdateAppointmentStatus>
);

export default router; 