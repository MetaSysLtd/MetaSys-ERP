// Basic logger implementation
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

type LogLevel = keyof typeof logLevels;

// Default to info in production, debug in development
const defaultLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || defaultLevel;

function formatMessage(level: LogLevel, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  return logLevels[level] <= logLevels[currentLevel];
}

export const logger = {
  error(message: string, ...args: any[]): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), ...args);
    }
  },
  
  warn(message: string, ...args: any[]): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },
  
  info(message: string, ...args: any[]): void {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message), ...args);
    }
  },
  
  debug(message: string, ...args: any[]): void {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message), ...args);
    }
  },
};