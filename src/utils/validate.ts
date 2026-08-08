const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 254) return false
  return EMAIL_PATTERN.test(trimmed)
}

export function sanitizeTextInput(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength)
}
