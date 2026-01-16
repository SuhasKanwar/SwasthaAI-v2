import { Request } from 'express';

// User type to represent the authenticated user
export interface User {
  id: string;
  email: string;
  role?: string;
}

// Extended request type without recursion
export type AuthRequest = Request & {
  user: User;
  // Add all the properties that Express Request has but TypeScript doesn't recognize
  body: any;
  params: any;
  query: any;
  headers: any;
  file?: Express.Multer.File;
}

// Other auth related types
export interface SignupData {
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  defaultHomeScreen?: 'Mental Health' | 'Physical Health';
}

export interface LoginData {
  email: string;
  securityPin: string;
}

export interface RequestOtpData {
  email: string;
}

export interface OTPVerificationData {
  email: string;
  otp: string;
}

export interface PinVerificationData {
  securityPin: string;
}

export interface TokenRefreshData {
  securityPin: string;
  expiredToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  defaultHomeScreen?: string;
  dateOfBirth?: string;
  gender?: string;
  googleAuth?: boolean;
  createdAt?: string;
  updatedAt?: string;
  completedProfile: boolean;
  role: 'patient' | 'doctor';
}

export interface ProfileStatus {
  firstName: boolean;
  lastName: boolean;
  dateOfBirth: boolean;
  gender: boolean;
}

export interface SetupPinData {
  email: string;
  securityPin: string;
  confirmPin: string;
}