import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/errors';
import { generateAndSendOTP, verifyUserOTP, clearUserOTPs } from '../../services/otpService';
import { uploadToCloud } from '../../utils/fileUtils';
import { AuthRequest } from '../../types/auth.types';
import { Gender } from '../../schemas/authSchemas';
import {
  UserProfile,
  UpdateBasicInfoData,
  UpdateContactInfoData,
  UpdatePreferencesData,
  EmailVerificationData
} from '../../types/profile.types';

export const profileController = {
  // Get user profile
  getProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profilePhoto: true
        }
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Remove sensitive information and transform to UserProfile type
      const { securityPin, ...profile } = user;
      
      // Transform database user to UserProfile type
      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber || undefined,
        countryCode: profile.countryCode || undefined,
        dateOfBirth: profile.dateOfBirth || new Date(),
        gender: (profile.gender || 'Prefer not to say') as Gender,
        defaultHomeScreen: profile.defaultHomeScreen,
        googleAuth: profile.googleAuth,
        languages: profile.languages,
        ethnicity: profile.ethnicity || undefined,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        profilePhoto: profile.profilePhoto || undefined,
        role: profile.role as 'patient' | 'doctor',
      };

      res.json({
        status: 'success',
        data: userProfile
      });
    } catch (error) {
      throw error;
    }
  },

  // Update basic info (firstName, lastName, DOB, Sex)
  updateBasicInfo: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, dateOfBirth, gender, role } = req.body as UpdateBasicInfoData;

      // Validate date of birth for age
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        throw new AppError(400, 'User must be at least 13 years old');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          role
        },
        include: {
          profilePhoto: true
        }
      });

      const { securityPin, ...profile } = updatedUser;
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  },

  // Update contact info (email and phone)
  updateContactInfo: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const { email, phoneNumber, countryCode } = req.body as UpdateContactInfoData;

      // Check if email is already in use by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: userId
          }
        }
      });

      if (existingUser) {
        throw new AppError(400, 'Email already in use');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          email,
          phoneNumber,
          countryCode
        },
        include: {
          profilePhoto: true
        }
      });

      const { securityPin, ...profile } = updatedUser;
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  },

  // Update preferences (ethnicity, defaultHomeScreen, languages)
  updatePreferences: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const { ethnicity, defaultHomeScreen, languages } = req.body as UpdatePreferencesData;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ethnicity,
          defaultHomeScreen: defaultHomeScreen || 'Mental Health',
          languages: languages || []
        },
        include: {
          profilePhoto: true
        }
      });

      const { securityPin, ...profile } = updatedUser;
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  },

  // Update profile photo
  updateProfilePhoto: async (req: AuthRequest & { file?: Express.Multer.File }, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }

      const userId = req.user.id;
      const file = req.file;

      // Upload file to cloud storage
      const photoUrl = await uploadToCloud(file);

      // Update or create profile photo record
      const profilePhoto = await prisma.profilePhoto.upsert({
        where: { userId },
        update: {
          photoUrl,
          uploadedAt: new Date()
        },
        create: {
          userId,
          photoUrl,
        }
      });

      res.json({
        status: 'success',
        data: profilePhoto
      });
    } catch (error) {
      throw error;
    }
  },

  // Delete profile photo
  deleteProfilePhoto: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      await prisma.profilePhoto.delete({
        where: { userId }
      });

      res.json({
        status: 'success',
        message: 'Profile photo deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new AppError(404, 'No profile photo found');
      }
      throw error;
    }
  },

  // Verify email change
  verifyEmailChange: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const { newEmail, otp } = req.body as EmailVerificationData;

      if (!newEmail || !otp) {
        throw new AppError(400, 'Email and OTP are required');
      }

      // Verify OTP
      const isValid = await verifyUserOTP(userId, otp);
      if (!isValid) {
        throw new AppError(400, 'Invalid or expired OTP');
      }

      // Update email
      await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail }
      });

      // Clear all OTPs for this user
      await clearUserOTPs(userId);

      res.json({
        status: 'success',
        message: 'Email updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
