/** Safe JSON-LD serialization — breaks out of script context if strings contain `<`. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
