import express, { RequestHandler, Router } from 'express';
import multer from 'multer';
import { verifyToken } from '../../../middleware/auth';
import { getFeedbacks, getFeedbackById, createFeedback } from '../../../controllers/userController/feedbackController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.get('/', getFeedbacks);
router.get('/:id', getFeedbackById);
router.post('/', upload.single('file'), createFeedback);

export default router;