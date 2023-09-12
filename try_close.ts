export function tryClose(r: { close(): unknown }): undefined {
  try {
    r.close();
  } catch {
    // ignored
  }
}
