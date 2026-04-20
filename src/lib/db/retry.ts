const TRANSIENT_DB_ERRORS = [
  "Connection terminated unexpectedly",
  "Server has closed the connection",
  "Client network socket disconnected",
  "the database system is in recovery mode",
  "the database system is not accepting connections",
  "DbHandler exited",
  "Connection ended unexpectedly",
  "terminating connection",
  "Can't reach database server",
  "Timed out fetching a new connection from the connection pool",
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "ENOTFOUND",
  "socket hang up"
];

export function isTransientDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return TRANSIENT_DB_ERRORS.some((m) => msg.includes(m));
}

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
}

export async function withDbRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 8;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 30_000;
  const label = options.label ?? "db";

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientDbError(err)) throw err;
      const delay = Math.min(baseDelayMs * 2 ** i, maxDelayMs);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[${label}] transient error (attempt ${i + 1}/${attempts}), retrying in ${delay}ms: ${msg}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}
