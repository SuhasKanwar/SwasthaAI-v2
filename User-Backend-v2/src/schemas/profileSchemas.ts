import { z } from 'zod';

// Basic Info Schema
export const updateBasicInfoSchema = z.object({
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .trim(),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .trim(),
  dateOfBirth: z.string()
    .refine((date) => {
      const birthDate = new Date(date);
      const age = (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 13;
    }, "User must be at least 13 years old")
    .transform(str => new Date(str)),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], {
    errorMap: () => ({ message: "Invalid gender selection" })
  }),
  role: z.enum(["patient", "doctor"], {
    errorMap: () => ({ message: "Invalid role selection" })
  })
});

// Contact Info Schema
export const updateContactInfoSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters"),
  phoneNumber: z.string()
    .regex(/^[1-9]\d{1,14}$/, "Phone number must be 1-14 digits without country code")
    .optional(),
  countryCode: z.string()
    .regex(/^\+[1-9]\d{0,2}$/, "Country code must start with + and be 1-3 digits")
    .optional()
});

// Preferences Schema
export const updatePreferencesSchema = z.object({
  defaultHomeScreen: z.enum(["Mental Health", "Physical Health"], {
    errorMap: () => ({ message: "Invalid home screen selection" })
  }).default("Mental Health"),
  languages: z.array(z.string())
    .min(1, "At least one language must be specified")
    .default([]),
  ethnicity: z.string()
    .min(2, "Ethnicity must be at least 2 characters")
    .max(50, "Ethnicity must not exceed 50 characters")
    .optional()
});

export const emailVerifySchema = z.object({
  newEmail: z.string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters"),
  otp: z.string()
    .regex(/^\d{6}$/, "OTP must be a 6-digit number")
});

export type UpdateBasicInfoSchema = z.infer<typeof updateBasicInfoSchema>;
export type UpdateContactInfoSchema = z.infer<typeof updateContactInfoSchema>;
export type UpdatePreferencesSchema = z.infer<typeof updatePreferencesSchema>;
export type EmailVerifySchema = z.infer<typeof emailVerifySchema>;
