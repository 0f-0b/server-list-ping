export async function abortable<T>(
  signal: AbortSignal | undefined,
  fn: () => T,
): Promise<Awaited<T>> {
  if (!signal) {
    return await fn();
  }
  signal.throwIfAborted();
  let onAbort: (reason: unknown) => unknown;
  const aborted = new Promise<never>((_, reject) => onAbort = reject);
  const promise = (async () => {
    const abort = () => onAbort(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    try {
      return await fn();
    } finally {
      signal.removeEventListener("abort", abort);
    }
  })();
  return Promise.race([promise, aborted]);
}
