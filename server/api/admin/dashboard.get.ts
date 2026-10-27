import { createApiResponse } from '../../../server/utils/response'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler((event) => {
  const user = requireUserRole(event, ['admin'])

  return createApiResponse(
    {
      scope: 'ADMIN_DASHBOARD',
      accessedBy: user.name,
      adminMessage: 'Selamat datang di konsol administrasi akademik Institut Teknologi Wakanda.',
      permissions: ['MANAGE_USERS', 'MANAGE_COURSES', 'MANAGE_ACADEMIC_TERMS', 'AUDIT_LOGS']
    },
    'Data dashboard admin berhasil diakses'
  )
})
