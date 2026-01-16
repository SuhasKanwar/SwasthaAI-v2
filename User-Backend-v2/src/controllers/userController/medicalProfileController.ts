import { Response } from 'express';
import prisma from '../../config/prisma';
import { UpdateMedicalProfileInput } from '../../schemas/medicalProfileSchemas';
import { AppError } from '../../utils/errors';
import { AuthRequest } from '../../types/auth.types';

export const medicalProfileController = {
  // Get medical profile
  getMedicalProfile: async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    const profile = await prisma.medicalProfile.findUnique({
      where: { userId }
    });

    // If no profile exists, return default structure
    if (!profile) {
      return res.json({
        success: true,
        data: {
          bloodType: "",
          heightCm: null,
          weightKg: null,
          chronicConditions: [],
          mentalHealthSymptoms: [],
          medications: [],
          allergies: [],
          surgeries: [],
          familyMedicalHistory: [],
          currentDoctors: [],
          vaccinationRecords: []
        },
        message: 'No medical profile found. Use update endpoint to create one.'
      });
    }

    return res.json({
      success: true,
      data: profile
    });
  },

  // Update medical profile
  updateMedicalProfile: async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const data: UpdateMedicalProfileInput = req.body;

    try {
      const profile = await prisma.medicalProfile.upsert({
        where: { userId },
        update: {
          bloodType: data.bloodType,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          chronicConditions: data.chronicConditions,
          mentalHealthSymptoms: data.mentalHealthSymptoms,
          medications: data.medications,
          allergies: data.allergies,
          surgeries: data.surgeries,
          familyMedicalHistory: data.familyMedicalHistory,
          currentDoctors: data.currentDoctors,
          vaccinationRecords: data.vaccinationRecords,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...data,
        }
      });

      return res.json({
        success: true,
        message: 'Medical profile updated successfully',
        data: profile
      });
    } catch (error) {
      throw new AppError(500, 'Failed to update medical profile');
    }
  }
};
