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

const updateAppointmentSchema = z.object({
  appointmentStatus: z.enum(['Confirmed', 'Rejected', 'Completed', 'Cancelled']),
  confirmationMessage: z.string().optional(),
  cancelReason: z.string().optional(),
  prescriptionUrl: z.string().optional()
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