export type Result<T, E> = { data: T; ok: true } | { error: E; ok: false };

export function ok<T>(data: T): Result<T, never> {
  return { data, ok: true };
}

export function err<E>(error: E): Result<never, E> {
  return { error, ok: false };
}

export async function fromThrowable<T>(fn: () => Promise<T>): Promise<Result<T, unknown>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error);
  }
}
