import { DomainError } from './errors'

export class TooManyRequestsError extends DomainError {
  constructor(message = 'Terlalu banyak permintaan login gagal', details?: unknown) {
    super(message, 429, 'TOO_MANY_REQUESTS', details)
  }
}

interface FailedLoginEntry {
  failedAttempts: number
  firstFailedAt: number
  lastFailedAt: number
  blockedUntil: number
}

// In-memory store untuk pelacakan percobaan login gagal (SEC-06)
const failedLoginStore = new Map<string, FailedLoginEntry>()

// Konfigurasi Rate Limiting: 5x gagal dalam 15 menit -> blokir 15 menit
const MAX_FAILED_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 menit
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 menit

/**
 * Mengambil alamat IP klien dari reverse-proxy headers atau raw socket
 */
export const getClientIp = (event: H3Event): string => {
  const xForwardedFor = getRequestHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  const xRealIp = getRequestHeader(event, 'x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }
  return event.node?.req?.socket?.remoteAddress || '127.0.0.1'
}

/**
 * Memeriksa apakah IP/email sedang dalam masa penalti pemblokiran
 */
export const checkLoginRateLimit = (key: string): void => {
  const record = failedLoginStore.get(key)
  if (!record) return

  const now = Date.now()

  // Jika sedang dalam masa hukuman blokir
  if (record.blockedUntil > now) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000)
    throw new TooManyRequestsError(
      `Terlalu banyak percobaan login yang gagal. Akun/IP Anda ditangguhkan sementara selama ${remainingSeconds} detik demi keamanan sistem.`,
      {
        retryAfter: remainingSeconds,
        blockedUntil: new Date(record.blockedUntil).toISOString()
      }
    )
  }

  // Jika masa aktif window sudah kedaluwarsa dan tidak diblokir, bersihkan record
  if (now - record.firstFailedAt > WINDOW_MS) {
    failedLoginStore.delete(key)
  }
}

/**
 * Mencatat percobaan login GAGAL (status 401).
 * Hanya dipanggil saat kredensial tidak sesuai.
 */
export const recordFailedLogin = (key: string): void => {
  const now = Date.now()
  const record = failedLoginStore.get(key)

  if (!record) {
    failedLoginStore.set(key, {
      failedAttempts: 1,
      firstFailedAt: now,
      lastFailedAt: now,
      blockedUntil: 0
    })
    return
  }

  // Reset jendela jika sudah lewat dari batas window
  if (now - record.firstFailedAt > WINDOW_MS && record.blockedUntil <= now) {
    failedLoginStore.set(key, {
      failedAttempts: 1,
      firstFailedAt: now,
      lastFailedAt: now,
      blockedUntil: 0
    })
    return
  }

  record.failedAttempts += 1
  record.lastFailedAt = now

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS
    console.warn(`[Security Alert] Rate limit aktif: ${key} diblokir sementara selama 15 menit setelah ${record.failedAttempts} percobaan gagal`)
  }
}

/**
 * Mereset counter kegagalan saat login BERHASIL.
 * Memastikan alur pergantian 7 persona akun uji coba tidak terblokir.
 */
export const resetLoginRateLimit = (key: string): void => {
  if (failedLoginStore.has(key)) {
    failedLoginStore.delete(key)
  }
}
