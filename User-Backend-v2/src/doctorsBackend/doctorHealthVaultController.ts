import { RequestHandler } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';

type DoctorVaultParams = {
  doctorId: string;
};

type DoctorVaultQuery = {
  page?: string;
  limit?: string;
};

export class DoctorHealthVaultController {
  getRecords: RequestHandler<DoctorVaultParams, any, any, DoctorVaultQuery> = async (req, res, next) => {
    try {
      const { doctorId } = req.params;
      const { page = '1', limit = '10' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: doctorId }
      });

      if (!doctor) {
        throw new AppError(404, 'Doctor not found');
      }

      const where = {
        doctorRegistrationNo: doctor.medicalRegistrationNumber,
        recordType: 'PRESCRIPTION'
      };

      const [records, total] = await Promise.all([
        prisma.healthRecord.findMany({
          where,
          orderBy: { date: 'desc' },
          skip,
          take: Number(limit),
          include: {
            prescription: {
              include: {
                medicines: true,
                labTests: true
              }
            }
          }
        }),
        prisma.healthRecord.count({ where })
      ]);

      res.json({
        status: 'success',
        data: {
          records,
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
}
