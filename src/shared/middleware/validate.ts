import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response.utils';

interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validate = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log("body", req.body);
      console.log("query", req.query);
      console.log("params", req.params);
      if (schema.body) schema.body.parse(req.body);
      if (schema.query) schema.query.parse(req.query);
      if (schema.params) schema.params.parse(req.params);
      console.log(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log("Validation error", error.errors);
        sendError(
          res,
          'VALIDATION_ERROR',
          'Validation failed',
          400,
          error.errors
        );
        return;
      }
      next(error);
    }
  };
};