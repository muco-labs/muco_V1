/**
 * Shared Supabase auth storage for *.mucolabs.com so OAuth on www
 * persists across app., team., freelancers., and admin. subdomains.
 * Localhost and preview hosts keep default localStorage behavior.
 */

const CHUNK_SIZE = 3500

function shouldUseSharedMucolabsCookieStorage(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname.toLowerCase()
  return host === 'mucolabs.com' || host.endsWith('.mucolabs.com')
}

function cookieDomain(): string {
  return '.mucolabs.com'
}

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length))
    }
  }
  return null
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Domain=${cookieDomain()}; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

function deleteCookie(name: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Domain=${cookieDomain()}; Max-Age=0; SameSite=Lax${secure}`
}

function chunkKey(base: string, index: number): string {
  return `${base}__chunk_${index}`
}

function readChunked(base: string): string | null {
  const direct = readCookie(base)
  if (direct !== null) return direct

  const countRaw = readCookie(`${base}__chunk_count`)
  if (!countRaw) return null
  const count = Number.parseInt(countRaw, 10)
  if (!Number.isFinite(count) || count < 1) return null

  let value = ''
  for (let i = 0; i < count; i += 1) {
    const piece = readCookie(chunkKey(base, i))
    if (piece === null) return null
    value += piece
  }
  return value
}

function writeChunked(base: string, value: string, maxAgeSeconds: number) {
  deleteChunked(base)
  if (value.length <= CHUNK_SIZE) {
    writeCookie(base, value, maxAgeSeconds)
    return
  }
  const chunks = Math.ceil(value.length / CHUNK_SIZE)
  writeCookie(`${base}__chunk_count`, String(chunks), maxAgeSeconds)
  for (let i = 0; i < chunks; i += 1) {
    writeCookie(chunkKey(base, i), value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), maxAgeSeconds)
  }
}

function deleteChunked(base: string) {
  deleteCookie(base)
  const countRaw = readCookie(`${base}__chunk_count`)
  if (countRaw) {
    const count = Number.parseInt(countRaw, 10)
    if (Number.isFinite(count)) {
      for (let i = 0; i < count; i += 1) {
        deleteCookie(chunkKey(base, i))
      }
    }
  }
  deleteCookie(`${base}__chunk_count`)
}

/** ~1 year — Supabase refresh handles expiry; storage must outlive access token. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400

export function createSupabaseAuthStorage(): Storage {
  if (!shouldUseSharedMucolabsCookieStorage()) {
    return window.localStorage
  }

  return {
    getItem(key: string): string | null {
      try {
        return readChunked(key)
      } catch {
        return null
      }
    },
    setItem(key: string, value: string): void {
      try {
        writeChunked(key, value, COOKIE_MAX_AGE)
      } catch {
        /* quota / privacy mode */
      }
    },
    removeItem(key: string): void {
      try {
        deleteChunked(key)
      } catch {
        /* ignore */
      }
    },
    key(index: number): string | null {
      return window.localStorage.key(index)
    },
    get length() {
      return window.localStorage.length
    },
    clear(): void {
      /* Supabase only clears known keys via removeItem */
    },
  }
}

export function isSharedMucolabsAuthStorageEnabled(): boolean {
  return shouldUseSharedMucolabsCookieStorage()
}
