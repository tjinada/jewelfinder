import { Request, Response, NextFunction } from 'express';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const statusColor = (code: number) =>
  code >= 500 ? colors.red : code >= 400 ? colors.yellow : code >= 300 ? colors.cyan : colors.green;

const methodColor = (method: string) =>
  ({ GET: colors.green, POST: colors.cyan, PUT: colors.yellow, PATCH: colors.yellow, DELETE: colors.red } as Record<string, string>)[method] || colors.reset;

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = [
      `${methodColor(req.method)}${req.method.padEnd(6)}${colors.reset}`,
      req.originalUrl,
      `${statusColor(res.statusCode)}${res.statusCode}${colors.reset}`,
      `${colors.dim}${duration}ms${colors.reset}`,
    ].join(' ');
    if (res.statusCode >= 400) console.error(log);
    else console.log(log);
  });
  next();
};
