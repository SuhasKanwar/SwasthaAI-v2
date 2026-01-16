import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types/auth.types';
import { uploadToCloud } from '../utils/fileUtils';
import {
  CreateAppointment,
  UpdateAppointment,
  AppointmentListQuery,
  RescheduleAppointment // Import the new type
} from '../schemas/doctorSearchSchemas';

export const appointmentController = {
  // Book new appointment
  createAppointment: async (req: AuthRequest & { files?: Express.Multer.File[] }, res: Response, next: NextFunction) => {
    try {
      const appointmentData = req.body as CreateAppointment;
      const files = req.files || [];
      const userId = req.user.id;

      // Verify doctor exists and get details
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: appointmentData.doctorId },
        select: {
          displayName: true,
          profilePicture: true,
          specialty: true,
          providesOnlineConsultation: true // Needed to determine appointmentMode
        }
      });
      if (!doctor) {
        throw new AppError(404, 'Doctor not found');
      }

      // Determine which clinic to use
      let clinicToUse: { id: string; name: string; address: string; googleMapsLink: string | null } | null = null;

      if (appointmentData.clinicId) {
        // If clinicId is provided, fetch that specific clinic
        clinicToUse = await prisma.doctorClinic.findUnique({
          where: { id: appointmentData.clinicId, doctorId: appointmentData.doctorId },
          select: { id: true, name: true, address: true, googleMapsLink: true }
        });
        if (!clinicToUse) {
          throw new AppError(404, 'Specified clinic not found for this doctor');
        }
      } else {
        // If clinicId is not provided, fetch the first available clinic for the doctor
        const clinics = await prisma.doctorClinic.findMany({
          where: { doctorId: appointmentData.doctorId },
          select: { id: true, name: true, address: true, googleMapsLink: true },
          take: 1
        });
        if (clinics.length === 0) {
          throw new AppError(400, 'Doctor has no associated clinics. Cannot book appointment.');
        }
        clinicToUse = clinics[0];
      }

      // Determine appointmentMode based on doctor's profile (assuming online if clinic is not physical)
      // This logic might need refinement based on how clinic types are handled
      const appointmentMode = doctor.providesOnlineConsultation ? 'Online' : 'In-Person';

      // Check if slot is available (using date and slot)
      // Note: This check might need refinement based on how slots are stored/managed
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: appointmentData.doctorId,
          appointmentDate: appointmentData.appointmentDate, // Use date part
          appointmentSlot: appointmentData.appointmentSlot, // Use slot string
          appointmentStatus: {
            not: 'Cancelled'
          }
        }
      });

      if (existingAppointment) {
        throw new AppError(400, 'This time slot is already booked');
      }

      // Get user details (if not using provided name/contact)
      // const user = await prisma.user.findUnique({ where: { id: userId } });
      // if (!user) throw new AppError(404, 'User not found');

      // Upload any attached documents
      const uploadedDocuments = await Promise.all(
        files.map(async (file) => {
          const url = await uploadToCloud(file);
          return {
            fileName: file.originalname,
            fileUrl: url,
            fileType: file.mimetype,
            uploadedAt: new Date()
          };
        })
      );

      // Get patient's previous appointments count
      const previousAppointments = await prisma.appointment.count({
        where: {
          patientId: userId,
          doctorId: appointmentData.doctorId
        }
      });

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          // Doctor Info
          doctorId: appointmentData.doctorId,
          doctorName: doctor.displayName,
          doctorPhotoUrl: doctor.profilePicture || '', // Use fetched doctor photo
          specialization: doctor.specialty,
          // Clinic Info - Use the determined clinic
          clinicId: clinicToUse.id,
          clinicName: clinicToUse.name,
          clinicAddress: clinicToUse.address,
          googleMapsLink: clinicToUse.googleMapsLink,
          // Appointment Details
          appointmentDate: appointmentData.appointmentDate,
          appointmentSlot: appointmentData.appointmentSlot,
          // appointmentMode: appointmentMode, // Field does not exist in current schema, removed. Mode is implicit (In-Person/Online based on clinic/doctor)
          appointmentStatus: 'Pending Confirm', // Shortened status to fit VARCHAR(20)
          // Patient Info
          patientId: userId,
          patientName: appointmentData.patientName, // Use provided name
          patientContact: appointmentData.patientContact, // Use provided contact
          addressType: appointmentData.addressType,
          // User Input
          symptomsEntered: appointmentData.symptomsEntered || null,
          uploadedDocuments: uploadedDocuments, // JSON field
          // Payment & Meta
          paymentStatus: 'Pending', // Default, handle payment logic separately
          payOnConsultation: appointmentData.payOnConsultation,
          previousTotalAppointments: previousAppointments,
          rescheduleAvailable: true, // Default
          cancelAvailable: true, // Default
          confirmationMessage: 'Your appointment is booked and pending confirmation from the doctor.' // Updated default message
        },
        // Include related data if needed in the response
        // include: { doctor: { select: { ... } } }
      });

      res.status(201).json({
        status: 'success',
        message: 'Appointment booking initiated successfully. Waiting for doctor confirmation.',
        data: appointment // Return the created appointment object
      });
    } catch (error) {
      next(error);
    }
  },

  // Update appointment status (minor adjustments for new fields if needed)
  // updateAppointment: async (req: AuthRequest, res: Response, next: NextFunction) => {
  //   try {
  //     const { id } = req.params;
  //     const updateData = req.body as UpdateAppointment;

  //     // Convert symptoms array to string if needed
  //     if (Array.isArray(req.body.symptoms)) {
  //       req.body.symptoms = req.body.symptoms.join(', ');
  //     }

  //     // Verify appointment exists and belongs to user
  //     const existingAppointment = await prisma.appointment.findFirst({
  //       where: {
  //         id: parseInt(id),
  //         // Assuming doctors might update status too, adjust auth logic if needed
  //         // patientId: req.user.id 
  //       }
  //     });

  //     if (!existingAppointment) {
  //       throw new AppError(404, 'Appointment not found');
  //     }

  //     // Check if update is allowed based on current status
  //     if (existingAppointment.appointmentStatus === 'Cancelled' || existingAppointment.appointmentStatus === 'Completed') {
  //       throw new AppError(400, `Cannot update a ${existingAppointment.appointmentStatus.toLowerCase()} appointment`);
  //     }

  //     // Logic for cancellation/rescheduling might need adjustment based on who performs the action
  //     if (updateData.appointmentStatus === 'Cancelled') {
  //       if (!existingAppointment.cancelAvailable) {
  //         throw new AppError(400, 'Cancellation is not available for this appointment');
  //       }
  //       // If cancelling, store the original date/slot if needed (using rescheduledFrom)
  //       // updateData.rescheduledFrom = existingAppointment.appointmentDate; // Adjust as needed
  //     }
      
  //     // Prepare data for update, including the confirmation message
  //     const dataToUpdate: any = { ...updateData, updatedAt: new Date() };

  //     // Add confirmation message update based on status
  //     if (updateData.appointmentStatus === 'Confirmed') {
  //         dataToUpdate.confirmationMessage = `Your appointment is confirmed with ${existingAppointment.doctorName} on ${existingAppointment.appointmentDate.toDateString()} at ${existingAppointment.appointmentSlot}.`;
  //     } else if (updateData.appointmentStatus === 'Cancelled') {
  //         dataToUpdate.confirmationMessage = `Your appointment with ${existingAppointment.doctorName} has been cancelled. Reason: ${updateData.cancelReason || 'Not specified'}`;
  //     }


  //     const appointment = await prisma.appointment.update({
  //       where: { id: parseInt(id) },
  //       data: dataToUpdate, // Use the prepared data object
  //       // Include related data if needed
  //     });

  //     res.json({
  //       status: 'success',
  //       message: `Appointment status updated to ${appointment.appointmentStatus}`,
  //       data: appointment
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  // Get user's appointments (adjust for new fields)
  getAppointments: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, from, to, page = 1, limit = 10 } = req.query as unknown as AppointmentListQuery;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        patientId: req.user.id
      };

      if (status) {
        where.appointmentStatus = status;
      }

      // Filter by date range using appointmentDate
      if (from || to) {
        where.appointmentDate = {};
        if (from) {
          where.appointmentDate.gte = new Date(from);
        }
        if (to) {
          // Add 1 day to 'to' date to include the whole day
          const toDate = new Date(to);
          toDate.setDate(toDate.getDate() + 1);
          where.appointmentDate.lt = toDate;
        }
      }

      const appointments = await prisma.appointment.findMany({
        where,
        // Select specific fields to match PRD/frontend needs if necessary
        // select: { ... } 
        orderBy: [
          { appointmentDate: 'desc' },
          { appointmentSlot: 'desc' } // Or handle slot sorting appropriately
        ],
        skip: skip,
        take: Number(limit)
      });

      const total = await prisma.appointment.count({ where });

      res.json({
        status: 'success',
        data: {
          appointments: appointments.map(apt => ({
            ...apt,
            uploadedDocuments: apt.uploadedDocuments as any[], // Ensure JSON field is parsed
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get appointment details (adjust for new fields)
  getAppointment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const appointmentId = parseInt(id);

      if (isNaN(appointmentId)) {
        throw new AppError(400, 'Invalid appointment ID');
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          patientId: req.user.id // Ensure user can only access their own appointments
        },
        // Include related data if needed, e.g., full doctor profile
        // include: { doctor: true } 
      });

      if (!appointment) {
        throw new AppError(404, 'Appointment not found');
      }

      res.json({
        status: 'success',
        data: {
          ...appointment,
          uploadedDocuments: appointment.uploadedDocuments as any[], // Ensure JSON field is parsed
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Reschedule appointment
  rescheduleAppointment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { appointmentDate: newDate, appointmentSlot: newSlot } = req.body as RescheduleAppointment;
      const appointmentId = parseInt(id);
      const userId = req.user.id;

      if (isNaN(appointmentId)) {
        throw new AppError(400, 'Invalid appointment ID');
      }

      // 1. Verify the original appointment exists and belongs to the user
      const originalAppointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          patientId: userId
        }
      });

      if (!originalAppointment) {
        throw new AppError(404, 'Appointment not found');
      }

      // 2. Check if rescheduling is allowed (e.g., not already cancelled/completed, within allowed timeframe)
      if (!originalAppointment.rescheduleAvailable) {
        throw new AppError(400, 'This appointment cannot be rescheduled at this time.');
      }
      if (['Cancelled', 'Completed'].includes(originalAppointment.appointmentStatus)) {
        throw new AppError(400, `Cannot reschedule a ${originalAppointment.appointmentStatus.toLowerCase()} appointment.`);
      }
      // Add more time-based rules if needed (e.g., cannot reschedule within 24 hours)

      // 3. Check if the NEW slot is available
      const existingAppointmentInNewSlot = await prisma.appointment.findFirst({
        where: {
          doctorId: originalAppointment.doctorId,
          appointmentDate: newDate,
          appointmentSlot: newSlot,
          appointmentStatus: {
            not: 'Cancelled'
          },
          id: { // Exclude the current appointment itself from the check
            not: appointmentId 
          }
        }
      });

      if (existingAppointmentInNewSlot) {
        throw new AppError(400, 'The selected new time slot is already booked.');
      }

      // 4. Update the appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          appointmentDate: newDate,
          appointmentSlot: newSlot,
          rescheduledFrom: originalAppointment.appointmentDate, // Store original date for history
          appointmentStatus: 'Confirmed', // Or keep as 'Pending Doctor Confirmation' if needed
          confirmationMessage: `Your appointment has been successfully rescheduled with Dr. ${originalAppointment.doctorName} on ${newDate.toDateString()} at ${newSlot}.`,
          updatedAt: new Date()
        }
      });

      res.json({
        status: 'success',
        message: 'Appointment rescheduled successfully.',
        data: updatedAppointment
      });

    } catch (error) {
      next(error);
    }
  }
};
