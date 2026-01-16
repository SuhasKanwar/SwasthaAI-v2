import { Response } from 'express';
import prisma from '../../config/prisma';
import { UpdateEmergencyProfileInput, UpdateSosSettingsInput } from '../../schemas/emergencyProfileSchemas';
import { AppError } from '../../utils/errors';
import { AuthRequest } from '../../types/auth.types';

export const emergencyProfileController = {
  // Get emergency profile
  getEmergencyProfile: async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    const profile = await prisma.emergencyProfile.findUnique({
      where: { userId }
    });

    // If no profile exists, return default structure
    if (!profile) {
      return res.json({
        success: true,
        data: {
          emergencyContacts: [],
          hospitals: [],
          sosEnabled: false,
          locationPermission: false
        },
        message: 'No emergency profile found. Use update endpoint to create one.'
      });
    }

    return res.json({
      success: true,
      data: profile
    });
  },

  // Update emergency profile
  updateEmergencyProfile: async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const data: UpdateEmergencyProfileInput = req.body;

    try {
      const profile = await prisma.emergencyProfile.upsert({
        where: { userId },
        update: {
          emergencyContacts: data.emergencyContacts,
          hospitals: data.hospitals,
          sosEnabled: data.sosEnabled,
          locationPermission: data.locationPermission,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...data,
        }
      });

      return res.json({
        success: true,
        message: 'Emergency profile updated successfully',
        data: profile
      });
    } catch (error) {
      throw new AppError(500, 'Failed to update emergency profile');
    }
  },

  // Update SOS settings
  updateSosSettings: async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const data: UpdateSosSettingsInput = req.body;

    try {
      const profile = await prisma.emergencyProfile.upsert({
        where: { userId },
        update: {
          sosEnabled: data.sosEnabled,
          locationPermission: data.locationPermission,
          updatedAt: new Date()
        },
        create: {
          userId,
          sosEnabled: data.sosEnabled,
          locationPermission: data.locationPermission,
          emergencyContacts: [],
          hospitals: []
        }
      });

      return res.json({
        success: true,
        message: 'SOS settings updated successfully',
        data: profile
      });
    } catch (error) {
      throw new AppError(500, 'Failed to update SOS settings');
    }
  },

  // Generate emergency profile from medical profile
  generateEmergencyProfile: async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    try {
      const medicalProfile = await prisma.medicalProfile.findUnique({
        where: { userId }
      });

      if (!medicalProfile) {
        throw new AppError(404, 'Medical profile not found. Complete medical profile first.');
      }

      // Extract medical information
      const currentDoctors = medicalProfile.currentDoctors as { name: string; contactNumber: string }[];
      
      // Format emergency contacts (doctor information)
      const formattedDoctors = currentDoctors.map(doctor => ({
        name: doctor.name,
        phoneNumber: doctor.contactNumber.replace(/^\+\d{1,3}/, ''), // Remove country code if present
        countryCode: (doctor.contactNumber.match(/^\+\d{1,3}/) || ['+91'])[0], // Extract country code or default to +91
        relation: "Doctor"
      })).slice(0, 3); // Maximum 3 doctors

      // Create or update emergency profile
      const emergencyProfile = await prisma.emergencyProfile.upsert({
        where: { userId },
        update: {
          // Preserve existing emergency contacts if doctors are available
          emergencyContacts: {
            contacts: formattedDoctors.length > 0 ? formattedDoctors : undefined,
            medicalInfo: {
              bloodType: medicalProfile.bloodType,
              allergies: medicalProfile.allergies,
              chronicConditions: medicalProfile.chronicConditions,
              medications: medicalProfile.medications
            }
          },
          updatedAt: new Date()
        },
        create: {
          userId,
          emergencyContacts: {
            contacts: formattedDoctors,
            medicalInfo: {
              bloodType: medicalProfile.bloodType,
              allergies: medicalProfile.allergies,
              chronicConditions: medicalProfile.chronicConditions,
              medications: medicalProfile.medications
            }
          },
          hospitals: [],
          sosEnabled: false,
          locationPermission: false
        }
      });

      return res.json({
        success: true,
        message: 'Emergency profile generated with medical data',
        data: emergencyProfile
      });
    } catch (error) {
      throw new AppError(500, 'Failed to generate emergency profile');
    }
  }
};
