export async function abortable<T>(
  signal: AbortSignal | undefined,
  abort: () => unknown,
  fn: () => T,
): Promise<Awaited<T>> {
  if (!signal) {
    return await fn();
  }
  if (signal.aborted) {
    abort();
    throw signal.reason;
  }
  const onAbort = () => abort();
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    return await fn();
  } catch (e) {
    signal.throwIfAborted();
    throw e;
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
