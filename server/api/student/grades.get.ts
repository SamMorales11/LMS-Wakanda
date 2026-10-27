import { defineEventHandler } from 'h3'
import { createApiResponse } from '../../../server/utils/response'
import { requireUserRole } from '../../../server/utils/auth'

export default defineEventHandler((event) => {
  const user = requireUserRole(event, ['student', 'admin'])

  return createApiResponse(
    {
      scope: 'STUDENT_PORTAL',
      studentName: user.name,
      nim: user.nimNidn,
      message: 'Portal Mahasiswa: Jadwal Kuliah, Kartu Hasil Studi (KHS), dan Presensi QR.',
      actions: ['VIEW_ATTENDANCE', 'SUBMIT_ASSIGNMENT', 'TAKE_QUIZ', 'VIEW_GRADES']
    },
    'Portal mahasiswa berhasil diakses'
  )
})
