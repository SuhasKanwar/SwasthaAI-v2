import { z } from "zod";

// Enums
export const RecordTypeEnum = z.enum(["PRESCRIPTION", "LAB_REPORT"]);
export const StatusEnum = z.enum(["UHP", "UPLOADED"]);
export const GenderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export const MedicineInstructionEnum = z.enum(["BEFORE_MEAL", "AFTER_MEAL", "WITH_MEAL"]);

// Prescribed Medicine Schema
const timeSlotSchema = z.object({
  hour: z.string(),
  minute: z.string(),
  period: z.enum(["AM", "PM"])
});

const prescribedMedicineSchema = z.object({
  medicine_name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  instructions: MedicineInstructionEnum,
  duration: z.number(),
  chemical_composition: z.string(),
  time_slot: z.array(timeSlotSchema).default([]),
  form: z.string().default("tablet"),
});

// Lab Test Schema
const labTestSchema = z.object({
  test_name: z.string(),
  test_description: z.string(),
  book_test_url: z.string().url().optional(),
});

// Base schema for common fields
const baseHealthRecordSchema = z.object({
  date: z.coerce.date(),
  doctor_name: z.string().min(1),
  doctor_registration_no: z.string(),
  doctor_specialization: z.string(),
  doctor_profile_picture_url: z.string().url().optional(),
  hospital_clinic_name: z.string(),
  hospital_clinic_logo_url: z.string().url().optional(),
  status: StatusEnum,
  notes: z.string().optional(),
  shared: z.boolean().default(false),
  record_type: RecordTypeEnum,
  patient_id: z.string(),
  patient_name: z.string(),
  patient_age: z.number(),
  patient_gender: GenderEnum,
});

// Prescription specific schema
// Schema for creating a prescription
export const createPrescriptionSchema = baseHealthRecordSchema.extend({
  prescription_type: StatusEnum,
  diagnosis: z.string(),
  symptoms: z.array(z.string()),
  doctor_advice: z.string().optional(),
  follow_up_date: z.coerce.date().optional(),
  medicines: z.array(prescribedMedicineSchema),
  lab_tests: z.array(labTestSchema).optional(),
  record_type: z.literal(RecordTypeEnum.enum.PRESCRIPTION),
});

// Full prescription schema (includes server-generated fields)
export const prescriptionSchema = createPrescriptionSchema.extend({
  prescription_id: z.string(),
  pdf_url: z.string().url().optional(),
});

// Lab report specific schema
export const labReportSchema = baseHealthRecordSchema.extend({
  lab_report_id: z.string(),
  pathology_name: z.string(),
  test_name: z.string(),
  record_type: z.literal(RecordTypeEnum.enum.LAB_REPORT),
  pdf_url: z.string().url().optional(),
});

// Schema for record creation
export const createHealthRecordSchema = z.discriminatedUnion("record_type", [
  createPrescriptionSchema,
  labReportSchema,
]);

// Schema for updating notes
export const updateNotesSchema = z.object({
  notes: z.string(),
});

// Schema for sharing a record
export const shareRecordSchema = z.object({
  share_method: z.enum(["EMAIL", "WHATSAPP", "MESSAGE"]),
  recipient: z.string(),
});

export type CreateHealthRecordInput = z.infer<typeof createHealthRecordSchema>;
export type UpdateNotesInput = z.infer<typeof updateNotesSchema>;
export type ShareRecordInput = z.infer<typeof shareRecordSchema>;

// Schema for selecting medicines to create alerts for
const medAlertTimeSlotSchema = z.object({
  hour: z.string(),
  minute: z.string(),
  period: z.enum(["AM", "PM"])
});

export const createMedAlertSchema = z.object({
  medicineIds: z.array(z.string()).min(1, "Select at least one medicine"),
  timeSlot: z.array(medAlertTimeSlotSchema).default([])
});

export type CreateMedAlertInput = z.infer<typeof createMedAlertSchema>;

// Pre-process form values to handle potential quotes
const stripQuotes = (value: string) => value.replace(/^["'](.+)["']$/, '$1');

interface UploadPdfForm {
  record_type: string;
  date: string;
  doctor_name: string;
  status: string;
  notes?: string;
}

// Simple schema for PDF uploads
export const uploadPdfSchema = z.preprocess(
  (data) => {
    if (typeof data !== 'object' || data === null) return data;
    
    // Cast to our known form data shape
    const formData = data as UploadPdfForm;
    const processed: UploadPdfForm = {
      record_type: stripQuotes(formData.record_type),
      date: stripQuotes(formData.date),
      doctor_name: stripQuotes(formData.doctor_name),
      status: stripQuotes(formData.status),
    };
    
    if (formData.notes) {
      processed.notes = stripQuotes(formData.notes);
    }
    
    return processed;
  },
  z.object({
    record_type: z.enum(["PRESCRIPTION", "LAB_REPORT"]),
    date: z.coerce.date(),
    doctor_name: z.string().min(1),
    status: z.literal("UPLOADED"),
    notes: z.string().optional()
  }).strict()
);

export type UploadPdfInput = z.infer<typeof uploadPdfSchema>;
