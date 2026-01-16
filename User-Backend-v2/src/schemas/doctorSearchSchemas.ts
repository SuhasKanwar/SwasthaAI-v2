import { z } from 'zod';

// Enums
export const AppointmentModes = ['In-Person', 'Online'] as const;
export const AppointmentStatus = ['Pending', 'Confirmed', 'Cancelled', 'Completed'] as const;
export const PaymentStatus = ['Pending', 'Paid', 'Refunded'] as const;

// Doctor Profile Schema
export const doctorProfileSchema = z.object({
  userId: z.number(),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  profilePicture: z.string().max(1000).optional(),
  specialty: z.string().max(255),
  expertiseAreas: z.any(), // JSON in prisma
  clinicName: z.string().max(255).default("Dr. X"),
  education: z.string(),
  credentials: z.string().optional(),
  yearsOfExperience: z.number().int().min(0),
  medicalRegistrationNumber: z.string().max(100),
  languagesSpoken: z.any(), // JSON in prisma
  providesOnlineConsultation: z.boolean().default(false),
  bio: z.string().optional()
});

// Appointment Schema
export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid Doctor ID'),
  // Preprocess clinicId: empty string becomes undefined, then validate optional UUID
  clinicId: z.preprocess(
    (val) => (val === "" ? undefined : val), 
    z.string().uuid('Invalid Clinic ID').optional()
  ), 
  appointmentDate: z.string().transform(str => new Date(str)), // Expecting ISO string date part only
  appointmentSlot: z.string().min(1, 'Appointment slot is required'), // e.g., "10:00 AM"
  symptomsEntered: z.string().optional(),
  patientName: z.string().min(1, 'Patient name is required'),
  patientContact: z.string().min(10, 'Valid contact number is required'),
  addressType: z.enum(['saved', 'new']), // As per PRD flow logic
  // Preprocess payOnConsultation: convert "true" string to true, others to false
  payOnConsultation: z.preprocess(
    (val) => String(val).toLowerCase() === 'true', 
    z.boolean().default(false)
  ),
  // uploadedDocuments handled by multer, not in body schema directly
});

export const updateAppointmentSchema = z.object({
  appointmentStatus: z.string().max(20),
  paymentStatus: z.string().max(20).optional(),
  prescriptionUrl: z.string().max(1000).optional(),
  followupMessage: z.string().optional(),
  rescheduledFrom: z.date().optional(),
  cancelReason: z.string().optional(),
  rescheduleAvailable: z.boolean().optional(),
  cancelAvailable: z.boolean().optional(),
  confirmationMessage: z.string().optional() // Allow updating confirmation message
});

// Schema for Rescheduling
export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().transform(str => new Date(str)), // Expecting ISO string date part only
  appointmentSlot: z.string().min(1, 'New appointment slot is required'), // e.g., "10:30"
});


// Query Schemas
export const doctorSearchSchema = z.object({
  lat: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  lng: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  specialty: z.string().optional(),
  name: z.string().optional(),
  languages: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
});

export const appointmentListSchema = z.object({
  status: z.string().max(20).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
});

// Types
export type DoctorProfile = z.infer<typeof doctorProfileSchema>;
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export type RescheduleAppointment = z.infer<typeof rescheduleAppointmentSchema>;
export type DoctorSearchQuery = z.infer<typeof doctorSearchSchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListSchema>;
