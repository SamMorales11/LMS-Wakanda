import type { AuthSessionUser } from '~/types'

export interface SessionData {
  user?: AuthSessionUser
  createdAt?: string
}

export const getSessionConfig = (event?: H3Event) => {
  const config = useRuntimeConfig(event)
  let secret = config.sessionSecret

  // Pada mode produksi, SESSION_SECRET wajib disediakan melalui variabel lingkungan minimal 32 karakter (SEC-01)
  if (process.env.NODE_ENV === 'production') {
    if (!secret || typeof secret !== 'string' || secret.trim().length < 32) {
      throw new Error(
        '[Security Exception] Variabel lingkungan SESSION_SECRET wajib dikonfigurasi dengan panjang minimal 32 karakter pada mode produksi.'
      )
    }
  } else {
    // Mode development fallback yang aman untuk pengujian lokal
    secret = secret || 'wakanda-dev-session-secret-key-32chars-min-2026!'
  }

  return {
    name: 'lms_wakanda_session',
    password: secret,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
    }
  }
}

/**
 * Retrieves the strongly typed H3 session instance.
 */
export const getUserSession = async (event: H3Event) => {
  return useSession<SessionData>(event, getSessionConfig(event))
}
