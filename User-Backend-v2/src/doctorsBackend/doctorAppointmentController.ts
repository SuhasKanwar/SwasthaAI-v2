import { Request, Response, NextFunction, RequestHandler } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { UpdateAppointmentStatus, AppointmentFilters, AppointmentParams } from './types';

export class DoctorAppointmentController {
  // Get doctor's appointments with filters
  getAppointments: RequestHandler<AppointmentParams, any, any, AppointmentFilters> = async (req, res, next) => {
    try {
      const doctorId = req.params.doctorId;

      // First verify if the doctor exists
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: doctorId }
      });

      if (!doctor) {
        throw new AppError(404, 'Doctor not found');
      }

      const { status, from, to, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        doctorId: doctor.userId // Use the doctor's profile ID
      };

      if (status) {
        where.appointmentStatus = status;
      }

      if (from || to) {
        where.appointmentDate = {};
        if (from) {
          where.appointmentDate.gte = new Date(from);
        }
        if (to) {
          const toDate = new Date(to);
          toDate.setDate(toDate.getDate() + 1);
          where.appointmentDate.lt = toDate;
        }
      }

      const appointments = await prisma.appointment.findMany({
        where,
        orderBy: [
          { appointmentDate: 'desc' },
          { appointmentSlot: 'desc' }
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
            uploadedDocuments: apt.uploadedDocuments as any[],
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
  };

  // Get single appointment details
  getAppointment: RequestHandler<AppointmentParams> = async (req, res, next) => {
    try {
      const { doctorId, appointmentId } = req.params;

      // First verify if the doctor exists
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: doctorId }
      });

      if (!doctor) {
        throw new AppError(404, 'Doctor not found');
      }

      const id = parseInt(appointmentId!);

      if (isNaN(id)) {
        throw new AppError(400, 'Invalid appointment ID');
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id,
          doctorId: doctor.userId // Use the doctor's profile ID
        }
      });

      if (!appointment) {
        throw new AppError(404, 'Appointment not found');
      }

      res.json({
        status: 'success',
        data: {
          ...appointment,
          uploadedDocuments: appointment.uploadedDocuments as any[],
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Update appointment status (accept/reject/complete/cancel)
  updateAppointmentStatus: RequestHandler<AppointmentParams, any, UpdateAppointmentStatus> = async (req, res, next) => {
    try {
      const { doctorId, appointmentId } = req.params;

      // First verify if the doctor exists
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: doctorId }
      });

      if (!doctor) {
        throw new AppError(404, 'Doctor not found');
      }

      const updateData = req.body;
      const id = parseInt(appointmentId!);

      if (isNaN(id)) {
        throw new AppError(400, 'Invalid appointment ID');
      }

      // Verify appointment exists and belongs to doctor
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          doctorId: doctor.userId // Use the doctor's profile ID
        }
      });

      if (!existingAppointment) {
        throw new AppError(404, 'Appointment not found');
      }

      // Check if update is allowed based on current status
      if (['Cancelled', 'Completed', 'Rejected'].includes(existingAppointment.appointmentStatus)) {
        throw new AppError(400, `Cannot update a ${existingAppointment.appointmentStatus.toLowerCase()} appointment`);
      }

      // Prepare data for update
      const dataToUpdate: any = {
        appointmentStatus: updateData.appointmentStatus,
        updatedAt: new Date()
      };

      // Add confirmation message based on status
      if (updateData.appointmentStatus === 'Confirmed') {
        dataToUpdate.confirmationMessage = updateData.confirmationMessage || 
          `Your appointment is confirmed with Dr. ${existingAppointment.doctorName} on ${existingAppointment.appointmentDate.toDateString()} at ${existingAppointment.appointmentSlot}.`;
      } else if (updateData.appointmentStatus === 'Rejected' || updateData.appointmentStatus === 'Cancelled') {
        dataToUpdate.confirmationMessage = updateData.confirmationMessage || 
          `Your appointment with Dr. ${existingAppointment.doctorName} has been ${updateData.appointmentStatus.toLowerCase()}. ${updateData.cancelReason ? `Reason: ${updateData.cancelReason}` : ''}`;
        dataToUpdate.cancelReason = updateData.cancelReason;
      } else if (updateData.appointmentStatus === 'Completed') {
        dataToUpdate.confirmationMessage = updateData.confirmationMessage || 
          `Your appointment with Dr. ${existingAppointment.doctorName} has been completed.`;
        if (updateData.prescriptionUrl) {
          dataToUpdate.prescriptionUrl = updateData.prescriptionUrl;
        }
      }

      const appointment = await prisma.appointment.update({
        where: { id },
        data: dataToUpdate
      });

      res.json({
        status: 'success',
        message: `Appointment status updated to ${appointment.appointmentStatus}`,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  };
} 