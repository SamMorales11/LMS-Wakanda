import { createApiResponse } from '../../../server/utils/response'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler((event) => {
  const user = requireUserRole(event, ['lecturer', 'admin'])

  return createApiResponse(
    {
      scope: 'LECTURER_PORTAL',
      lecturerName: user.name,
      nidn: user.nimNidn,
      message: 'Portal Dosen: Pengelolaan 16 Pertemuan, Presensi, dan Penilaian Tugas Kuis.',
      actions: ['INPUT_ATTENDANCE', 'GRADE_ASSIGNMENTS', 'PUBLISH_QUIZ']
    },
    'Portal dosen berhasil diakses'
  )
})
