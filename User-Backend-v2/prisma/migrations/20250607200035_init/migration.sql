-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "country_code" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ethnicity" TEXT,
    "security_pin" TEXT NOT NULL,
    "google_auth" BOOLEAN NOT NULL DEFAULT false,
    "default_home_screen" TEXT NOT NULL DEFAULT 'Mental Health',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "otp" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_acceptance" (
    "user_id" UUID NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_acceptance_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "session_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_at" TIMESTAMP(3),

    CONSTRAINT "session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_photos" (
    "user_id" UUID NOT NULL,
    "photo_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_photos_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "medical_profiles" (
    "user_id" UUID NOT NULL,
    "blood_type" TEXT NOT NULL,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "chronic_conditions" TEXT[],
    "mental_health_symptoms" TEXT[],
    "medications" TEXT[],
    "allergies" TEXT[],
    "surgeries" TEXT[],
    "family_medical_history" TEXT[],
    "current_doctors" JSONB NOT NULL,
    "vaccination_records" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_hospitals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_care" (
    "user_id" UUID NOT NULL,
    "location_permission" BOOLEAN NOT NULL DEFAULT false,
    "sos_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_location" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_care_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "emergency_profiles" (
    "user_id" UUID NOT NULL,
    "emergency_contacts" JSONB NOT NULL,
    "hospitals" JSONB NOT NULL,
    "sos_enabled" BOOLEAN NOT NULL DEFAULT false,
    "location_permission" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "saved_addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "address_type" TEXT NOT NULL,
    "custom_address_name" TEXT,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "family_members" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "feedback_type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "attachment_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reference_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "securityPin" VARCHAR(6),
    "loginOtp" VARCHAR(6),
    "loginOtpExpiry" TIMESTAMP(3),
    "otp" VARCHAR(6),
    "otpExpiry" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "lastLoginAttempt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isProfileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "userId" UUID NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "profilePicture" VARCHAR(1000),
    "specialty" VARCHAR(255) NOT NULL,
    "expertiseAreas" JSONB NOT NULL,
    "bio" TEXT,
    "patientsServed" INTEGER NOT NULL DEFAULT 0,
    "yearsOfExperience" INTEGER NOT NULL,
    "degree" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "certifications" JSONB,
    "medicalRegistrationNumber" VARCHAR(100) NOT NULL,
    "languagesSpoken" JSONB NOT NULL,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "consultationFees" INTEGER NOT NULL,
    "payOnConsultation" BOOLEAN NOT NULL DEFAULT false,
    "providesOnlineConsultation" BOOLEAN NOT NULL DEFAULT false,
    "genderPreference" VARCHAR(20) DEFAULT 'both',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "doctor_clinics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "googleMapsLink" TEXT,
    "availabilityDates" JSONB NOT NULL,
    "availabilitySlots" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewText" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "doctorId" UUID NOT NULL,
    "doctorName" VARCHAR(255) NOT NULL,
    "doctorPhotoUrl" VARCHAR(1000) NOT NULL,
    "specialization" VARCHAR(255) NOT NULL,
    "clinicId" UUID NOT NULL,
    "clinicName" VARCHAR(255) NOT NULL,
    "clinicAddress" VARCHAR(1000) NOT NULL,
    "googleMapsLink" VARCHAR(1000),
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentSlot" VARCHAR(50) NOT NULL,
    "symptomsEntered" TEXT,
    "uploadedDocuments" JSONB NOT NULL,
    "patientId" UUID NOT NULL,
    "patientName" VARCHAR(255) NOT NULL,
    "patientContact" VARCHAR(20) NOT NULL,
    "addressType" VARCHAR(50) NOT NULL,
    "paymentStatus" VARCHAR(20) NOT NULL,
    "paymentMethod" VARCHAR(50),
    "payOnConsultation" BOOLEAN NOT NULL DEFAULT false,
    "appointmentStatus" VARCHAR(20) NOT NULL,
    "confirmationMessage" TEXT,
    "rescheduleAvailable" BOOLEAN NOT NULL DEFAULT true,
    "cancelAvailable" BOOLEAN NOT NULL DEFAULT true,
    "prescriptionUrl" VARCHAR(1000),
    "previousTotalAppointments" INTEGER NOT NULL DEFAULT 0,
    "rescheduled_from" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "med_alert_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "autoReminder" BOOLEAN NOT NULL DEFAULT false,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyPush" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "med_alert_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "med_alert_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "med_alert_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "med_alert_reminders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "isSuggested" BOOLEAN NOT NULL DEFAULT false,
    "prescription_id" TEXT,
    "timeSlot" JSONB NOT NULL DEFAULT '[]',
    "form" TEXT NOT NULL DEFAULT 'tablet',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "med_alert_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "attachment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sender_type" TEXT NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctor_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3),

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "doctor_name" TEXT NOT NULL,
    "doctor_registration_no" TEXT NOT NULL,
    "doctor_specialization" TEXT NOT NULL,
    "doctor_profile_picture_url" TEXT,
    "hospital_clinic_name" TEXT NOT NULL,
    "hospital_clinic_address" TEXT NOT NULL,
    "hospital_clinic_logo_url" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "record_type" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "patient_age" INTEGER NOT NULL,
    "patient_gender" TEXT NOT NULL,
    "original_file_url" TEXT,
    "original_file_type" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "pdf_url" TEXT,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "health_record_id" UUID NOT NULL,
    "prescription_type" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "symptoms" TEXT[],
    "doctor_advice" TEXT,
    "follow_up_date" TIMESTAMP(3),

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescribed_medicines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prescription_id" UUID NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "chemical_composition" TEXT NOT NULL,
    "timeSlot" JSONB NOT NULL DEFAULT '[]',
    "form" TEXT NOT NULL DEFAULT 'tablet',

    CONSTRAINT "prescribed_medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prescription_id" UUID NOT NULL,
    "test_name" TEXT NOT NULL,
    "test_description" TEXT NOT NULL,
    "book_test_url" TEXT,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "health_record_id" UUID NOT NULL,
    "pathology_name" TEXT NOT NULL,
    "test_name" TEXT NOT NULL,

    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "health_record_id" UUID NOT NULL,
    "shared_by_id" UUID NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_reference_id_key" ON "feedback"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_email_key" ON "doctor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "med_alert_settings_user_id_key" ON "med_alert_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "med_alert_categories_user_id_name_key" ON "med_alert_categories"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_doctor_patient_idx" ON "chat_rooms"("doctor_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_health_record_id_key" ON "prescriptions"("health_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_reports_health_record_id_key" ON "lab_reports"("health_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_records_health_record_id_recipient_email_key" ON "shared_records"("health_record_id", "recipient_email");

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_acceptance" ADD CONSTRAINT "terms_acceptance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_profiles" ADD CONSTRAINT "medical_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_hospitals" ADD CONSTRAINT "emergency_hospitals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_care" ADD CONSTRAINT "sos_care_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_profiles" ADD CONSTRAINT "emergency_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_clinics" ADD CONSTRAINT "doctor_clinics_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_faqs" ADD CONSTRAINT "doctor_faqs_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "med_alert_settings" ADD CONSTRAINT "med_alert_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "med_alert_categories" ADD CONSTRAINT "med_alert_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "med_alert_reminders" ADD CONSTRAINT "med_alert_reminders_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "med_alert_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "med_alert_reminders" ADD CONSTRAINT "med_alert_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescribed_medicines" ADD CONSTRAINT "prescribed_medicines_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_records" ADD CONSTRAINT "shared_records_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_records" ADD CONSTRAINT "shared_records_shared_by_id_fkey" FOREIGN KEY ("shared_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
