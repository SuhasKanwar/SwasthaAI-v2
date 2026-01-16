import { z } from 'zod';

export const Gender = z.enum(['Male', 'Female', 'Other', 'Prefer not to say']);
export type Gender = z.infer<typeof Gender>;

export const signupSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().regex(/^[0-9]{10}$/).optional(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: Gender,
  securityPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/)
});

export type SignupSchema = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email()
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const loginPinSchema = z.object({
  email: z.string().email(),
  securityPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/)
});

export type LoginPinSchema = z.infer<typeof loginPinSchema>;

export const otpVerificationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
});

export type OTPVerificationSchema = z.infer<typeof otpVerificationSchema>;

export const pinVerificationSchema = z.object({
  securityPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/)
});

export type PinVerificationSchema = z.infer<typeof pinVerificationSchema>;

export const refreshTokenSchema = z.object({
  securityPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/),
  expiredToken: z.string()
});

export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: Gender,
  securityPin: z.string().regex(/^[0-9]{4}$|^[0-9]{6}$/)
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
