export type WorkspaceRole = 'admin' | 'lecturer' | 'student'

export type WorkspaceSectionId =
  | 'overview'
  | 'sessions'
  | 'attendance'
  | 'assignments'
  | 'grades'
  | 'ews'

export interface WorkspaceNavItem {
  id: WorkspaceSectionId
  label: string
  icon: string
}

/** Pemetaan role aplikasi ke segmen URL workspace. */
export const ROLE_SEGMENT: Record<string, string> = {
  admin: 'admin',
  lecturer: 'dosen',
  student: 'mahasiswa'
}

/** Pemetaan segmen URL workspace ke role aplikasi. */
export const SEGMENT_ROLE: Record<string, WorkspaceRole> = {
  admin: 'admin',
  dosen: 'lecturer',
  mahasiswa: 'student'
}

/**
 * Ikon garis (line-art) 24x24 gaya outline. Dipakai bergantian dengan `currentColor`
 * agar sidebar tetap monokrom dan tidak bergantung pada emoji.
 */
export const NAV_ICONS: Record<WorkspaceSectionId, string> = {
  overview:
    'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  sessions:
    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  attendance:
    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  assignments:
    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  grades:
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  ews: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
}

/**
 * Daftar section workspace yang relevan untuk sebuah role.
 * Admin, Dosen, dan Mahasiswa tidak pernah melihat menu yang sama persis.
 */
export function buildWorkspaceNav(role: WorkspaceRole): WorkspaceNavItem[] {
  const isStudent = role === 'student'

  const items: WorkspaceNavItem[] = []

  if (role === 'admin') {
    items.push({ id: 'overview', label: 'Ringkasan Akademik', icon: NAV_ICONS.overview })
  }

  items.push({
    id: 'sessions',
    label: isStudent ? 'Pertemuan' : 'Struktur Pertemuan',
    icon: NAV_ICONS.sessions
  })

  items.push({
    id: 'attendance',
    label: isStudent ? 'Presensi Saya' : 'Rekap Presensi',
    icon: NAV_ICONS.attendance
  })

  items.push({
    id: 'assignments',
    label: isStudent ? 'Tugas Saya' : 'Rekap Tugas',
    icon: NAV_ICONS.assignments
  })

  items.push({
    id: 'grades',
    label: isStudent ? 'Nilai & Simulasi UAS' : 'Gradebook',
    icon: NAV_ICONS.grades
  })

  if (!isStudent) {
    items.push({ id: 'ews', label: 'EWS & Analitik', icon: NAV_ICONS.ews })
  }

  return items
}

/** Section yang tampil pertama kali saat workspace dibuka. */
export function defaultSectionFor(role: WorkspaceRole): WorkspaceSectionId {
  return role === 'admin' ? 'overview' : 'sessions'
}
