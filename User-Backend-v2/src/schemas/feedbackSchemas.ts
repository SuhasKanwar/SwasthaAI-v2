import { z } from 'zod';

// Enum values as string literals
export const FeedbackStatusValues = ['Pending', 'Reviewed', 'Resolved'] as const;
export const FeedbackTypeValues = ['Bug', 'Feature', 'Question', 'Other'] as const;

export const FeedbackStatusEnum = z.enum(FeedbackStatusValues);
export const FeedbackTypeEnum = z.enum(FeedbackTypeValues);

export type FeedbackStatus = z.infer<typeof FeedbackStatusEnum>;
export type FeedbackType = z.infer<typeof FeedbackTypeEnum>;

// Base feedback schema
export const feedbackSchema = z.object({
  feedbackType: FeedbackTypeEnum,
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .trim(),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must not exceed 2000 characters')
    .trim(),
  category: FeedbackTypeEnum.optional(),
  contactEmail: z.string()
    .email('Please provide a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
  attachmentUrl: z.string().url().optional()
});

export const feedbackListQuerySchema = z.object({
  status: FeedbackStatusEnum.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10)
});

export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;

export type CreateFeedbackData = z.infer<typeof feedbackSchema>;

export interface FeedbackResponse {
  id: string;
  userId: string;
  referenceId: string;
  subject: string;
  description: string;
  feedbackType: FeedbackType;
  status: FeedbackStatus;
  contactEmail: string;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface FeedbackListResponse {
  feedback: FeedbackResponse[];
  pagination: PaginationInfo;
}