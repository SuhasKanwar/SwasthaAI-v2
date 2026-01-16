import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types/auth.types';
import { DoctorSearchService } from '../services/doctorSearchService';

export const doctorController = {
  // Get doctor profile
  getDoctorProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const doctor = await DoctorSearchService.getDoctorById(id);

      if (!doctor) {
        throw new AppError(404, 'Doctor not found');
      }

      res.json({
        status: 'success',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  },

  // Search doctors with advanced filtering and scoring
  searchDoctors: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { lat, lng, specialty, name, languages, page, limit } = req.query;
      
      const searchOptions: any = {
        page,
        limit
      };

      if (lat && lng) {
        searchOptions.userLocation = {
          latitude: parseFloat(lat as string),
          longitude: parseFloat(lng as string)
        };
      }

      if (specialty) searchOptions.specialty = specialty as string;
      if (name) searchOptions.name = name as string;
      if (languages) searchOptions.languages = (languages as string).split(',');

      const result = await DoctorSearchService.searchDoctors(searchOptions);

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Get nearby doctors
  getNearbyDoctors: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { lat, lng, limit } = req.query;

      if (!lat || !lng) {
        throw new AppError(400, 'Latitude and longitude are required');
      }

      const doctors = await DoctorSearchService.getNearbyDoctors(
        parseFloat(lat as string),
        parseFloat(lng as string),
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        status: 'success',
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  },

  // Get doctor's availability
  getDoctorAvailability: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { date } = req.query;

      // First verify doctor exists
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: id }
      });

      if (!doctor) {
        throw new AppError(404, 'Doctor not found');
      }

      const queryDate = new Date(date as string);
      queryDate.setHours(0, 0, 0, 0); // Ensure we compare date part only

      // Get booked slots for the specified date
      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: id,
          appointmentDate: queryDate, // Filter by date
          appointmentStatus: {
            not: 'Cancelled' // Ignore cancelled appointments
          }
        },
        select: {
          appointmentSlot: true // Select only the booked slot string
        }
      });
      
      const bookedSlots = new Set(bookedAppointments.map(app => app.appointmentSlot));

      // Generate potential time slots (e.g., 9:00 AM to 4:30 PM, 30-min intervals)
      const availableSlots = [];
      const startTime = 9 * 60; // 9:00 AM in minutes
      const endTime = 17 * 60; // 5:00 PM in minutes
      const interval = 30; // 30 minutes

      for (let minutes = startTime; minutes < endTime; minutes += interval) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        // Format the slot string consistently (e.g., HH:MM) - adjust format as needed
        const slotString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`; 

        if (!bookedSlots.has(slotString)) {
          availableSlots.push(slotString); // Add the string representation
        }
      }

      res.json({
        status: 'success',
        data: {
          doctorId: id,
          date: date,
          availableSlots,
          providesOnlineConsultation: doctor.providesOnlineConsultation
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
