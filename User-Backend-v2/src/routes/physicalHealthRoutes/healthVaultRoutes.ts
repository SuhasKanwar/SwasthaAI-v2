import { Router, RequestHandler } from "express"; // Import RequestHandler here
import multer from "multer";
import { validateBody } from "../../middleware/validation";
import { authenticateToken } from "../../middleware/auth";
import { requestHandler } from "../../middleware/requestHandler";
import {
  createHealthRecordSchema,
  updateNotesSchema,
  shareRecordSchema,
  uploadPdfSchema,
  createMedAlertSchema,
} from "../../schemas/healthVaultSchemas";
import { healthVaultController } from "../../controllers/healthVaultController";

const healthVaultRouter = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Get all health records with filtering
healthVaultRouter.get(
  "/",
  authenticateToken,
  requestHandler(healthVaultController.getAllRecords.bind(healthVaultController)) as RequestHandler
);

// Custom middleware to validate based on request type
const validateHealthRecord = (req: any, res: any, next: any) => {
  try {
    if (req.file) {
      // If file is present, validate using uploadPdfSchema
      uploadPdfSchema.parse(req.body);
    } else {
      // If no file, validate using createHealthRecordSchema for UHP
      createHealthRecordSchema.parse(req.body);
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Create new health record (supports both PDF upload and UHP creation)
healthVaultRouter.post(
  "/",
  authenticateToken,
  upload.single('file'),
  validateHealthRecord,
  requestHandler(healthVaultController.createRecord.bind(healthVaultController)) as RequestHandler
);

// Get records shared with the current user
// IMPORTANT: Define specific routes like this BEFORE parameterized routes like /:recordId
healthVaultRouter.get(
  "/shared-with-me",
  authenticateToken,
  requestHandler(healthVaultController.getSharedRecords.bind(healthVaultController)) as RequestHandler
);

// Get record by ID
healthVaultRouter.get(
  "/:recordId",
  authenticateToken,
  requestHandler(healthVaultController.getRecordById.bind(healthVaultController)) as RequestHandler
);

// Update record notes
healthVaultRouter.patch(
  "/:recordId/notes",
  authenticateToken,
  validateBody(updateNotesSchema),
  requestHandler(healthVaultController.updateNotes.bind(healthVaultController)) as RequestHandler
);

// Share record
healthVaultRouter.post(
  "/:recordId/share",
  authenticateToken,
  validateBody(shareRecordSchema),
  requestHandler(healthVaultController.shareRecord.bind(healthVaultController)) as RequestHandler
);

// Delete record
healthVaultRouter.delete(
  "/:recordId",
  authenticateToken,
  requestHandler(healthVaultController.deleteRecord.bind(healthVaultController)) as RequestHandler
);

// Download record
healthVaultRouter.get(
  "/:recordId/download",
  authenticateToken,
  requestHandler(healthVaultController.downloadRecord.bind(healthVaultController)) as RequestHandler
);

// Get AI insights for lab report
healthVaultRouter.get(
  "/:recordId/ai-insights",
  authenticateToken,
  requestHandler(healthVaultController.getAIInsights.bind(healthVaultController)) as RequestHandler
);

// Create MedAlert from prescription
healthVaultRouter.post(
  "/:recordId/med-alert",
  authenticateToken,
  validateBody(createMedAlertSchema),
  requestHandler(healthVaultController.createMedAlert.bind(healthVaultController)) as RequestHandler
);

export default healthVaultRouter;
