import { defineEventHandler, getRequestPath, getMethod } from 'h3'
import { getUserSession } from '../utils/session'
import { UnauthorizedError, ForbiddenError, handleServerError } from '../utils/errors'

export default defineEventHandler(async (event) => {
  const path = getRequestPath(event)
  const method = getMethod(event)

  // 1. Ambil session pengguna jika ada
  try {
    const session = await getUserSession(event)
    if (session.data?.user?.id) {
      event.context.user = session.data.user
    }
  } catch (err) {
    console.error('[Auth Middleware] Gagal membaca session:', err)
  }

  // 2. Lewati middleware untuk endpoint publik atau non-API
  if (!path.startsWith('/api')) {
    return
  }

  // Endpoint publik tanpa autentikasi
  const publicApiPaths = [
    '/api/auth/login',
    '/api/health'
  ]

  if (publicApiPaths.some(p => path === p || path.startsWith(`${p}/`))) {
    return
  }

  try {
    // 3. Endpoint autentikasi sesi aktif (/api/auth/me, /api/auth/logout)
    if (path.startsWith('/api/auth/')) {
      if (!event.context.user) {
        throw new UnauthorizedError('Sesi autentikasi diperlukan untuk mengakses layanan ini')
      }
      return
    }

    // 4. Role-Based Access Control (RBAC) Route Protection
    // A. Endpoint Administrator (/api/admin/**)
    if (path.startsWith('/api/admin')) {
      if (!event.context.user) {
        throw new UnauthorizedError('Anda harus login terlebih dahulu sebagai Administrator')
      }
      if (event.context.user.role !== 'admin') {
        throw new ForbiddenError('Akses ditolak: Hanya peran Administrator yang dapat mengakses endpoint ini')
      }
      return
    }

    // B. Endpoint Dosen (/api/lecturer/**)
    if (path.startsWith('/api/lecturer')) {
      if (!event.context.user) {
        throw new UnauthorizedError('Anda harus login terlebih dahulu sebagai Dosen')
      }
      if (event.context.user.role !== 'lecturer' && event.context.user.role !== 'admin') {
        throw new ForbiddenError('Akses ditolak: Hanya Dosen dan Administrator yang diizinkan')
      }
      return
    }

    // C. Endpoint Mahasiswa (/api/student/**)
    if (path.startsWith('/api/student')) {
      if (!event.context.user) {
        throw new UnauthorizedError('Anda harus login terlebih dahulu sebagai Mahasiswa')
      }
      if (event.context.user.role !== 'student' && event.context.user.role !== 'admin') {
        throw new ForbiddenError('Akses ditolak: Hanya Mahasiswa dan Administrator yang diizinkan')
      }
      return
    }

    // D. Proteksi Mutasi Data Pengguna (/api/users POST, PUT, DELETE)
    if (path.startsWith('/api/users') && ['POST', 'PUT', 'DELETE'].includes(method)) {
      if (!event.context.user) {
        throw new UnauthorizedError('Anda harus login untuk melakukan perubahan data pengguna')
      }
      if (event.context.user.role !== 'admin') {
        throw new ForbiddenError('Akses ditolak: Hanya Administrator yang berhak mengelola data pengguna')
      }
      return
    }
  } catch (error) {
    return handleServerError(error)
  }
})
