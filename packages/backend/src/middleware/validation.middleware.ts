import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

const handle = (schema: ZodSchema, pick: (req: Request) => unknown, assign?: (req: Request, parsed: unknown) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(pick(req));
      assign?.(req, parsed);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      next(error);
    }
  };
};

export const validate = (schema: ZodSchema) =>
  handle(schema, (req) => ({ body: req.body, query: req.query, params: req.params }));

export const validateBody = (schema: ZodSchema) =>
  handle(schema, (req) => req.body, (req, parsed) => { req.body = parsed; });

export const validateQuery = (schema: ZodSchema) =>
  handle(schema, (req) => req.query, (req, parsed) => { req.query = parsed as Request['query']; });

export const validateParams = (schema: ZodSchema) =>
  handle(schema, (req) => req.params, (req, parsed) => { req.params = parsed as Request['params']; });
