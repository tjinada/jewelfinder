type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[35m',
  dim: '\x1b[2m',
};

const useColors = process.env.NODE_ENV !== 'production' && process.stdout.isTTY;

const format = (level: LogLevel, message: string, context?: string): string => {
  const ts = new Date().toISOString();
  const ctx = context ? ` [${context}]` : '';
  if (useColors) {
    return `${colors.dim}${ts}${colors.reset} ${colors[level]}[${level.toUpperCase()}]${colors.reset}${ctx} ${message}`;
  }
  return `${ts} [${level.toUpperCase()}]${ctx} ${message}`;
};

export const logger = {
  info: (message: string, context?: string) => console.log(format('info', message, context)),
  warn: (message: string, context?: string) => console.warn(format('warn', message, context)),
  error: (message: string, context?: string, error?: Error) => {
    console.error(format('error', message, context));
    if (error?.stack) console.error(error.stack);
  },
  debug: (message: string, context?: string) => {
    if (process.env.NODE_ENV !== 'production') console.log(format('debug', message, context));
  },
};
