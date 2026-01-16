import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth.types";
import { CreateHealthRecordInput, UpdateNotesInput, ShareRecordInput, CreateMedAlertInput } from "../schemas/healthVaultSchemas";
import { uploadToCloud } from "../utils/fileUtils";
import { sendEmail } from "../utils/emailUtils"; // Import sendEmail
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

interface FilterParams {
  recordType?: string;
  healthType?: string;
  status?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

export class HealthVaultController {
  /**
   * Get all health records with filtering
   */
  async getAllRecords(
    req: AuthRequest & { query: FilterParams },
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        recordType,
        healthType,
        status,
        page = 1,
        limit = 10,
        sortBy = "date",
        sortOrder = "desc",
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      
      const where = {
        user: {
          id: req.user.id
        },
        ...(recordType && { recordType }),
        ...(status && { status })
      };

      // Get total count
      const total = await prisma.healthRecord.count({ where });

      // Get records with pagination and sorting
      const records = await prisma.healthRecord.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          prescription: {
            include: {
              medicines: true,
              labTests: true
            }
          },
          labReport: true
        }
      });

      res.status(200).json({
        records,
        page: Number(page),
        limit: Number(limit),
        total,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new health record
   */
  async createRecord(req: AuthRequest & { file?: Express.Multer.File }, res: Response, next: NextFunction) {
    try {
      const recordData = req.body as CreateHealthRecordInput;
      
      // Handle file upload if present
      let fileUrl: string | undefined;
      
      if (req.file) {
        fileUrl = await uploadToCloud({
          ...req.file,
          folderName: `health-vault/${recordData.record_type.toLowerCase()}`
        });
      }

      let healthRecordData: Prisma.HealthRecordCreateInput;

      if (req.file) {
        // Handle PDF upload
        healthRecordData = {
          user: {
            connect: { id: req.user.id }
          },
          date: recordData.date,
          doctorName: recordData.doctor_name,
          doctorRegistrationNo: '',      // Empty string for PDF uploads
          doctorSpecialization: '',      // Empty string for PDF uploads
          hospitalClinicName: '',        // Empty string for PDF uploads
          hospitalClinicAddress: '',     // Empty string for PDF uploads
          hospitalClinicLogoUrl: null,   // Optional field
          doctorProfilePictureUrl: null, // Optional field
          patientName: '',              // Empty string for PDF uploads
          patientAge: 0,                // Default number for PDF uploads
          patientGender: 'OTHER',       // Default enum value for PDF uploads
          recordType: recordData.record_type,
          status: recordData.status,
          notes: recordData.notes,
          originalFileUrl: fileUrl,
          originalFileType: req.file.mimetype,
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          shared: false
        };
      } else {
        // Handle UHP creation
        healthRecordData = {
          user: {
            connect: { id: req.user.id }
          },
          date: recordData.date,
          doctorName: recordData.doctor_name,
          doctorRegistrationNo: recordData.doctor_registration_no,
          doctorSpecialization: recordData.doctor_specialization,
          doctorProfilePictureUrl: recordData.doctor_profile_picture_url,
          hospitalClinicName: recordData.hospital_clinic_name,
          hospitalClinicAddress: recordData.hospital_clinic_name,
          hospitalClinicLogoUrl: recordData.hospital_clinic_logo_url,
          status: recordData.status,
          notes: recordData.notes,
          shared: recordData.shared || false,
          recordType: recordData.record_type,
          patientName: recordData.patient_name,
          patientAge: recordData.patient_age,
          patientGender: recordData.patient_gender,
          originalFileType: 'application/json',  // Default for UHP records
          originalFileName: 'uhp-record.json',   // Default for UHP records
          fileSize: 0                           // Default for UHP records
        };

        // Add record type specific data
        if (recordData.record_type === 'PRESCRIPTION') {
          healthRecordData.prescription = {
            create: {
              prescriptionType: recordData.prescription_type,
              diagnosis: recordData.diagnosis,
              symptoms: recordData.symptoms,
              doctorAdvice: recordData.doctor_advice,
              followUpDate: recordData.follow_up_date,
              medicines: {
                create: recordData.medicines.map(medicine => ({
                  medicineName: medicine.medicine_name,
                  dosage: medicine.dosage,
                  frequency: medicine.frequency,
                  instructions: medicine.instructions,
                  duration: medicine.duration,
                  chemicalComposition: medicine.chemical_composition,
                  timeSlot: medicine.time_slot || [],
                  form: medicine.form || "tablet"
                }))
              },
              ...(recordData.lab_tests && {
                labTests: {
                  create: recordData.lab_tests.map(test => ({
                    testName: test.test_name,
                    testDescription: test.test_description,
                    bookTestUrl: test.book_test_url
                  }))
                }
              })
            }
          };
        } else if (recordData.record_type === 'LAB_REPORT') {
          healthRecordData.labReport = {
            create: {
              pathologyName: recordData.pathology_name,
              testName: recordData.test_name
            }
          };
        }
      }

      // Create record in database with relationships
      const record = await prisma.healthRecord.create({
        data: healthRecordData,
        include: {
          prescription: {
            include: {
              medicines: true,
              labTests: true
            }
          },
          labReport: true
        }
      });
      
      res.status(201).json({ 
        message: "Health record created successfully",
        record
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single record by ID
   */
  async getRecordById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.params;
      const record = await prisma.healthRecord.findFirst({
          where: { 
            id: recordId,
            user: {
              id: req.user.id
            }
          },
        include: {
          prescription: {
            include: {
              medicines: true,
              labTests: true
            }
          },
          labReport: true
        }
      });

      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update record notes
   */
  async updateNotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.params;
      const { notes } = req.body as UpdateNotesInput;
      // Check if record exists and belongs to user
      const record = await prisma.healthRecord.findFirst({
        where: { 
          id: recordId,
          user: {
            id: req.user.id
          }
        }
      });

      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      // Update notes
      const updatedRecord = await prisma.healthRecord.update({
        where: { id: recordId },
        data: { notes }
      });

      res.status(200).json({ 
        message: "Notes updated successfully",
        record: updatedRecord
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Share record
   */
  async shareRecord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.params;
      const { share_method, recipient } = req.body as ShareRecordInput;
      // Check if record exists and belongs to user
      const record = await prisma.healthRecord.findFirst({
        where: { 
          id: recordId,
          user: {
            id: req.user.id
          }
        }
      });

      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      // Update shared status
      const updatedRecord = await prisma.healthRecord.update({
        where: { id: recordId },
        data: { shared: true }
      });

      // Implement sharing logic
      let shareMessage = `Record shared successfully`;
      if (share_method === 'EMAIL') {
        const subject = `Health Record Shared With You`;
        const textBody = `A health record (${record.recordType}) has been shared with you by ${req.user.email}. Please log in to your Swastha Health account to view it.`;
        // Consider adding an HTML body for better formatting later
        const emailSent = await sendEmail(recipient, subject, textBody);

        // Create SharedRecord entry regardless of email success
        try {
          await prisma.sharedRecord.create({
            data: {
              healthRecordId: recordId,
              sharedById: req.user.id,
              recipientEmail: recipient,
            }
          });
          if (emailSent) {
            shareMessage = `Record shared successfully via EMAIL to ${recipient}`;
          } else {
            // Log the email error but still return success as the record status and share log were updated
            console.error(`Failed to send share notification email to ${recipient} for record ${recordId}`);
            shareMessage = `Record sharing logged, but failed to send EMAIL notification to ${recipient}`;
          }
        } catch (shareError: any) {
           // Handle potential unique constraint violation (sharing same record to same email again)
           if (shareError instanceof Prisma.PrismaClientKnownRequestError && shareError.code === 'P2002') {
             console.warn(`Record ${recordId} already shared with ${recipient}.`);
             // Decide if you want to resend email or just acknowledge
             if (emailSent) {
               shareMessage = `Record was already shared with ${recipient}. Email notification resent.`;
             } else {
               shareMessage = `Record was already shared with ${recipient}. Failed to resend email notification.`;
             }
           } else {
             // Log other errors during SharedRecord creation
             console.error(`Failed to create SharedRecord entry for record ${recordId} to ${recipient}:`, shareError);
             shareMessage = `Record sharing status updated, but failed to log the sharing action. Email status: ${emailSent ? 'Sent' : 'Failed'}.`;
           }
        }
      } else if (share_method === 'WHATSAPP') {
        // TODO: Implement WhatsApp sharing logic
        shareMessage = `Record sharing via WHATSAPP to ${recipient} is not yet implemented.`;
        console.warn(`WhatsApp sharing not implemented for record ${recordId}`);
      } else {
         shareMessage = `Record sharing status updated, but unknown share method: ${share_method}`;
         console.warn(`Unknown share method ${share_method} for record ${recordId}`);
      }

      res.status(200).json({
        message: shareMessage,
        record: updatedRecord
      });
    } catch (error) {
      // Log the error properly before passing to the error handler
      // Use req.params.recordId as recordId is not in scope here
      console.error(`Error in shareRecord for record ${req.params.recordId}:`, error); 
      next(error);
    }
  }

  /**
   * Delete record
   */
  async deleteRecord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.params;
      // Check if record exists and belongs to user
      const record = await prisma.healthRecord.findFirst({
        where: { 
          id: recordId,
          user: {
            id: req.user.id
          }
        }
      });

      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      // Check if record is UHP
      if (record.status === 'UHP') {
        return res.status(400).json({ 
          message: "Cannot delete a record marked as UHP (Under healthcare provider)" 
        });
      }

      // Delete record
      await prisma.healthRecord.delete({
        where: { 
          id: recordId,
          user: {
            id: req.user.id
          }
        }
      });

      res.status(200).json({ message: "Record deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download record
   */
  async downloadRecord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.params;
      const { format = 'pdf' } = req.query; // Allow downloading original or PDF version
      
      // Get record from database
      const record = await prisma.healthRecord.findFirst({
        where: { 
          id: recordId,
          user: {
            id: req.user.id
          }
        }
      });

      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      if (!record.originalFileUrl) {
        return res.status(404).json({ 
          message: "No file found for this record"
        });
      }

      // Redirect to the S3 URL
      res.redirect(record.originalFileUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get AI insights for lab report
   */
  async getAIInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.params;
      // TODO: Implement AI insights generation
      
      res.status(200).json({ message: "Get AI insights" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get records shared with the current user
   */
  async getSharedRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user.email;

      // Find SharedRecord entries where the recipientEmail matches the user's email
      const sharedEntries = await prisma.sharedRecord.findMany({
        where: {
          recipientEmail: userEmail,
        },
        include: {
          // Include the actual HealthRecord data and the user who shared it
          healthRecord: {
            include: {
              // Include nested relations if needed, similar to getAllRecords
              prescription: {
                include: {
                  medicines: true,
                  labTests: true,
                },
              },
              labReport: true,
            },
          },
          // Include info about the user who shared it (relation on SharedRecord)
          sharedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: {
          sharedAt: 'desc', // Show most recently shared first
        },
      });

      // Extract and combine the data
      const sharedRecords = sharedEntries.map(entry => {
        if (!entry.healthRecord) {
          // Handle cases where the health record might have been deleted after sharing
          // This shouldn't happen with onDelete: Cascade, but good practice
          console.warn(`SharedRecord ${entry.id} points to a missing HealthRecord ${entry.healthRecordId}`);
          return null; 
        }
        return {
          ...entry.healthRecord, // Spread the health record details
          sharedBy: entry.sharedBy, // Add sharer info
          sharedAt: entry.sharedAt, // Add shared timestamp
        };
      }).filter(record => record !== null); // Filter out any null entries

      res.status(200).json({
        records: sharedRecords,
        total: sharedRecords.length,
      });
    } catch (error) {
      console.error(`Error in getSharedRecords for user ${req.user.email}:`, error);
      next(error);
    }
  }

  /**
   * Create MedAlert from prescription
   */
  async createMedAlert(req: AuthRequest & { body: CreateMedAlertInput }, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.params;
      const { medicineIds, timeSlot } = req.body;
      
      // Validate UUID format
      if (!recordId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ message: "Invalid record ID format" });
      }

      // Validate medicine IDs format
      if (!medicineIds.every((id: string) => 
        id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      )) {
        return res.status(400).json({ message: "Invalid medicine ID format" });
      }

      // Get the health record with prescription details
      const record = await prisma.healthRecord.findFirst({
        where: { 
          id: recordId,
          userId: req.user.id,
          recordType: 'PRESCRIPTION'
        },
        include: {
          prescription: {
            include: {
              medicines: true
            }
          }
        }
      });

      if (!record) {
        return res.status(404).json({ message: "Prescription record not found" });
      }

      if (!record.prescription) {
        return res.status(400).json({ message: "No prescription data found in record" });
      }

      // Get or create default MedAlert category for prescriptions
      let category = await prisma.medAlertCategory.findFirst({
        where: {
          userId: req.user.id,
          name: 'Prescriptions'
        }
      });

      if (!category) {
        category = await prisma.medAlertCategory.create({
          data: {
            userId: req.user.id,
            name: 'Prescriptions',
            description: 'Auto-generated from prescriptions',
            color: '#4CAF50'
          }
        });
      }

      // Create MedAlert reminders for selected medicines
      const selectedMedicines = record.prescription.medicines.filter(medicine => 
        medicineIds.includes(medicine.id)
      );

      if (selectedMedicines.length === 0) {
        return res.status(400).json({ message: "No valid medicine IDs provided" });
      }

      // Create MedAlert reminders for each selected medicine
      const reminders = await Promise.all(selectedMedicines.map(medicine => {
        return prisma.medAlertReminder.create({
          data: {
            userId: req.user.id,
            categoryId: category!.id,
            medicineName: medicine.medicineName,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            startDate: record.date,
            endDate: new Date(record.date.getTime() + medicine.duration * 24 * 60 * 60 * 1000), // duration is in days
            notes: `From prescription dated ${record.date.toLocaleDateString()}\nDoctor: ${record.doctorName}`,
            timeSlot: timeSlot && timeSlot.length > 0 ? timeSlot : (medicine.timeSlot || []),
            form: medicine.form || "tablet",
            prescriptionId: recordId,
            isSuggested: true // Mark as suggested until user activates it
          }
        });
      }));

      res.status(201).json({ 
        message: "MedAlert reminders created successfully",
        reminders 
      });
    } catch (error) {
      next(error);
    }
  }
}

export const healthVaultController = new HealthVaultController();
