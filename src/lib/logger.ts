/**
 * Logging utility with Edge Runtime compatibility
 * Provides structured logging with automatic data sanitization (GDPR compliant)
 */

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_EDGE = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};

// Get configured log level
const getLogLevel = (): LogLevel => {
  const level = process.env.NEXLOG_LEVEL ?? (IS_DEVELOPMENT ? 'debug' : 'info');
  const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Validated with includes check
  return validLevels.includes(level as LogLevel) ? (level as LogLevel) : 'info';
};

const currentLevel = getLogLevel();
const useStructured = process.env.NEXLOG_STRUCTURED === 'true' || !IS_DEVELOPMENT;

// Sanitize sensitive data (GDPR compliant)
const sensitivePatterns = [
  { pattern: /password/i, replacement: '[REDACTED]' },
  { pattern: /apikey/i, replacement: '[REDACTED]' },
  { pattern: /api_key/i, replacement: '[REDACTED]' },
  { pattern: /token/i, replacement: '[REDACTED]' },
  { pattern: /secret/i, replacement: '[REDACTED]' },
  { pattern: /authorization/i, replacement: '[REDACTED]' },
  {
    pattern: /\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi,
    replacement: (email: string) => {
      const [local, domain] = email.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    }
  }
];

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    let sanitized = value;
    for (const { pattern, replacement } of sensitivePatterns) {
      if (typeof replacement === 'function') {
        sanitized = sanitized.replace(pattern, replacement);
      } else if (pattern.test(sanitized)) {
        return replacement;
      }
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Check if key itself is sensitive
      const isSensitiveKey = sensitivePatterns.some((p) => p.pattern.test(key));
      sanitized[key] = isSensitiveKey ? '[REDACTED]' : sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
};

const formatLog = (level: LogLevel, message: string, metadata?: Record<string, unknown>): void => {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const sanitizedMetadata = metadata ? sanitizeValue(metadata) : undefined;

  if (useStructured) {
    // Structured JSON logging for production
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: 'zoms-portfolio',
      environment: process.env.NODE_ENV,
      runtime: IS_EDGE ? 'edge' : 'node',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Sanitized metadata is safe to spread
      ...(sanitizedMetadata as object)
    };
    // eslint-disable-next-line no-console -- Console is the logging output
    console.log(JSON.stringify(logEntry));
  } else {
    // Pretty logging for development
    const emoji = {
      trace: '🔍',
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '💥'
    }[level];

    const coloredLevel = level.toUpperCase().padEnd(5);
    // eslint-disable-next-line no-console -- Console is the logging output
    console.log(`${emoji} [${timestamp}] ${coloredLevel} ${message}`, sanitizedMetadata ?? '');
  }
};

/**
 * Wrapper for logging with consistent metadata
 */
export const log = {
  /**
   * Trace level - Detailed debugging information
   */
  trace: (message: string, metadata?: Record<string, unknown>): void => {
    formatLog('trace', message, metadata);
  },

  /**
   * Debug level - Debug information for development
   */
  debug: (message: string, metadata?: Record<string, unknown>): void => {
    formatLog('debug', message, metadata);
  },

  /**
   * Info level - General informational messages
   */
  info: (message: string, metadata?: Record<string, unknown>): void => {
    formatLog('info', message, metadata);
  },

  /**
   * Warn level - Warning messages for potential issues
   */
  warn: (message: string, metadata?: Record<string, unknown>): void => {
    formatLog('warn', message, metadata);
  },

  /**
   * Error level - Error messages for failures
   */
  error: (message: string, metadata?: Record<string, unknown>): void => {
    formatLog('error', message, metadata);
  },

  /**
   * Fatal level - Critical failures requiring immediate attention
   */
  fatal: (message: string, metadata?: Record<string, unknown>): void => {
    formatLog('fatal', message, metadata);
  },

  /**
   * Log API request with metadata
   */
  request: (method: string, path: string, metadata?: Record<string, unknown>): void => {
    formatLog('info', 'API Request', {
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
    formatLog('info', 'API Response', {
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
    formatLog('info', 'Performance', {
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
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
        ...metadata
      });
      throw error;
    }
  }
};

export default log;
