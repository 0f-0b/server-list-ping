export async function deadline<T>(
  signal: AbortSignal | undefined,
  fn: () => T,
): Promise<Awaited<T>> {
  if (!signal) {
    return await fn();
  }
  signal.throwIfAborted();
  const { promise: aborted, reject } = Promise.withResolvers<never>();
  const promise = (async () => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    try {
      return await fn();
    } finally {
      signal.removeEventListener("abort", abort);
    }
  })();
  return await Promise.race([promise, aborted]);
}
