import { getUserSession } from '../utils/session'
import { UnauthorizedError, ForbiddenError, handleServerError } from '../utils/errors'

export default defineEventHandler(async (event) => {
  const path = getRequestPath(event)

  // 1. Ekstraksi session pengguna terotentikasi jika cookie tersedia
  try {
    const session = await getUserSession(event)
    if (session.data?.user?.id) {
      event.context.user = session.data.user
    }
  } catch (err) {
    console.error('[Auth Middleware] Gagal membaca session:', err)
  }

  // 2. Lewati middleware untuk endpoint non-API
  if (!path.startsWith('/api')) {
    return
  }

  // 3. Rute publik yang dikecualikan dari kewajiban otentikasi sesi:
  // - /api/auth/login: Form otentikasi kredensial pengguna
  // - /api/auth/logout: Pembersihan sesi aktif
  // - /api/auth/me: Pemeriksaan status sesi aktif oleh client store
  // - /api/health: Pemeriksaan ketersediaan sistem & basis data
  // - /api/storage/local/**: Pengunggahan/pengunduhan fallback lokal yang divalidasi via HMAC signature
  const isPublicRoute =
    path === '/api/auth/login' ||
    path === '/api/auth/logout' ||
    path === '/api/auth/me' ||
    path === '/api/health' ||
    path.startsWith('/api/storage/local')

  if (isPublicRoute) {
    return
  }

  try {
    // 4. Deny-by-Default (SEC-02): Seluruh rute /api/** lainnya WAJIB memiliki sesi aktif
    if (!event.context.user) {
      throw new UnauthorizedError('Sesi autentikasi diperlukan untuk mengakses layanan API ini')
    }

    // 5. Role-Based Access Control (RBAC) Route Protection:

    // A. Manajemen Pengguna (/api/users/**): Seluruh metode (GET, POST, PUT, DELETE) WAJIB Admin
    if (path === '/api/users' || path.startsWith('/api/users/')) {
      if (event.context.user.role !== 'admin') {
        throw new ForbiddenError('Akses ditolak: Hanya Administrator yang berhak mengelola data pengguna')
      }
      return
    }

    // B. Endpoint Khusus Administrator (/api/admin/**)
    if (path.startsWith('/api/admin')) {
      if (event.context.user.role !== 'admin') {
        throw new ForbiddenError('Akses ditolak: Hanya peran Administrator yang dapat mengakses endpoint ini')
      }
      return
    }

    // C. Endpoint Khusus Dosen (/api/lecturer/**)
    if (path.startsWith('/api/lecturer')) {
      if (event.context.user.role !== 'lecturer' && event.context.user.role !== 'admin') {
        throw new ForbiddenError('Akses ditolak: Hanya Dosen dan Administrator yang diizinkan')
      }
      return
    }

    // D. Endpoint Khusus Mahasiswa (/api/student/**)
    if (path.startsWith('/api/student')) {
      if (event.context.user.role !== 'student' && event.context.user.role !== 'admin') {
        throw new ForbiddenError('Akses ditolak: Hanya Mahasiswa dan Administrator yang diizinkan')
      }
      return
    }

    // Rute terotentikasi umum lainnya lolos verifikasi sesi Deny-by-Default dan diteruskan ke handler spesifik
  } catch (error) {
    return handleServerError(error)
  }
})
