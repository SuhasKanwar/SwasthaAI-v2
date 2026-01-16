import { z } from 'zod';

const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().regex(/^[1-9]\d{1,14}$/, "Phone number must be 1-14 digits without country code"),
  countryCode: z.string().regex(/^\+[1-9]\d{0,2}$/, "Country code must start with + and be 1-3 digits"),
  relation: z.string().min(1, "Relation is required")
});

const emergencyHospitalSchema = z.object({
  name: z.string().min(1, "Hospital name is required"),
  contactNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional()
});

export const updateEmergencyProfileSchema = z.object({
  emergencyContacts: z.array(emergencyContactSchema).min(1).max(3),
  hospitals: z.array(emergencyHospitalSchema).default([]),
  sosEnabled: z.boolean().default(false),
  locationPermission: z.boolean().default(false)
});

export const updateSosSettingsSchema = z.object({
  sosEnabled: z.boolean(),
  locationPermission: z.boolean()
});

export type UpdateEmergencyProfileInput = z.infer<typeof updateEmergencyProfileSchema>;
export type UpdateSosSettingsInput = z.infer<typeof updateSosSettingsSchema>;
