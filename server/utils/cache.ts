/**
 * In-Memory Fast Cache Engine for Ultra Low-Latency Operations (< 200 ms)
 * Menyimpan data aktif (token presensi, sesi, master soal kuis, enrollment)
 * di memory RAM server untuk menghindari round-trip database berulang pada beban tinggi.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number // Timestamp ms
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(cleanupPeriodMs = 60_000) {
    // Jalankan pembersihan berkala item kadaluarsa
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.purgeExpired()
      }, cleanupPeriodMs)

      // Pastikan interval tidak menahan Node.js process agar bisa exit
      if (this.cleanupInterval?.unref) {
        this.cleanupInterval.unref()
      }
    }
  }

  public get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }

    return entry.value as T
  }

  public set<T>(key: string, value: T, ttlMs = 300_000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    })
  }

  public has(key: string): boolean {
    return this.get(key) !== undefined
  }

  public delete(key: string): boolean {
    return this.store.delete(key)
  }

  public deletePrefix(prefix: string): number {
    let count = 0
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  public clear(): void {
    this.store.clear()
  }

  /**
   * Mengambil dari cache jika ada, atau jalankan fetcher dan simpan ke cache
   */
  public async remember<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const fresh = await fetcher()
    if (fresh !== null && fresh !== undefined) {
      this.set(key, fresh, ttlMs)
    }
    return fresh
  }

  private purgeExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  public size(): number {
    return this.store.size
  }
}

export const memoryCache = new MemoryCache()

// Cache Key Helper
export const CacheKeys = {
  attendanceToken: (token: string) => `att_tok:${token}`,
  session: (sessionId: string) => `sess:${sessionId}`,
  enrollment: (classId: string, studentId: string) => `enr:${classId}:${studentId}`,
  quizQuestions: (quizId: string) => `quiz_q:${quizId}`,
  quizAttempt: (attemptId: string) => `attm:${attemptId}`
}
