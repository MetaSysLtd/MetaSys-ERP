import { logger } from '../logger';

/**
 * Default environment values
 */
const defaults = {
  NODE_ENV: 'development',
  PORT: '5000',
  HOST: '0.0.0.0',
  API_PREFIX: '/api',
  
  // Database
  DATABASE_URL: '',
  
  // Authentication
  JWT_SECRET: 'default_jwt_secret_do_not_use_in_production',
  JWT_EXPIRES_IN: '1d',
  JWT_REFRESH_EXPIRES_IN: '7d',
  
  // Session
  SESSION_SECRET: 'default_session_secret_do_not_use_in_production',
  SESSION_EXPIRES_IN: '86400000', // 24 hours in milliseconds
  
  // CORS
  CORS_ORIGIN: '*',
  
  // Email
  SMTP_HOST: '',
  SMTP_PORT: '587',
  SMTP_USER: '',
  SMTP_PASSWORD: '',
  SMTP_FROM_EMAIL: 'noreply@metasys.com',
  SMTP_FROM_NAME: 'MetaSys ERP',
  
  // Slack
  SLACK_BOT_TOKEN: '',
  SLACK_CHANNEL_ID: '',
  SLACK_ADMIN_CHANNEL_ID: '',
  SLACK_SALES_CHANNEL_ID: '',
  SLACK_DISPATCH_CHANNEL_ID: '',
  
  // File uploads
  MAX_FILE_SIZE_MB: '5',
  UPLOAD_DIR: './uploads',
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Security
  BCRYPT_SALT_ROUNDS: '10',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: '100'
};

/**
 * Required environment variables
 */
const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET'
];

/**
 * Secret environment variables (masked in logs)
 */
const secrets = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'SMTP_PASSWORD',
  'SLACK_BOT_TOKEN'
];

/**
 * Get environment variable with default fallback
 * @param key - Environment variable name
 * @returns Environment variable value
 */
function getEnv(key: string): string {
  const value = process.env[key] || defaults[key as keyof typeof defaults] || '';
  
  // Check if required but missing
  if (required.includes(key) && !value) {
    logger.warn(`Required environment variable ${key} is not set!`);
  }
  
  return value;
}

/**
 * Log all environment variables
 */
function logEnv(): void {
  const envVars: Record<string, string> = {};
  
  // Get all environment variables with defaults
  for (const key in defaults) {
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      const typedKey = key as keyof typeof defaults;
      const value = getEnv(typedKey);
      
      // Mask secrets
      envVars[typedKey] = secrets.includes(typedKey) 
        ? value ? '********' : 'not set' 
        : value;
    }
  }
  
  // Log environment (except in production)
  if (envVars.NODE_ENV !== 'production') {
    logger.debug('Environment:', envVars);
  }
}

/**
 * Validate required environment variables
 * @returns Array of missing required variables
 */
function validateEnv(): string[] {
  const missing: string[] = [];
  
  for (const key of required) {
    const value = getEnv(key);
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return missing;
}

/**
 * Environment configuration
 */
export const env = {
  // Server
  NODE_ENV: getEnv('NODE_ENV'),
  PORT: parseInt(getEnv('PORT'), 10),
  HOST: getEnv('HOST'),
  API_PREFIX: getEnv('API_PREFIX'),
  IS_PRODUCTION: getEnv('NODE_ENV') === 'production',
  IS_DEVELOPMENT: getEnv('NODE_ENV') === 'development',
  IS_TEST: getEnv('NODE_ENV') === 'test',
  
  // Database
  DATABASE_URL: getEnv('DATABASE_URL'),
  
  // Authentication
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN'),
  
  // Session
  SESSION_SECRET: getEnv('SESSION_SECRET'),
  SESSION_EXPIRES_IN: parseInt(getEnv('SESSION_EXPIRES_IN'), 10),
  
  // CORS
  CORS_ORIGIN: getEnv('CORS_ORIGIN'),
  
  // Email
  SMTP_HOST: getEnv('SMTP_HOST'),
  SMTP_PORT: parseInt(getEnv('SMTP_PORT'), 10),
  SMTP_USER: getEnv('SMTP_USER'),
  SMTP_PASSWORD: getEnv('SMTP_PASSWORD'),
  SMTP_FROM_EMAIL: getEnv('SMTP_FROM_EMAIL'),
  SMTP_FROM_NAME: getEnv('SMTP_FROM_NAME'),
  
  // Slack
  SLACK_BOT_TOKEN: getEnv('SLACK_BOT_TOKEN'),
  SLACK_CHANNEL_ID: getEnv('SLACK_CHANNEL_ID'),
  SLACK_ADMIN_CHANNEL_ID: getEnv('SLACK_ADMIN_CHANNEL_ID'),
  SLACK_SALES_CHANNEL_ID: getEnv('SLACK_SALES_CHANNEL_ID'),
  SLACK_DISPATCH_CHANNEL_ID: getEnv('SLACK_DISPATCH_CHANNEL_ID'),
  
  // File uploads
  MAX_FILE_SIZE_MB: parseInt(getEnv('MAX_FILE_SIZE_MB'), 10),
  UPLOAD_DIR: getEnv('UPLOAD_DIR'),
  
  // Logging
  LOG_LEVEL: getEnv('LOG_LEVEL'),
  
  // Security
  BCRYPT_SALT_ROUNDS: parseInt(getEnv('BCRYPT_SALT_ROUNDS'), 10),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(getEnv('RATE_LIMIT_WINDOW_MS'), 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS'), 10),
  
  // Helper functions
  getEnv,
  logEnv,
  validateEnv
};

// Log environment on import (except in test environment)
if (env.NODE_ENV !== 'test') {
  env.logEnv();
}

export default env;