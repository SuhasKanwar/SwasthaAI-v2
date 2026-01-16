import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

type MedicineInput = {
  medicineName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  duration: number;
  chemicalComposition: string;
  form?: string;
};

type PrescriptionInput = {
  diagnosis: string;
  symptoms: string[];
  doctorAdvice?: string;
  followUpDate?: Date;
  medicines: MedicineInput[];
};

type PrescriptionPdfPayload = {
  recordId: string;
  appointmentDate: Date;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorName: string;
  doctorRegistrationNo: string;
  doctorSpecialization: string;
  clinicName: string;
  clinicAddress: string;
  prescription: PrescriptionInput;
};

type PrescriptionPdfResult = {
  filePath: string;
  filename: string;
  publicUrl: string;
  size: number;
};

const ensureVaultDir = () => {
  const vaultDir = path.join(process.cwd(), 'vault');
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }
  return vaultDir;
};

export const generatePrescriptionPdf = async (
  payload: PrescriptionPdfPayload
): Promise<PrescriptionPdfResult> => {
  const vaultDir = ensureVaultDir();
  const filename = `prescription-${payload.recordId}.pdf`;
  const filePath = path.join(vaultDir, filename);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).text('Prescription', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Date: ${payload.appointmentDate.toDateString()}`);
  doc.text(`Doctor: ${payload.doctorName}`);
  doc.text(`Registration No: ${payload.doctorRegistrationNo}`);
  doc.text(`Specialization: ${payload.doctorSpecialization}`);
  doc.moveDown();

  doc.text(`Patient: ${payload.patientName}`);
  doc.text(`Age/Gender: ${payload.patientAge} / ${payload.patientGender}`);
  doc.text(`Clinic: ${payload.clinicName}`);
  doc.text(`Address: ${payload.clinicAddress}`);
  doc.moveDown();

  doc.fontSize(13).text('Diagnosis', { underline: true });
  doc.fontSize(12).text(payload.prescription.diagnosis);
  doc.moveDown();

  doc.fontSize(13).text('Symptoms', { underline: true });
  doc.fontSize(12).text(payload.prescription.symptoms.join(', '));
  doc.moveDown();

  if (payload.prescription.doctorAdvice) {
    doc.fontSize(13).text('Doctor Advice', { underline: true });
    doc.fontSize(12).text(payload.prescription.doctorAdvice);
    doc.moveDown();
  }

  if (payload.prescription.followUpDate) {
    doc.fontSize(13).text('Follow Up Date', { underline: true });
    doc.fontSize(12).text(payload.prescription.followUpDate.toDateString());
    doc.moveDown();
  }

  doc.fontSize(13).text('Medicines', { underline: true });
  payload.prescription.medicines.forEach((medicine, index) => {
    doc
      .fontSize(12)
      .text(
        `${index + 1}. ${medicine.medicineName} | ${medicine.dosage} | ${medicine.frequency} | ${medicine.instructions} | ${medicine.duration} days | ${medicine.chemicalComposition}${medicine.form ? ` | ${medicine.form}` : ''}`
      );
  });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', reject);
    doc.on('error', reject);
  });

  const stats = fs.statSync(filePath);
  return {
    filePath,
    filename,
    publicUrl: `/vault/${filename}`,
    size: stats.size,
  };
};
