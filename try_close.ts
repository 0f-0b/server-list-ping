export function tryClose(r: Deno.Closer): undefined {
  try {
    r.close();
  } catch {
    // ignored
  }
}
