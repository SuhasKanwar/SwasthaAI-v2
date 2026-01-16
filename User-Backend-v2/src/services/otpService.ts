import * as emailUtils from '../utils/emailUtils';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';

export const generateAndSendOTP = async (userId: string, email: string): Promise<boolean> => {
  try {
    // Check for recent OTP attempts
    const recentOtps = await prisma.otpVerification.count({
      where: {
        userId,
        createdAt: {
          gt: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    // Maximum number of OTP attempts in 15 minutes window
    const MAX_OTP_ATTEMPTS = 5;
    if (recentOtps >= MAX_OTP_ATTEMPTS) {
      throw new AppError(429, `Too many OTP attempts. Maximum ${MAX_OTP_ATTEMPTS} attempts allowed in 15 minutes. Please try again later.`);
    }

    // Invalidate any existing OTPs for this user
    await prisma.otpVerification.updateMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      data: {
        expiresAt: new Date() // Expire immediately
      }
    });

    // Generate and send new OTP
    const otp = emailUtils.generateOTP();
    const emailSent = await emailUtils.sendOTP(userId, email, otp);
    
    if (!emailSent) {
      throw new AppError(500, 'Failed to send OTP');
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'OTP Service Error');
  }
};

export const verifyUserOTP = async (userId: string, inputOTP: string): Promise<boolean> => {
  try {
    const isValid = await emailUtils.verifyOTP(userId, inputOTP);
    
    // Clean up expired OTPs
    await prisma.otpVerification.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            userId,
            createdAt: { 
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) 
            } 
          }
        ]
      }
    });

    return isValid;
  } catch (error) {
    throw new AppError(500, 'OTP Verification Error');
  }
};

export const clearUserOTPs = async (userId: string): Promise<void> => {
  try {
    await prisma.otpVerification.deleteMany({
      where: { userId }
    });
  } catch (error) {
    throw new AppError(500, 'OTP Cleanup Error');
  }
};
