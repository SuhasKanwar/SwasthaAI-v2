import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ValidationErrorType {
  field: string;
  message: string;
}

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: ValidationErrorType[];

  constructor(errors: ValidationErrorType[]) {
    super(400, 'Validation Error');
    this.errors = errors;
  }
}

export const handleZodError = (error: ZodError): ValidationError => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
  return new ValidationError(errors);
};

export const handleDatabaseError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  if (error.code === 'P2002') {
    return new AppError(400, 'A record with this value already exists.');
  }
  return new AppError(500, 'Database operation failed.');
};