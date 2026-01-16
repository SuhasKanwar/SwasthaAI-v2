import { AuthRequest } from './auth.types';

declare global {
  namespace Express {
    interface Request extends AuthRequest {}
  }
}