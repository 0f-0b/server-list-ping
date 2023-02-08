export async function abortable<T>(
  signal: AbortSignal | undefined,
  abort: () => unknown,
  fn: () => T,
): Promise<Awaited<T>> {
  if (signal?.aborted) {
    abort();
    throw signal.reason;
  }
  signal?.addEventListener("abort", abort, { once: true });
  try {
    return await fn();
  } catch (e: unknown) {
    signal?.throwIfAborted();
    throw e;
  } finally {
    if (!signal?.aborted) {
      signal?.removeEventListener("abort", abort);
      abort();
    }
  }
}
