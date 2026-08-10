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

function decodeCookieName(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function readCookie(name: string): string | null {
  const nameCandidates = new Set<string>([name])
  try {
    nameCandidates.add(decodeURIComponent(name))
    nameCandidates.add(encodeURIComponent(name))
  } catch {
    /* ignore */
  }

  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const rawName = trimmed.slice(0, eq).trim()
    const decodedName = decodeCookieName(rawName)
    if (!nameCandidates.has(rawName) && !nameCandidates.has(decodedName)) continue
    const value = trimmed.slice(eq + 1)
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }
  return null
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Domain=${cookieDomain()}; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

function deleteCookie(name: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=; Path=/; Domain=${cookieDomain()}; Max-Age=0; SameSite=Lax${secure}`
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

/** Read auth storage value (cookie-backed on mucolabs.com). */
export function readSharedAuthStorageValue(key: string): string | null {
  if (!shouldUseSharedMucolabsCookieStorage()) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  }
  return readChunked(key)
}

/** Remove stale PKCE verifier keys before starting a new OAuth redirect. */
export function clearPkceVerifierCookies(storageKey: string): void {
  if (!shouldUseSharedMucolabsCookieStorage()) {
    try {
      for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
        const key = window.localStorage.key(i)
        if (!key) continue
        if (
          key === `${storageKey}-code-verifier` ||
          (key.startsWith(`${storageKey}-flow-`) && key.endsWith('-code-verifier'))
        ) {
          window.localStorage.removeItem(key)
        }
      }
    } catch {
      /* ignore */
    }
    return
  }

  const namesToDelete: string[] = []
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    const rawName = eq >= 0 ? trimmed.slice(0, eq).trim() : trimmed
    const name = decodeCookieName(rawName)
    if (
      name.includes('-code-verifier') ||
      name.startsWith(`${storageKey}-flow-`) ||
      name === `${storageKey}-code-verifier`
    ) {
      namesToDelete.push(name)
    }
  }
  for (const name of namesToDelete) {
    deleteChunked(name)
  }
}
