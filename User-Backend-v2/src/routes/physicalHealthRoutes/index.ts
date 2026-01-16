import { Router } from 'express';
import healthVaultRoutes from './healthVaultRoutes';
import userRoutes from './userRoutes/profileRoutes';
import addressRoutes from './userRoutes/addressRoutes';
import medicalProfileRoutes from './userRoutes/medicalProfileRoutes';
import emergencyProfileRoutes from './userRoutes/emergencyProfileRoutes';
import feedbackRoutes from './userRoutes/feedbackRoutes';

const router = Router();

router.use('/health-vault', healthVaultRoutes);
router.use('/user', userRoutes);
router.use('/address', addressRoutes);
router.use('/medical-profile', medicalProfileRoutes);
router.use('/emergency-profile', emergencyProfileRoutes);
router.use('/feedback', feedbackRoutes);

export default router;
