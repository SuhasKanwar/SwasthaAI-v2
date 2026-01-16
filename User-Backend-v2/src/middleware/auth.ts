import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { AppError } from '../utils/errors';
import { AuthRequest, User } from '../types/auth.types';

config();

export interface TokenPayload {
  id: string;
  email: string;
  type?: string;
}

// Environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const createTokens = (userId: string, email: string): { accessToken: string } => {
  const accessToken = jwt.sign(
    { id: userId, email, type: "user" },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  return { accessToken };
};

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Invalid token');
    }
    throw error;
  }
};

export const decodeExpiredToken = (token: string): TokenPayload => {
  try {
    // First verify the token signature ignoring expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as TokenPayload;
    
    // Ensure the token is actually expired
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      throw new AppError(400, 'Token is still valid');
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return decoded;
      }
      throw new AppError(401, 'Invalid token');
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Invalid token');
  }
};

/**
 * Middleware to authenticate and authorize requests using JWT
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError(401, 'Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'Invalid token format');
    }

    jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        next(new AppError(403, 'Invalid or expired token'));
        return;
      }
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Additional middleware for role-based access if needed
export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
