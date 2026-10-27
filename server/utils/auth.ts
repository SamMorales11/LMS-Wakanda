import type { AuthSessionUser, UserRole } from '~/types'
import { UnauthorizedError, ForbiddenError } from './errors'

declare module 'h3' {
  interface H3EventContext {
    user?: AuthSessionUser
    requestId?: string
  }
}

/**
 * Memastikan request memiliki pengguna yang terautentikasi.
 * Mengembalikan data AuthSessionUser atau melempar UnauthorizedError.
 */
export const requireUserAuth = (event: H3Event): AuthSessionUser => {
  const user = event.context.user
  if (!user || !user.id) {
    throw new UnauthorizedError('Akses ditolak: Anda harus login untuk mengakses endpoint ini')
  }
  return user
}

/**
 * Memastikan pengguna memiliki salah satu role yang diizinkan (RBAC).
 * Melempar ForbiddenError jika role pengguna tidak terdaftar dalam allowedRoles.
 */
export const requireUserRole = (event: H3Event, allowedRoles: UserRole[]): AuthSessionUser => {
  const user = requireUserAuth(event)

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Akses ditolak: Peran '${user.role}' tidak memiliki izin mengakses sumber daya ini. Diperlukan salah satu dari: [${allowedRoles.join(', ')}]`
    )
  }

  return user
}
