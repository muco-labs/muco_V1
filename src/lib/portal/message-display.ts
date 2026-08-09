/**
 * Plain-text message bodies are rendered as React text children (escaped).
 * Normalize for display consistency (trim, strip null bytes).
 */
export function formatMessageBodyForDisplay(body: string): string {
  return body.replace(/\0/g, '').trim()
}
