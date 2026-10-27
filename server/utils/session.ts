import type { H3Event } from 'h3'
import { useSession } from 'h3'
import type { AuthSessionUser } from '~/types'

export interface SessionData {
  user?: AuthSessionUser
  createdAt?: string
}

export const getSessionConfig = () => {
  const secret = process.env.SESSION_SECRET || 'wakanda-super-secure-session-secret-key-32chars-min-2026!'

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
  return useSession<SessionData>(event, getSessionConfig())
}
