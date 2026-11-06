import { authService } from '../../../server/services'
import { loginSchema } from '../../../server/utils/schemas'
import { validateBody } from '../../../server/utils/validation'
import { createApiResponse } from '../../../server/utils/response'
import { handleServerError, UnauthorizedError } from '../../../server/utils/errors'
import {
  getClientIp,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit
} from '../../../server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const clientIp = getClientIp(event)
  let normalizedEmail = ''

  try {
    const body = await validateBody(event, loginSchema)
    normalizedEmail = body.email.trim().toLowerCase()
    const rateLimitKey = `${clientIp}:${normalizedEmail}`

    // 1. Cek proteksi brute-force: Lempar 429 jika IP/email sedang diblokir
    checkLoginRateLimit(rateLimitKey)

    // 2. Eksekusi login via AuthService
    const result = await authService.login(body, event)

    // 3. Login berhasil: Reset counter percobaan gagal agar demo accounts tidak terblokir
    resetLoginRateLimit(rateLimitKey)

    return createApiResponse(result, 'Autentikasi berhasil, selamat datang di LMS Wakanda', {
      requestId: event.context.requestId
    })
  } catch (error) {
    // 4. Catat kegagalan HANYA jika error berasal dari kesalahan kredensial (UnauthorizedError / 401)
    if (normalizedEmail && error instanceof UnauthorizedError) {
      const rateLimitKey = `${clientIp}:${normalizedEmail}`
      recordFailedLogin(rateLimitKey)
    }

    return handleServerError(error)
  }
})
