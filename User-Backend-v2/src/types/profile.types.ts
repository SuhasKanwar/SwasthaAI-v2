import { Gender } from '../schemas/authSchemas';

export interface ProfilePhoto {
  userId: string;
  photoUrl: string;
  uploadedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  countryCode?: string;
  dateOfBirth: Date;
  gender: Gender;
  defaultHomeScreen?: string;
  googleAuth: boolean;
  languages: string[];
  ethnicity?: string;
  createdAt: Date;
  updatedAt: Date;
  profilePhoto?: ProfilePhoto;
  role: 'patient' | 'doctor';
}

// New interfaces for split APIs
export interface UpdateBasicInfoData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  role: 'patient' | 'doctor';
}

export interface UpdateContactInfoData {
  email: string;
  phoneNumber?: string;
  countryCode?: string;
}

export interface UpdatePreferencesData {
  defaultHomeScreen?: 'Mental Health' | 'Physical Health';
  languages: string[];
  ethnicity?: string;
}

export interface EmailVerificationData {
  newEmail: string;
  otp: string;
}
