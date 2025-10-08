/**
 * Logging utility using nexlog
 * Provides Edge Runtime compatible, structured logging with automatic data sanitization
 */

import { Logger } from 'nexlog';

// Detect runtime environment
const IS_EDGE = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Create logger instance
const createLogger = (): Logger => {
  const level = process.env.NEXLOG_LEVEL ?? (IS_DEVELOPMENT ? 'debug' : 'info');
  // Type assertion is safe here as we control the config values
  const validatedLevel = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(level)
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Safe type narrowing with includes check
      (level as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal')
    : 'info';

  const config = {
    level: validatedLevel,
    structured: process.env.NEXLOG_STRUCTURED === 'true' || !IS_DEVELOPMENT,
    sanitize: true, // Always sanitize sensitive data (GDPR compliant)
    context: {
      service: 'zoms-portfolio',
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version ?? '0.1.0',
      runtime: IS_EDGE ? 'edge' : 'node'
    }
  };

  return new Logger(config);
};

const logger = createLogger();

/**
 * Wrapper for logging with consistent metadata
 */
export const log = {
  /**
   * Trace level - Detailed debugging information
   */
  trace: (message: string, metadata?: Record<string, unknown>): void => {
    logger.trace(message, metadata);
  },

  /**
   * Debug level - Debug information for development
   */
  debug: (message: string, metadata?: Record<string, unknown>): void => {
    logger.debug(message, metadata);
  },

  /**
   * Info level - General informational messages
   */
  info: (message: string, metadata?: Record<string, unknown>): void => {
    logger.info(message, metadata);
  },

  /**
   * Warn level - Warning messages for potential issues
   */
  warn: (message: string, metadata?: Record<string, unknown>): void => {
    logger.warn(message, metadata);
  },

  /**
   * Error level - Error messages for failures
   */
  error: (message: string, metadata?: Record<string, unknown>): void => {
    logger.error(message, metadata);
  },

  /**
   * Fatal level - Critical failures requiring immediate attention
   */
  fatal: (message: string, metadata?: Record<string, unknown>): void => {
    logger.fatal(message, metadata);
  },

  /**
   * Log API request with metadata
   */
  request: (method: string, path: string, metadata?: Record<string, unknown>): void => {
    logger.info('API Request', {
      method,
      path,
      ...metadata
    });
  },

  /**
   * Log API response with metadata
   */
  response: (
    method: string,
    path: string,
    status: number,
    metadata?: Record<string, unknown>
  ): void => {
    logger.info('API Response', {
      method,
      path,
      status,
      ...metadata
    });
  },

  /**
   * Log performance metrics
   */
  performance: (label: string, duration: number, metadata?: Record<string, unknown>): void => {
    logger.info('Performance', {
      label,
      duration: `${duration}ms`,
      ...metadata
    });
  },

  /**
   * Time an async operation and log duration
   */
  timeAsync: async <T>(
    label: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      log.performance(label, duration, metadata);
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - start;
      log.error(`${label} failed`, {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        ...metadata
      });
      throw error;
    }
  }
};

export default log;
