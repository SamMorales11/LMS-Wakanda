export type WorkspaceRole = 'admin' | 'lecturer' | 'student'

export type WorkspaceSectionId =
  | 'overview'
  | 'sessions'
  | 'attendance'
  | 'assignments'
  | 'grades'
  | 'ews'
  | 'directory'
  | 'classes-list'

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
  ews: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  directory:
    'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  'classes-list':
    'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342'
}

/**
 * Daftar section workspace yang relevan untuk sebuah role.
 * Admin, Dosen, dan Mahasiswa tidak pernah melihat menu yang sama persis.
 */
export function buildWorkspaceNav(role: WorkspaceRole): WorkspaceNavItem[] {
  const isStudent = role === 'student'

  const items: WorkspaceNavItem[] = []

  // Admin mendapat 3 menu terfokus tanpa fitur operasional kelas
  if (role === 'admin') {
    items.push(
      { id: 'overview', label: 'Ikhtisar & Analitik', icon: NAV_ICONS.overview },
      { id: 'directory', label: 'Direktori Civitas', icon: NAV_ICONS.directory },
      { id: 'classes-list', label: 'Kelas Perkuliahan', icon: NAV_ICONS['classes-list'] }
    )
    return items
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
