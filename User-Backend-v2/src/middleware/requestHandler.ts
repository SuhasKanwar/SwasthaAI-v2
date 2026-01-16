import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { AuthRequest } from '../types/auth.types';

/**
 * Wraps a controller method that expects an AuthRequest and converts it into an Express RequestHandler
 */
export const requestHandler = <
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
>(
  handler: (req: AuthRequest, res: Response<ResBody>, next: NextFunction) => Promise<void | Response<ResBody>> | void | Response<ResBody>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return async (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    try {
      // Cast the request to AuthRequest since authenticateToken middleware already adds the user
      const authReq = req as unknown as AuthRequest;
      await handler(authReq, res, next);
    } catch (error) {
      next(error);
    }
  };
};
