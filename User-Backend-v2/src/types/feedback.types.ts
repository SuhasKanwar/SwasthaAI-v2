import { 
  FeedbackType,
  FeedbackStatus,
  FeedbackResponse 
} from '../schemas/feedbackSchemas';

export interface FeedbackListQuery {
  status?: FeedbackStatus;
  page?: number;
  limit?: number;
}

export interface FeedbackListResponse {
  feedback: FeedbackResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateFeedbackData {
  feedbackType: FeedbackType;
  subject: string;
  description: string;
  contactEmail: string;
  attachmentUrl?: string | null;
}