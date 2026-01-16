import { DoctorProfile, Doctor, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { GoogleMapsService } from './googleMapsService'; // Assuming this exists for future use
import { DoctorClinic, DoctorReview, DoctorFAQ } from '@prisma/client'; // Import related types

interface SearchOptions {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  specialty?: string;
  name?: string;
  languages?: string[];
  page?: number;
  limit?: number;
}

interface ProcessedDoctor extends DoctorProfile {
  email?: string;
  isVerified?: boolean;
  score?: number;
  distance?: number;
  // Add related models to the processed type
  clinics?: DoctorClinic[];
  reviews?: DoctorReview[]; // Or just summary fields
  faqs?: DoctorFAQ[];
}

export class DoctorSearchService {
  private static readonly DISTANCE_THRESHOLD = 50000; // 50km in meters
  private static readonly NEARBY_THRESHOLD = 2000;    // 2km in meters
  private static readonly MEDIUM_DISTANCE_THRESHOLD = 5000;   // 5km in meters
  private static readonly FAR_DISTANCE_THRESHOLD = 20000;     // 20km in meters
  private static readonly RATING_WEIGHT = 0.4;
  private static readonly DISTANCE_WEIGHT = 0.6;

  static calculateScore(doctor: DoctorProfile, distance?: number): number {
    // Use actual avgRating (scaled 0-100 for consistency if needed)
    const ratingScore = (doctor.avgRating || 0) * 20; // Scale 0-5 rating to 0-100

    if (!distance) return ratingScore; // Return rating score if no distance

    let distanceWeight = this.DISTANCE_WEIGHT;
    if (distance <= this.NEARBY_THRESHOLD) {
      distanceWeight = 0.8; // Very close doctors get higher distance weight
    } else if (distance <= this.MEDIUM_DISTANCE_THRESHOLD) {
      distanceWeight = 0.6;
    } else if (distance <= this.FAR_DISTANCE_THRESHOLD) {
      distanceWeight = 0.4;
    }

    const distanceScore = 100 * (1 - (distance / this.DISTANCE_THRESHOLD));
    const ratingWeight = 1 - distanceWeight; // Use rating weight

    // Combine scores
    return (distanceScore * distanceWeight) + (ratingScore * ratingWeight);
  }

  static async searchDoctors(options: SearchOptions) {
    const { userLocation, specialty, name, languages, page = 1, limit = 10 } = options;

    const where: Prisma.DoctorProfileWhereInput = {};
    if (specialty) {
      where.specialty = {
        contains: specialty,
        mode: 'insensitive'
      };
    }
    if (name) {
      where.displayName = {
        contains: name,
        mode: 'insensitive'
      };
    }
    if (languages?.length) {
      // Prisma doesn't support array_contains directly for JSON in PostgreSQL
      // This requires raw query or different schema design if JSON filtering is needed.
      // Skipping language filter for now based on current schema limitations.
      // if (languages?.length) {
      //   where.languagesSpoken = { hasSome: languages }; // Example if using array type
      // }
    }

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: {
        doctor: { // Basic doctor info
          select: {
            email: true,
            isVerified: true
          }
        },
        clinics: true, // Include clinics
        // Optionally include limited reviews or just counts for search results
        // reviews: { take: 3, orderBy: { reviewDate: 'desc' } }, 
        // faqs: { take: 3 } 
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: {
        // Consider ordering by avgRating or a calculated score later
        avgRating: 'desc' 
      }
    });

    const total = await prisma.doctorProfile.count({ where });

    // Process doctors: Add basic info, calculate score (if location provided)
    let processedDoctors: ProcessedDoctor[] = await Promise.all(doctors.map(async doc => {
      const baseDoctor: ProcessedDoctor = {
        ...doc,
        email: doc.doctor.email,
        isVerified: doc.doctor.isVerified,
        // Ensure related fields are correctly typed or cast if needed
        clinics: doc.clinics, 
        // reviews: doc.reviews, 
        // faqs: doc.faqs
      };

      if (userLocation && doc.clinics.length > 0) {
        // TODO: Implement distance calculation based on clinic addresses
        // For now, calculate score based on rating only
        // let nearestDistance: number | undefined;
        // for (const clinic of doc.clinics) {
        //   // Need clinic coordinates or use geocoding service
        //   // const distance = await GoogleMapsService.calculateDistance(...);
        //   // nearestDistance = Math.min(nearestDistance ?? Infinity, distance);
        // }
        // baseDoctor.distance = nearestDistance;
        baseDoctor.score = this.calculateScore(doc /*, nearestDistance*/);
      } else {
        // Calculate score based on rating only if no location or clinics
        baseDoctor.score = this.calculateScore(doc);
      }
      return baseDoctor;
    }));

    // Sort by score if calculated
    if (userLocation || processedDoctors.some(d => d.score !== undefined)) {
      processedDoctors.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    
    // Remove the nested 'doctor' object before sending response
    // Perform destructuring inside the map where 'doc' still has the nested 'doctor'
    const finalDoctors = doctors.map(doc => {
       const { doctor, ...rest } = doc; // Destructure from original Prisma result
       const processed = processedDoctors.find(p => p.userId === doc.userId); // Find matching processed data
       return { ...rest, email: doctor.email, isVerified: doctor.isVerified, score: processed?.score, distance: processed?.distance }; // Combine profile data with processed info
    });


    return {
      doctors: finalDoctors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  static async getDoctorById(id: string): Promise<ProcessedDoctor | null> {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: id },
      include: {
        doctor: {
          select: {
            email: true,
            isVerified: true
          }
        },
        // Include all related data for the full profile view
        clinics: true,
        reviews: { // Fetch recent reviews
          orderBy: { reviewDate: 'desc' },
          take: 10 // Limit number of reviews initially loaded
        },
        faqs: true,
      }
    });

    if (!doctor) return null;

    // Calculate score (without distance for single profile view)
    const score = this.calculateScore(doctor);
    
    // Remove nested doctor object before returning
    const { doctor: nestedDoctor, ...profileData } = doctor;

    return {
      ...profileData,
      email: nestedDoctor.email,
      isVerified: nestedDoctor.isVerified,
      score: score
    };
  }

  static async getNearbyDoctors(latitude: number, longitude: number, limit: number = 10): Promise<ProcessedDoctor[]> {
    // Fetch doctors with clinics first, then calculate distance/score
    // This requires clinic location data (lat/lng) or geocoding
    
    // Placeholder: Return doctors with clinics, ordered by rating
    const doctors = await prisma.doctorProfile.findMany({
       where: {
         clinics: { // Only fetch doctors who have associated clinics
           some: {} 
         }
       },
       include: {
         doctor: { select: { email: true, isVerified: true } },
         clinics: true, // Need clinics for potential distance calculation
       },
       take: limit * 5, // Fetch more initially to filter/sort by distance later
       orderBy: {
         avgRating: 'desc'
       }
     });

    // TODO: Implement actual distance calculation and sorting when clinic coordinates are available
    // For now, just process and return the top 'limit' based on rating score

    const processedDoctors: ProcessedDoctor[] = doctors.map(doc => {
       const baseDoctor: ProcessedDoctor = {
         ...doc,
         email: doc.doctor.email,
         isVerified: doc.doctor.isVerified,
         clinics: doc.clinics,
         score: this.calculateScore(doc) // Score based on rating for now
       };
       return baseDoctor;
     });

    // Sort by score (rating) and take the limit
    processedDoctors.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Remove nested doctor object using the same pattern as searchDoctors
    const topDoctors = processedDoctors.slice(0, limit);
    const finalDoctors = topDoctors.map(doc => {
        // Find the original Prisma doc to get the nested 'doctor' object for destructuring
        const originalDoc = doctors.find(d => d.userId === doc.userId);
        if (!originalDoc) return doc; // Should not happen, but safeguard
        const { doctor: nestedDoctorInfo, ...rest } = originalDoc;
        // Combine the rest of the original data (like clinics) with processed info (score, email, isVerified)
        return { ...rest, clinics: doc.clinics, email: doc.email, isVerified: doc.isVerified, score: doc.score };
    });


    return finalDoctors;
  }
}
