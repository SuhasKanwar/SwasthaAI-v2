import { z } from 'zod';

export const requestOtpSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13;
  }, 'User must be at least 13 years old'),
  gender: z.string().min(1, 'Gender is required'),
  defaultHomeScreen: z.enum(['Mental Health', 'Physical Health']).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const loginPinSchema = z.object({
  email: z.string().email('Invalid email format'),
  securityPin: z.string().regex(/^\d{4}$|^\d{6}$/, 'Security PIN must be exactly 4 or 6 digits')
});

export const otpVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().min(4, 'OTP must be at least 4 characters')
});

export const pinVerificationSchema = z.object({
  securityPin: z.string().regex(/^\d{4}$|^\d{6}$/, 'Security PIN must be exactly 4 or 6 digits')
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13;
  }, 'User must be at least 13 years old'),
  gender: z.string().min(1, 'Gender is required'),
  defaultHomeScreen: z.enum(['Mental Health', 'Physical Health']).optional()
});

export const setupPinSchema = z.object({
  email: z.string().email('Invalid email format'),
  securityPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/, 'Security PIN must be exactly 4 or 6 digits'),
  confirmPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/, 'Security PIN must be exactly 4 or 6 digits'),
  isNewUser: z.boolean()
}).refine((data) => data.securityPin === data.confirmPin, {
  message: "PINs don't match",
  path: ['confirmPin']
});

export const changePinSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().min(4, 'OTP must be at least 4 characters'),
  newPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/, 'Security PIN must be exactly 4 or 6 digits'),
  confirmPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/, 'Security PIN must be exactly 4 or 6 digits')
}).refine((data) => data.newPin === data.confirmPin, {
  message: "PINs don't match", 
  path: ['confirmPin']
});

export const authenticatedChangePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4}$|^\d{6}$/, 'Current PIN must be exactly 4 or 6 digits'),
  newPin: z.string().regex(/^\d{4}$|^\d{6}$/, 'New PIN must be exactly 4 or 6 digits'),
  confirmPin: z.string().regex(/^\d{4}$|^\d{6}$/, 'Confirm PIN must be exactly 4 or 6 digits')
}).refine((data) => data.newPin === data.confirmPin, {
  message: "New PINs don't match",
  path: ['confirmPin']
});

export const refreshTokenSchema = z.object({
  expiredToken: z.string().min(1, 'Expired token is required'),
  securityPin: z.string().regex(/^\d{4}$|^\d{6}$/, 'Security PIN must be exactly 4 or 6 digits')
});

export type SetupPinSchema = z.infer<typeof setupPinSchema>;
export type ChangePinSchema = z.infer<typeof changePinSchema>;
export type AuthenticatedChangePinSchema = z.infer<typeof authenticatedChangePinSchema>;
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
