import { Doctor, DoctorProfile, DoctorClinic, DoctorReview, DoctorFAQ } from '@prisma/client';

export interface CreateDoctorDto {
  email: string;
  password: string;
  securityPin?: string;
}

export interface UpdateDoctorDto {
  email?: string;
  password?: string;
  securityPin?: string;
  isVerified?: boolean;
  isProfileCompleted?: boolean;
}

export interface CreateDoctorProfileDto {
  displayName: string;
  profilePicture?: string;
  specialty: string;
  expertiseAreas: string[];
  bio?: string;
  yearsOfExperience: number;
  degree: string;
  college: string;
  certifications?: string[];
  medicalRegistrationNumber: string;
  languagesSpoken: string[];
  consultationFees: number;
  payOnConsultation: boolean;
  providesOnlineConsultation: boolean;
  genderPreference?: string;
}

export interface CreateDoctorClinicDto {
  name: string;
  address: string;
  googleMapsLink?: string;
  availabilityDates: any; // Array of available dates
  availabilitySlots: any; // Array of time slots per date
}

export interface CreateDoctorReviewDto {
  userId: string;
  userName: string;
  rating: number;
  reviewText?: string;
}

export interface CreateDoctorFAQDto {
  question: string;
  answer: string;
}

export interface DoctorWithProfile extends Doctor {
  profile?: DoctorProfile;
}

export interface DoctorProfileWithRelations extends DoctorProfile {
  clinics: DoctorClinic[];
  reviews: DoctorReview[];
  faqs: DoctorFAQ[];
}

// Appointment types
export interface UpdateAppointmentStatus {
  appointmentStatus: 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled';
  confirmationMessage?: string;
  cancelReason?: string;
  prescriptionUrl?: string;
}

export interface AppointmentFilters {
  status?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
  [key: string]: string | undefined;  // Add index signature
}

export type AppointmentParams = {
  doctorId: string;
  appointmentId?: string;
}; 