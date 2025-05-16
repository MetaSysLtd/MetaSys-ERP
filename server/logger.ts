/**
 * Simple logger utility for consistent logging across the application
 */

// Log levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Environment-based log level
const currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LogLevel.WARN 
  : LogLevel.DEBUG;

// Basic logger implementation
export const logger = {
  error: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`[${new Date().toISOString()}] ERROR:`, message, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`[${new Date().toISOString()}] WARN:`, message, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.log(`[${new Date().toISOString()}] INFO:`, message, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.log(`[${new Date().toISOString()}] DEBUG:`, message, ...args);
    }
  }
};