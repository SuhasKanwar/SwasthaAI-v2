import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/errors';
import { catchAsync } from '../../middleware/errorHandler';
import * as OTPService from '../../services/otpService';
import { createTokens, decodeExpiredToken } from '../../middleware/auth';
import {
  signupSchema,
  loginSchema,
  loginPinSchema,
  otpVerificationSchema,
  pinVerificationSchema,
  updateProfileSchema,
  requestOtpSchema
} from '../../validation/authSchemas';
import {
  AuthRequest,
  SignupData,
  LoginData,
  OTPVerificationData,
  PinVerificationData,
  TokenRefreshData,
  UserResponse,
  RequestOtpData
} from '../../types/auth.types';
import { setupPinSchema, changePinSchema, authenticatedChangePinSchema } from '../../validation/authSchemas';

const checkProfileCompletion = (user: any): boolean => {
  return !!(
    user.firstName &&
    user.lastName &&
    user.dateOfBirth &&
    user.gender &&
    user.securityPin
  );
};

const createUserResponse = (user: any): UserResponse => {
  const completedProfile = checkProfileCompletion(user);
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0],
    gender: user.gender || '',
    googleAuth: user.googleAuth,
    defaultHomeScreen: user.defaultHomeScreen,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
    role: user.role || 'patient',
    completedProfile
  };
};

/**
 * Request OTP for signup or login
 */
export const requestOTP = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = requestOtpSchema.parse(req.body) as RequestOtpData;
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          firstName: '',
          lastName: '',
          dateOfBirth: new Date(),
          gender: '',
          securityPin: '' // Will be set during signup
        }
      });
    }

    try {
      await OTPService.generateAndSendOTP(user.id, email);
    } catch (error) {
      if (isNewUser) {
        await prisma.user.delete({ where: { id: user.id } });
      }
      throw new AppError(500, 'Failed to send OTP');
    }

    res.status(200).json({
      status: 'success',
      message: isNewUser ? 'OTP sent successfully. Please verify to complete signup.' : 'OTP sent successfully. Please verify to complete login.',
      email,
      isNewUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register/Update user details
 */
export const signup = async (
  req: AuthRequest, 
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = signupSchema.parse(req.body) as SignupData;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (!user) {
      throw new AppError(404, 'Please request OTP first to create account');
    }

    // If phone number is provided, check if it's already in use
    if (validatedData.phoneNumber) {
      const existingUserWithPhone = await prisma.user.findFirst({
        where: {
          phoneNumber: validatedData.phoneNumber,
          email: { not: validatedData.email } // Exclude current user
        }
      });
      if (existingUserWithPhone) {
        throw new AppError(400, 'Phone number is already in use');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: validatedData.email },
      data: {
        ...validatedData,
        dateOfBirth: new Date(validatedData.dateOfBirth)
      }
    });

    const userResponse = createUserResponse(updatedUser);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Setup security PIN after OTP verification
 */
export const setupSecurityPin = async (
  req: AuthRequest,
  res: Response, 
  next: NextFunction
) => {
  try {
    const { email, securityPin, isNewUser } = setupPinSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, 'User not found');

    if (!isNewUser) {
      throw new AppError(403, 'Unauthorized: Use change-pin route for existing users');
    }

    if (user.securityPin) {
      throw new AppError(400, 'Security PIN already set');
    }

    const hashedPin = await bcrypt.hash(securityPin, 10);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { securityPin: hashedPin }
    });

    // Create token after PIN setup
    const tokens = createTokens(updatedUser.id, updatedUser.email);
    const userResponse = createUserResponse(updatedUser);

    res.json({
      status: 'success',
      message: 'Security PIN set successfully. Please complete your profile.',
      token: tokens.accessToken,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

export const initiateChangePIN = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = requestOtpSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, 'User not found');

    await OTPService.generateAndSendOTP(user.id, email);

    res.json({
      status: 'success',
      message: 'OTP sent to your email for PIN change verification',
      email
    });
  } catch (error) {
    next(error);
  }
};

