import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import {
  requestOTP,
  verifySignupOTP,
  setupSecurityPin,
  initiateChangePIN,
  changeSecurityPIN,
  changeAuthenticatedUserPin,
  login,
  verifyLoginPin,
  verifyLoginOTP,
  verifySecurityPin,
  refreshToken,
  updateProfile,
  logout,
  whatsappRegister,
  whatsappCheck
} from '../../controllers/authController/authController';
import {
  authenticatedChangePinSchema,
  setupPinSchema,
  changePinSchema,
  loginSchema,
  loginPinSchema,
  otpVerificationSchema,
  pinVerificationSchema,
  refreshTokenSchema,
  updateProfileSchema,
  requestOtpSchema,
  whatsappRegisterSchema,
  whatsappCheckSchema
} from '../../validation/authSchemas';

const router = Router();

// Public routes
router.post('/request-otp', validateBody(requestOtpSchema), requestOTP);
router.post('/verify-otp', validateBody(otpVerificationSchema), verifySignupOTP);
router.post('/setup-pin', validateBody(setupPinSchema), setupSecurityPin);
router.post('/initiate-pin-change', validateBody(requestOtpSchema), initiateChangePIN);
router.post('/change-pin', validateBody(changePinSchema), changeSecurityPIN);
router.post('/login', validateBody(loginSchema), login);
router.post('/verify-login-pin', validateBody(loginPinSchema), verifyLoginPin);
router.post('/verify-login-otp', validateBody(otpVerificationSchema), verifyLoginOTP);
router.post('/refresh-token', validateBody(refreshTokenSchema), refreshToken);
// WhatsApp registration (API key or token)
router.post('/whatsapp-register', authenticateToken, validateBody(whatsappRegisterSchema), whatsappRegister);
// WhatsApp check (API key or token)
router.post('/whatsapp-check', authenticateToken, validateBody(whatsappCheckSchema), whatsappCheck);

// Protected routes - apply authenticateToken middleware to each protected route
router.post('/change-pin-authenticated', authenticateToken, validateBody(authenticatedChangePinSchema), changeAuthenticatedUserPin);
router.post('/verify-pin', authenticateToken, validateBody(pinVerificationSchema), verifySecurityPin);
router.post('/update-profile', authenticateToken, validateBody(updateProfileSchema), updateProfile);
router.post('/logout', authenticateToken, logout);

export default router;
