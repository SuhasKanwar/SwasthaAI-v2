import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors
    });
  }

  // Handle custom validation errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(400).json({
        status: 'fail',
        message: 'A record with this value already exists'
      });
    }
  }

  // Handle JWT errors
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token'
    });
  }

  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token has expired'
    });
  }

  // Default error
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Something went wrong'
  });
};

type AsyncRequestHandler<T = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Middleware to handle async errors
export const catchAsync = <T = Request>(fn: AsyncRequestHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};