export const changeSecurityPIN = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, newPin } = changePinSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, 'User not found');

    const verified = await OTPService.verifyUserOTP(user.id, otp);
    if (!verified) throw new AppError(401, 'Invalid or expired OTP');

    const hashedPin = await bcrypt.hash(newPin, 10);
    await prisma.user.update({
      where: { email },
      data: { securityPin: hashedPin }
    });

    await OTPService.clearUserOTPs(user.id);

    res.json({
      status: 'success',
      message: 'Security PIN changed successfully',
      email  
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change security PIN for authenticated users
 */
export const changeAuthenticatedUserPin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPin, newPin } = authenticatedChangePinSchema.parse(req.body);
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const validCurrentPin = await bcrypt.compare(currentPin, user.securityPin);
    if (!validCurrentPin) throw new AppError(401, 'Current PIN is incorrect');

    if (currentPin === newPin) {
      throw new AppError(400, 'New PIN must be different from current PIN');
    }

    const hashedPin = await bcrypt.hash(newPin, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { securityPin: hashedPin }
    });

    res.json({
      status: 'success',
      message: 'Security PIN changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP for account creation
 */
export const verifySignupOTP = async (
  req: AuthRequest, 
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = otpVerificationSchema.parse(req.body) as OTPVerificationData;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, 'User not found');

    // For signup verification, allow multiple attempts before deleting account
    const otpAttempts = await prisma.otpVerification.count({
      where: {
        userId: user.id,
        createdAt: {
          gt: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    const verified = await OTPService.verifyUserOTP(user.id, otp);
    if (!verified) {
      // Delete account only after 5 failed attempts
      if (otpAttempts >= 5) {
        await prisma.user.delete({ where: { id: user.id } });
        throw new AppError(401, 'Maximum OTP attempts exceeded. Please signup again.');
      }
      throw new AppError(401, 'Invalid or expired OTP');
    }

    createUserResponse(user);

    res.status(201).json({
      status: 'success',
      message: 'Email verified successfully. Please set up your security PIN.',
      email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 */
export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = loginSchema.parse(req.body) as LoginData;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(401, 'Invalid credentials');

    try {
      await OTPService.generateAndSendOTP(user.id, email);
    } catch (error) {
      throw new AppError(500, 'Failed to send OTP');
    }

    res.json({
      status: 'success',
      message: 'OTP sent successfully. Please verify to continue.',
      email,
      hasSecurityPin: !!user.securityPin
    });
  } catch (error) {
    next(error);
  }
};

export const verifyLoginPin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, securityPin } = loginPinSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(401, 'Invalid credentials');

    const validPin = await bcrypt.compare(securityPin, user.securityPin);
    if (!validPin) throw new AppError(401, 'Invalid credentials');

    try {
      await OTPService.generateAndSendOTP(user.id, email);
    } catch (error) {
      throw new AppError(500, 'Failed to send OTP');
    }

    res.json({
      status: 'success',
      message: 'OTP sent successfully. Please verify to complete login.',
      email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify login OTP
 */
export const verifyLoginOTP = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = otpVerificationSchema.parse(req.body) as OTPVerificationData;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, 'User not found');

    const verified = await OTPService.verifyUserOTP(user.id, otp);
    if (!verified) throw new AppError(401, 'Invalid or expired OTP');

    const tokens = createTokens(user.id, user.email);
    const userResponse = createUserResponse(user);

    await prisma.sessionLog.create({
      data: { userId: user.id }
    });

    if (!user.securityPin) {
      res.json({
        status: 'redirect',
        message: 'OTP verified. Please set up your security PIN.',
        redirectTo: 'setup-pin',
        email
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'Login successful',
      token: tokens.accessToken,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify security PIN
 */
export const verifySecurityPin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { securityPin } = pinVerificationSchema.parse(req.body) as PinVerificationData;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) throw new AppError(404, 'User not found');

    const validPin = await bcrypt.compare(securityPin, user.securityPin);
    if (!validPin) throw new AppError(401, 'Invalid PIN');

    const userResponse = createUserResponse(user);

    res.json({
      status: 'success',
      message: 'PIN verified successfully',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh expired token
 */
export const refreshToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { securityPin, expiredToken } = req.body as TokenRefreshData;

    // Validate expired token presence and decode it
    if (!expiredToken) {
      throw new AppError(400, 'Expired token is required');
    }

    // Extract user ID from expired token
    const decoded = decodeExpiredToken(expiredToken);
    if (!decoded || !decoded.id || !decoded.email) {
      throw new AppError(401, 'Invalid or malformed token');
    }

    // Find user using both ID and email from expired token for extra validation
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: decoded.id },
          { email: decoded.email }
        ]
      }
    });
    if (!user) throw new AppError(404, 'User not found');

    // Verify security PIN
    const validPin = await bcrypt.compare(securityPin, user.securityPin);
    if (!validPin) throw new AppError(401, 'Invalid security PIN');

    // Create new tokens and user response
    const tokens = createTokens(user.id, user.email);
    const userResponse = createUserResponse(user);

    res.json({
      status: 'success',
      message: 'Session renewed successfully',
      token: tokens.accessToken,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body) as SignupData;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...validatedData,
        dateOfBirth: new Date(validatedData.dateOfBirth)
      }
    });

    const userResponse = createUserResponse(updatedUser);

    res.json({
      status: 'success',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
  await prisma.sessionLog.updateMany({
    where: {
      userId: req.user.id,
      logoutAt: null
    },
    data: {
      logoutAt: new Date()
    }
  });

  res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
});
