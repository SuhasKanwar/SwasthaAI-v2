import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request & { body: any }, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationError.details
        });
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request & { query: any }, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          status: 'error',
          message: 'Query validation failed',
          errors: validationError.details
        });
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return async (req: Request & { params: any }, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          status: 'error',
          message: 'Parameters validation failed',
          errors: validationError.details 
        });
      } else {
        next(error);
      }
    }
  };
};