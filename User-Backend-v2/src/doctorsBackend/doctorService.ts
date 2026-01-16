import { PrismaClient } from '@prisma/client';
import { 
  CreateDoctorDto, 
  UpdateDoctorDto, 
  CreateDoctorProfileDto,
  CreateDoctorClinicDto,
  CreateDoctorReviewDto,
  CreateDoctorFAQDto
} from './types';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class DoctorService {
  // Create a new doctor
  async createDoctor(data: CreateDoctorDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.doctor.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  // Get doctor by ID
  async getDoctorById(id: string) {
    return prisma.doctor.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            clinics: true,
            reviews: true,
            faqs: true,
          },
        },
      },
    });
  }

  // Get doctor by email
  async getDoctorByEmail(email: string) {
    return prisma.doctor.findUnique({
      where: { email },
    });
  }

  // Update doctor
  async updateDoctor(id: string, data: UpdateDoctorDto) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return prisma.doctor.update({
      where: { id },
      data,
    });
  }

  // Create doctor profile
  async createDoctorProfile(doctorId: string, data: CreateDoctorProfileDto) {
    return prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true },
      });

      if (!doctor) {
        const user = await tx.user.findUnique({
          where: { id: doctorId },
          select: { email: true },
        });

        if (!user) {
          throw new Error('Doctor user not found');
        }

        const tempPassword = await bcrypt.hash(crypto.randomUUID(), 10);

        await tx.doctor.create({
          data: {
            id: doctorId,
            email: user.email,
            password: tempPassword,
          },
        });
      }

      const profile = await tx.doctorProfile.upsert({
        where: { userId: doctorId },
        create: {
          ...data,
          userId: doctorId,
        },
        update: {
          ...data,
        },
      });

      await tx.doctor.update({
        where: { id: doctorId },
        data: { isProfileCompleted: true },
      });

      return profile;
    });
  }

  // Update doctor profile
  async updateDoctorProfile(doctorId: string, data: Partial<CreateDoctorProfileDto>) {
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      select: { userId: true },
    });

    if (!profile) {
      throw new Error('Doctor profile not found');
    }

    return prisma.doctorProfile.update({
      where: { userId: doctorId },
      data,
    });
  }

  // Add clinic to a doctor's profile
  async addClinic(doctorId: string, data: CreateDoctorClinicDto) {
    return prisma.doctorClinic.create({
      data: {
        ...data,
        doctorProfile: {
          connect: { userId: doctorId },
        },
      },
    });
  }

  // Update a clinic
  async updateClinic(clinicId: string, data: Partial<CreateDoctorClinicDto>) {
    return prisma.doctorClinic.update({
      where: { id: clinicId },
      data,
    });
  }

  // Delete a clinic
  async deleteClinic(clinicId: string) {
    return prisma.doctorClinic.delete({
      where: { id: clinicId },
    });
  }

  // Add a review for a doctor
  async addReview(doctorId: string, data: CreateDoctorReviewDto) {
    const review = await prisma.doctorReview.create({
      data: {
        ...data,
        doctorProfile: {
          connect: { userId: doctorId },
        },
      },
    });

    // Update doctor's average rating
    const reviews = await prisma.doctorReview.findMany({
      where: { doctorId },
    });

    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

    await prisma.doctorProfile.update({
      where: { userId: doctorId },
      data: {
        avgRating,
        ratingCount: reviews.length,
        reviewsCount: reviews.length,
      },
    });

    return review;
  }

  // Add an FAQ for a doctor
  async addFAQ(doctorId: string, data: CreateDoctorFAQDto) {
    return prisma.doctorFAQ.create({
      data: {
        ...data,
        doctorProfile: {
          connect: { userId: doctorId },
        },
      },
    });
  }

  // Update an FAQ
  async updateFAQ(faqId: string, data: Partial<CreateDoctorFAQDto>) {
    return prisma.doctorFAQ.update({
      where: { id: faqId },
      data,
    });
  }

  // Delete an FAQ
  async deleteFAQ(faqId: string) {
    return prisma.doctorFAQ.delete({
      where: { id: faqId },
    });
  }

  // Get all doctors with pagination
  async getAllDoctors(skip: number, take: number) {
    return prisma.doctor.findMany({
      skip,
      take,
      include: {
        profile: true,
      },
    });
  }

  // Search for doctors by name, specialty, etc.
  async searchDoctors(query: string, skip: number, take: number) {
    return prisma.doctor.findMany({
      where: {
        OR: [
          {
            profile: {
              displayName: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            profile: {
              specialty: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      skip,
      take,
      include: {
        profile: true,
      },
    });
  }
} 