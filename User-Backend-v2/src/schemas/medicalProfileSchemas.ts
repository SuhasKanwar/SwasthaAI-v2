import { z } from 'zod';

export const updateMedicalProfileSchema = z.object({
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  heightCm: z.number().min(1).max(300),
  weightKg: z.number().min(1).max(500),
  chronicConditions: z.array(z.string()).default([]),
  mentalHealthSymptoms: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  surgeries: z.array(z.string()).default([]),
  familyMedicalHistory: z.array(z.string()).default([]),
  currentDoctors: z.array(z.object({
    name: z.string(),
    contactNumber: z.string()
  })).default([]),
  vaccinationRecords: z.array(z.string()).default([])
});

export type UpdateMedicalProfileInput = z.infer<typeof updateMedicalProfileSchema>;
