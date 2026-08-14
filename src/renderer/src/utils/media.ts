/**
 * Converts an absolute local file path to a `media://` URL that Electron
 * can serve via the registered custom protocol handler.
 *
 * The critical rules for Windows paths:
 *   - Backslashes  → forward slashes  (URL spec requires /)
 *   - Drive letter  → kept as-is but MUST sit after the authority (triple-slash form)
 *   - Correct:  media:///C:/Users/dazed/AppData/…
 *   - Wrong:    media://C:\Users\dazed\AppData\…  (browser strips the colon)
 */
export function toMediaUrl(filePath: string | undefined | null): string {
  if (!filePath) return ''
  // Normalize Windows back-slashes
  const normalized = filePath.replace(/\\/g, '/')
  // Strip any leading slashes – we will always add exactly one leading slash
  // so the result has the form:  media:///C:/…  or  media:////network/share/…
  const stripped = normalized.replace(/^\/+/, '')
  return `media:///${stripped}`
}
