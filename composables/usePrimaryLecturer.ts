import { computed } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'

export interface PrimaryLecturer {
  name: string
  email: string
  nimNidn: string
  isResolved: boolean
}

/**
 * Sumber tunggal nama dosen pengampu kelas.
 * Mengambil dosen dengan `isPrimary` dari data kelas, bukan string yang ditulis
 * ulang di tiap tampilan, sehingga nama pengampu konsisten di seluruh workspace.
 */
export function usePrimaryLecturer() {
  const academicStore = useAcademicStore()

  return computed<PrimaryLecturer>(() => {
    const lecturers = academicStore.selectedClassDetail?.lecturers || []
    const primary = lecturers.find(lecturer => lecturer.isPrimary) || lecturers[0]

    if (!primary) {
      return { name: 'Dosen Pengampu', email: '-', nimNidn: '-', isResolved: false }
    }

    return {
      name: primary.name,
      email: primary.email || '-',
      nimNidn: primary.nimNidn || '-',
      isResolved: true
    }
  })
}
