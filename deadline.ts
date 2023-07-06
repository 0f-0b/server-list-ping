export async function deadline<T>(
  signal: AbortSignal | undefined,
  fn: () => T,
): Promise<Awaited<T>> {
  if (!signal) {
    return await fn();
  }
  signal.throwIfAborted();
  let abort: (reason: unknown) => unknown;
  const aborted = new Promise<never>((_, reject) => abort = reject);
  const promise = (async () => {
    const onAbort = () => abort(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      return await fn();
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  })();
  return Promise.race([promise, aborted]);
}
