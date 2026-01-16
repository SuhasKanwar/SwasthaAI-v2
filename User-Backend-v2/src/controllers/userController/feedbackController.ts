import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/errors';
import { uploadToCloud } from '../../utils/fileUtils';
import { AuthRequest } from '../../types/auth.types';
import { 
  FeedbackListQuery as FeedbackQuery, 
  FeedbackListResponse, 
  CreateFeedbackData as FeedbackData,
  FeedbackStatus,
  FeedbackType
} from '../../schemas/feedbackSchemas';
import nanoid from 'nanoid';
import { Feedback } from '@prisma/client';

/**
 * Get list of user feedbacks
 */
export const getFeedbacks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = 1, limit = 10 } = req.query as unknown as FeedbackQuery;

    const userId = req.user.id;
    const where: { userId: string; status?: any } = { userId };
    if (status) {
      where.status = status as FeedbackStatus;
    }

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: ((Number(page) || 1) - 1) * (Number(limit) || 10),
      take: Number(limit) || 10
    });

    const total = await prisma.feedback.count({ where });
    const actualLimit = Number(limit) || 10;

    const response: { status: string; data: FeedbackListResponse } = {
      status: 'success',
      data: {
        feedback: feedback.map((f: Feedback) => ({
          ...f,
          status: f.status as FeedbackStatus,
          feedbackType: f.feedbackType as FeedbackType,
          attachmentUrl: f.attachmentUrl || undefined
        })),
        pagination: {
          page: Number(page) || 1,
          limit: actualLimit,
          total,
          pages: Math.ceil(total / actualLimit)
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback by ID
 */
export const getFeedbackById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const feedbackId = req.params.id;

    const feedback = await prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        userId
      }
    });

    if (!feedback) {
      throw new AppError(404, 'Feedback not found');
    }

    res.json({
      status: 'success',
      data: {
        ...feedback,
        status: feedback.status as FeedbackStatus,
        feedbackType: feedback.feedbackType as FeedbackType,
        attachmentUrl: feedback.attachmentUrl || undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new feedback with optional file attachment
 */
export const createFeedback = async (
  req: AuthRequest & { file?: Express.Multer.File },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const {
      subject,
      message,
      category
    } = req.body as FeedbackData;

    // Handle file upload if present
    let attachmentUrl: string | undefined = undefined;
    if (req.file) {
      try {
        attachmentUrl = await uploadToCloud(req.file);
      } catch (error) {
        throw new AppError(500, 'Failed to upload attachment');
      }
    }

    // Generate unique reference ID
    const referenceId = nanoid(10).toUpperCase();

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        feedbackType: category as FeedbackType,
        subject,
        description: message,
        contactEmail: req.user.email,
        attachmentUrl,
        referenceId,
        status: 'Pending' as FeedbackStatus
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Feedback submitted successfully',
      data: {
        referenceId: feedback.referenceId,
        feedback: {
          ...feedback,
          status: feedback.status as FeedbackStatus,
          feedbackType: feedback.feedbackType as FeedbackType,
          attachmentUrl: feedback.attachmentUrl || undefined
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const feedbackController = {
  getFeedbacks,
  getFeedbackById,
  createFeedback
};
