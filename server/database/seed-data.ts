// ============================================================================
// INSTITUT TEKNOLOGI WAKANDA - INSTITUTIONAL SEED DATA HELPER
// ============================================================================
// File ini memisahkan data statis kurikulum 16 pertemuan, 22 user dummy
// (Admin, 3 Dosen, 18 Mahasiswa), master mata kuliah, konfigurasi 5 kelas,
// pemetaan enrollments, soal kuis, dan deskripsi tugas agar seed.ts tetap modular.
// ============================================================================

export interface SeedProgram {
  code: string
  name: string
  degree: string
  description: string
  isActive: boolean
}

export interface SeedAcademicTerm {
  code: string
  name: string
  year: string
  semester: 'ODD' | 'EVEN' | 'SHORT'
  startDate: string
  endDate: string
  isActive: boolean
}

export interface SeedUserCredential {
  name: string
  email: string
  role: 'admin' | 'lecturer' | 'student'
  nimNidn: string
  plainPassword: string
  phoneNumber?: string
  avatarUrl?: string
  ewsScenario?: string
}

export interface SeedCourse {
  programCode: string
  code: string
  name: string
  credits: number
  semester: number
  description: string
  isActive: boolean
}

export interface SeedClassConfig {
  courseCode: string
  code: string
  capacity: number
  room: string
  scheduleDay: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'
  scheduleStart: string
  scheduleEnd: string
  baseDate: string // YYYY-MM-DD
  primaryLecturerEmail: string
  assistantLecturerEmail?: string
}

export interface CurriculumTopic {
  num: number
  title: string
  topicDescription: string
  type: 'REGULAR' | 'MIDTERM_EXAM' | 'FINAL_EXAM' | 'QUIZ' | 'LABORATORY'
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'CANCELLED'
}

export interface QuizQuestionItem {
  id: string
  type: 'MULTIPLE_CHOICE' | 'ESSAY'
  prompt: string
  points: number
  options?: { id: string; text: string }[]
  correctOptionId?: string
  explanation?: string
  rubric?: string
}

export interface QuizDefinition {
  title: string
  sessionNum: number
  type: 'QUIZ' | 'MIDTERM_EXAM' | 'FINAL_EXAM'
  duration: number
  questions: QuizQuestionItem[]
}

export interface AssignmentDefinition {
  title: string
  sessionNum: number
  description: string
  instructions: string
  maxScore: string
}

// ----------------------------------------------------------------------------
// 1. DATA PROGRAM STUDI (PROGRAMS)
// ----------------------------------------------------------------------------
export const seedPrograms: SeedProgram[] = [
  {
    code: 'TIF',
    name: 'S1 Teknik Informatika',
    degree: 'S1',
    description: 'Program Studi Sarjana Teknik Informatika Institut Teknologi Wakanda, berfokus pada rekayasa perangkat lunak modern, kecerdasan artifisial, dan sistem komputasi terdistribusi.',
    isActive: true
  },
  {
    code: 'SIF',
    name: 'S1 Sistem Informasi',
    degree: 'S1',
    description: 'Program Studi Sarjana Sistem Informasi, berfokus pada integrasi proses bisnis digital, manajemen sistem informasi enterprise, dan data analytics.',
    isActive: true
  },
  {
    code: 'RPL',
    name: 'S1 Rekayasa Perangkat Lunak',
    degree: 'S1',
    description: 'Program Studi Sarjana Rekayasa Perangkat Lunak, berfokus pada arsitektur sistem software skala enterprise, DevOps, dan metodologi agile modern.',
    isActive: true
  },
  {
    code: 'TEK-VIB',
    name: 'S1 Teknik Siber & Vibranium',
    degree: 'S1',
    description: 'Program Studi Spesialisasi Rekayasa Keamanan Siber, Kriptografi Kuantum, dan Komputasi Perangkat Keras Tingkat Lanjut Wakanda.',
    isActive: true
  }
]

// ----------------------------------------------------------------------------
// 2. DATA TAHUN AKADEMIK AKTIF (ACADEMIC TERM 20261)
// ----------------------------------------------------------------------------
export const seedActiveTerm: SeedAcademicTerm = {
  code: '20261',
  name: 'Tahun Akademik 2026/2027 - Semester Ganjil',
  year: '2026/2027',
  semester: 'ODD',
  startDate: '2026-09-01',
  endDate: '2027-01-31',
  isActive: true
}

// ----------------------------------------------------------------------------
// 3. DAFTAR SELURUH 22 USERS (1 ADMIN, 3 DOSEN, 18 MAHASISWA)
//    Password seragam 100%: "Password123!"
// ----------------------------------------------------------------------------
const UNIFORM_PASSWORD = 'Password123!'

export const seedUsers: SeedUserCredential[] = [
  // --- A. Administrator Akademik ---
  {
    name: 'Admin Akademik ITW',
    email: 'admin@wakanda.ac.id',
    role: 'admin',
    nimNidn: 'ADM-001',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628110000001',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-wakanda',
    ewsScenario: 'Administrator Sistem & Akademik ITW'
  },

  // --- B. 3 Dosen Pengampu ---
  {
    name: 'Prof. Shuri Udaku',
    email: 'shuri@lecturer.wakanda.ac.id',
    role: 'lecturer',
    nimNidn: '1011088901',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628120000001',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shuri-lecturer',
    ewsScenario: 'Dosen Pengampu Utama (Koordinator Prodi)'
  },
  {
    name: "Dr. T'Challa",
    email: 'tchalla@lecturer.wakanda.ac.id',
    role: 'lecturer',
    nimNidn: '1015058502',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628120000002',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tchalla-lecturer',
    ewsScenario: 'Dosen Pengampu Rekayasa & Sistem Web'
  },
  {
    name: "Dr. W'Kabi",
    email: 'wkabi@lecturer.wakanda.ac.id',
    role: 'lecturer',
    nimNidn: '1019038203',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628120000003',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wkabi-lecturer',
    ewsScenario: 'Dosen Pengampu Keamanan Siber & Kriptografi'
  },

  // --- C. 18 Mahasiswa (Termasuk 4 Persona Demo Inti) ---
  // 1. Nakia Lupita (Demo 1: EWS Aman, Hadir 100%, Nilai A)
  {
    name: 'Nakia Lupita',
    email: 'nakia@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241001',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000001',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nakia-student',
    ewsScenario: 'EWS Aman (Kehadiran 100%, Nilai A, Zero Late)'
  },
  // 2. M'Baku Jabari (Demo 2: EWS Waspada, Hadir 78%, Nilai BC)
  {
    name: "M'Baku Jabari",
    email: 'mbaku@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241002',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000002',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mbaku-student',
    ewsScenario: 'EWS Waspada (Kehadiran 78%, Tugas Terlambat, Nilai BC)'
  },
  // 3. N'Jadaka Erik (Demo 3: EWS Kritis, Hadir <75%, Diskualifikasi UAS, Nilai E)
  {
    name: "N'Jadaka Erik",
    email: 'erik@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241003',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000003',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=erik-student',
    ewsScenario: 'EWS Kritis (Kehadiran 55.6% < 75%, Diskualifikasi UAS, Nilai E)'
  },
  // 4. Riri Williams (Demo 4: Pengujian Aktif Ujian & Presensi)
  {
    name: 'Riri Williams',
    email: 'riri@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241004',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000004',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=riri-student',
    ewsScenario: 'Pengujian Aktif (Presensi Real-Time & Ujian Daring)'
  },
  // 5. Okoye General
  {
    name: 'Okoye General',
    email: 'okoye@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241005',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000005',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=okoye-student',
    ewsScenario: 'Mahasiswa Berprestasi (Presensi 100%, IPK 3.92)'
  },
  // 6. Ayo Border
  {
    name: 'Ayo Border',
    email: 'ayo@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241006',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000006',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ayo-student',
    ewsScenario: 'Mahasiswa Disiplin (Presensi 93.8%, IPK 3.65)'
  },
  // 7. Aneka Midnight
  {
    name: 'Aneka Midnight',
    email: 'aneka@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241007',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000007',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aneka-student',
    ewsScenario: 'Mahasiswa Riset Siber (Presensi 93.8%, IPK 3.70)'
  },
  // 8. Bucky Barnes
  {
    name: 'Bucky Barnes',
    email: 'bucky@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241008',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000008',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bucky-student',
    ewsScenario: 'Mahasiswa Reguler (Presensi 87.5%, IPK 3.25)'
  },
  // 9. Sam Wilson
  {
    name: 'Sam Wilson',
    email: 'sam@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241009',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000009',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam-student',
    ewsScenario: 'Mahasiswa Reguler (Presensi 87.5%, IPK 3.30)'
  },
  // 10. Zuri Elder
  {
    name: 'Zuri Elder',
    email: 'zuri@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241010',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000010',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zuri-student',
    ewsScenario: 'Mahasiswa Akademisi (Presensi 100%, IPK 3.85)'
  },
  // 11. Ramonda Queen
  {
    name: 'Ramonda Queen',
    email: 'ramonda@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241011',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000011',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ramonda-student',
    ewsScenario: 'Mahasiswa Teladan (Presensi 100%, IPK 4.00)'
  },
  // 12. Attuma Talokan
  {
    name: 'Attuma Talokan',
    email: 'attuma@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241012',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000012',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=attuma-student',
    ewsScenario: 'Mahasiswa Reguler (Presensi 81.3%, IPK 3.10)'
  },
  // 13. Namora Talokan
  {
    name: 'Namora Talokan',
    email: 'namora@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241013',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000013',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=namora-student',
    ewsScenario: 'Mahasiswa Menengah (Presensi 81.3%, IPK 2.95)'
  },
  // 14. Kaluu Mystic
  {
    name: 'Kaluu Mystic',
    email: 'kaluu@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241014',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000014',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kaluu-student',
    ewsScenario: 'Mahasiswa Berbakat (Presensi 93.8%, IPK 3.50)'
  },
  // 15. Zawavari Priest
  {
    name: 'Zawavari Priest',
    email: 'zawavari@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241015',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000015',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zawavari-student',
    ewsScenario: 'Mahasiswa Tekun (Presensi 87.5%, IPK 3.35)'
  },
  // 16. Griot AI-Core
  {
    name: 'Griot AI-Core',
    email: 'griot@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241016',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000016',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=griot-student',
    ewsScenario: 'Mahasiswa Komputasi Cerdas (Presensi 100%, IPK 3.95)'
  },
  // 17. Taku Golden
  {
    name: 'Taku Golden',
    email: 'taku@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241017',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000017',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taku-student',
    ewsScenario: 'Mahasiswa Hardware & Arsitektur (Presensi 93.8%, IPK 3.60)'
  },
  // 18. Nomble Spear
  {
    name: 'Nomble Spear',
    email: 'nomble@student.wakanda.ac.id',
    role: 'student',
    nimNidn: '11241018',
    plainPassword: UNIFORM_PASSWORD,
    phoneNumber: '+628520000018',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nomble-student',
    ewsScenario: 'Mahasiswa Keamanan Sistem (Presensi 87.5%, IPK 3.40)'
  }
]

// ----------------------------------------------------------------------------
// 4. DATA MASTER MATA KULIAH (COURSES)
// ----------------------------------------------------------------------------
export const seedCourses: SeedCourse[] = [
  {
    programCode: 'TIF',
    code: 'IF2041',
    name: 'Struktur Data & Algoritma',
    credits: 4,
    semester: 3,
    description: 'Struktur data linear dan non-linear, analisis kompleksitas Big-O, pohon biner seimbang (AVL), graph traversal, dan algoritma jalur terpendek.',
    isActive: true
  },
  {
    programCode: 'TIF',
    code: 'IF202',
    name: 'Basis Data Relasional & Serverless',
    credits: 3,
    semester: 3,
    description: 'Desain skema relasional, normalisasi data, query SQL tingkat lanjut, indexing performa tinggi, dan orkestrasi Drizzle ORM.',
    isActive: true
  },
  {
    programCode: 'TIF',
    code: 'IF302',
    name: 'Pengembangan Aplikasi Web Full-Stack Modern',
    credits: 3,
    semester: 5,
    description: 'Pembangunan aplikasi enterprise modern menggunakan Nuxt 3, Nitro server engine, TypeScript, Pinia store, dan Tailwind CSS.',
    isActive: true
  },
  {
    programCode: 'TEK-VIB',
    code: 'CY101',
    name: 'Kriptografi & Keamanan Sistem Komputer',
    credits: 3,
    semester: 1,
    description: 'Enkripsi simetrik/asimetrik modern (AES, RSA, ECC), fungsi hash SHA, tanda tangan digital, sertifikat X.509, dan keamanan zero-trust.',
    isActive: true
  },
  {
    programCode: 'TIF',
    code: 'IF101',
    name: 'Algoritma & Pemrograman Dasar',
    credits: 3,
    semester: 1,
    description: 'Konsep dasar algoritma, pemrograman terstruktur, tipe data, kontrol alur logika percabangan dan perulangan, serta fungsi modular.',
    isActive: true
  },
  {
    programCode: 'TIF',
    code: 'IF201',
    name: 'Pemrograman Berorientasi Objek & Clean Code',
    credits: 3,
    semester: 3,
    description: 'Prinsip OOP (Encapsulation, Inheritance, Polymorphism, Abstraction), SOLID principles, design patterns, dan standard clean code.',
    isActive: true
  },
  {
    programCode: 'TIF',
    code: 'IF301',
    name: 'Rekayasa Perangkat Lunak & Clean Architecture',
    credits: 4,
    semester: 5,
    description: 'Penerapan Clean Architecture, domain-driven design, dependency injection, automated unit testing, dan integrasi CI/CD modern.',
    isActive: true
  },
  {
    programCode: 'RPL',
    code: 'SE101',
    name: 'Pengantar Rekayasa Perangkat Lunak',
    credits: 3,
    semester: 1,
    description: 'Siklus hidup pengembangan perangkat lunak (SDLC), metodologi Scrum, Agile framework, dan manajemen requirement software skala enterprise.',
    isActive: true
  }
]

// ----------------------------------------------------------------------------
// 5. TEPAT 5 KELAS PERKULIAHAN AKTIF (COURSE CLASSES)
// ----------------------------------------------------------------------------
export const seedClasses: SeedClassConfig[] = [
  {
    courseCode: 'IF2041',
    code: 'A',
    capacity: 30,
    room: 'Vibranium Lab 301',
    scheduleDay: 'MONDAY',
    scheduleStart: '08:00:00',
    scheduleEnd: '11:30:00',
    baseDate: '2026-09-07',
    primaryLecturerEmail: 'shuri@lecturer.wakanda.ac.id',
    assistantLecturerEmail: 'tchalla@lecturer.wakanda.ac.id'
  },
  {
    courseCode: 'IF2041',
    code: 'B',
    capacity: 30,
    room: 'Vibranium Lab 302',
    scheduleDay: 'TUESDAY',
    scheduleStart: '13:00:00',
    scheduleEnd: '16:30:00',
    baseDate: '2026-09-08',
    primaryLecturerEmail: 'tchalla@lecturer.wakanda.ac.id',
    assistantLecturerEmail: 'shuri@lecturer.wakanda.ac.id'
  },
  {
    courseCode: 'IF202',
    code: 'A',
    capacity: 30,
    room: 'Kimoyo Lab 102',
    scheduleDay: 'WEDNESDAY',
    scheduleStart: '08:00:00',
    scheduleEnd: '10:30:00',
    baseDate: '2026-09-09',
    primaryLecturerEmail: 'shuri@lecturer.wakanda.ac.id'
  },
  {
    courseCode: 'IF302',
    code: 'A',
    capacity: 30,
    room: 'Kimoyo Lab 204',
    scheduleDay: 'THURSDAY',
    scheduleStart: '09:00:00',
    scheduleEnd: '11:30:00',
    baseDate: '2026-09-10',
    primaryLecturerEmail: 'tchalla@lecturer.wakanda.ac.id'
  },
  {
    courseCode: 'CY101',
    code: 'A',
    capacity: 30,
    room: 'Secure Hall 401',
    scheduleDay: 'FRIDAY',
    scheduleStart: '13:30:00',
    scheduleEnd: '16:00:00',
    baseDate: '2026-09-11',
    primaryLecturerEmail: 'wkabi@lecturer.wakanda.ac.id'
  }
]

// ----------------------------------------------------------------------------
// 6. PEMETAAN ENROLLMENTS MAHASISWA PER KELAS (10-12 Mahasiswa per Kelas)
// ----------------------------------------------------------------------------
export const classEnrollmentEmails: Record<string, string[]> = {
  // IF2041-A: 12 Mahasiswa (Mengakomodasi 4 Demo Inti: Nakia, M'Baku, Erik, Riri)
  'IF2041:A': [
    'nakia@student.wakanda.ac.id',
    'mbaku@student.wakanda.ac.id',
    'erik@student.wakanda.ac.id',
    'riri@student.wakanda.ac.id',
    'okoye@student.wakanda.ac.id',
    'ayo@student.wakanda.ac.id',
    'aneka@student.wakanda.ac.id',
    'bucky@student.wakanda.ac.id',
    'sam@student.wakanda.ac.id',
    'griot@student.wakanda.ac.id',
    'taku@student.wakanda.ac.id',
    'nomble@student.wakanda.ac.id'
  ],
  // IF2041-B: 11 Mahasiswa
  'IF2041:B': [
    'okoye@student.wakanda.ac.id',
    'ayo@student.wakanda.ac.id',
    'aneka@student.wakanda.ac.id',
    'bucky@student.wakanda.ac.id',
    'sam@student.wakanda.ac.id',
    'zuri@student.wakanda.ac.id',
    'ramonda@student.wakanda.ac.id',
    'attuma@student.wakanda.ac.id',
    'namora@student.wakanda.ac.id',
    'kaluu@student.wakanda.ac.id',
    'zawavari@student.wakanda.ac.id'
  ],
  // IF202-A: 12 Mahasiswa
  'IF202:A': [
    'nakia@student.wakanda.ac.id',
    'mbaku@student.wakanda.ac.id',
    'erik@student.wakanda.ac.id',
    'riri@student.wakanda.ac.id',
    'okoye@student.wakanda.ac.id',
    'ayo@student.wakanda.ac.id',
    'zuri@student.wakanda.ac.id',
    'ramonda@student.wakanda.ac.id',
    'griot@student.wakanda.ac.id',
    'taku@student.wakanda.ac.id',
    'nomble@student.wakanda.ac.id',
    'attuma@student.wakanda.ac.id'
  ],
  // IF302-A: 11 Mahasiswa
  'IF302:A': [
    'nakia@student.wakanda.ac.id',
    'riri@student.wakanda.ac.id',
    'bucky@student.wakanda.ac.id',
    'sam@student.wakanda.ac.id',
    'zuri@student.wakanda.ac.id',
    'ramonda@student.wakanda.ac.id',
    'attuma@student.wakanda.ac.id',
    'namora@student.wakanda.ac.id',
    'kaluu@student.wakanda.ac.id',
    'zawavari@student.wakanda.ac.id',
    'griot@student.wakanda.ac.id'
  ],
  // CY101-A: 11 Mahasiswa
  'CY101:A': [
    'nakia@student.wakanda.ac.id',
    'mbaku@student.wakanda.ac.id',
    'erik@student.wakanda.ac.id',
    'riri@student.wakanda.ac.id',
    'aneka@student.wakanda.ac.id',
    'bucky@student.wakanda.ac.id',
    'kaluu@student.wakanda.ac.id',
    'zawavari@student.wakanda.ac.id',
    'taku@student.wakanda.ac.id',
    'nomble@student.wakanda.ac.id',
    'namora@student.wakanda.ac.id'
  ]
}

// ----------------------------------------------------------------------------
// 7. KURIKULUM 16 PERTEMUAN UNTUK 4 MATA KULIAH (IF2041, IF202, IF302, CY101)
//    Status: P-1..P-9 COMPLETED, P-10 IN_PROGRESS, P-11..P-16 SCHEDULED
// ----------------------------------------------------------------------------
export const courseCurriculums: Record<string, CurriculumTopic[]> = {
  // --- A. IF2041: Struktur Data & Algoritma ---
  IF2041: [
    { num: 1, title: 'Pengantar Struktur Data & Analisis Kompleksitas Big-O', topicDescription: 'Konsep efisiensi algoritma, analisis asimptotik waktu dan memori (Big-O, Omega, Theta), serta benchmarking runtime.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 2, title: 'Abstract Data Type (ADT) & Pointer di Memori', topicDescription: 'Konsep ADT, alokasi memori dinamis heap vs stack, manajemen pointer, dan referensi aman memori.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 3, title: 'Linked List: Singly & Doubly Linked List', topicDescription: 'Implementasi struktur data linked list linear, operasi penyisipan, penghapusan O(1), dan varian doubly & circular.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 4, title: 'Stack & Queue serta Evaluasi Notasi Postfix', topicDescription: 'Prinsip LIFO/FIFO, implementasi berbasis array & linked list, serta evaluasi ekspresi aritmatika postfix/infix.', type: 'QUIZ', status: 'COMPLETED' },
    { num: 5, title: 'Rekursi & Strategi Divide-and-Conquer', topicDescription: 'Analisis fungsi rekursif, call stack execution, Master Theorem, serta implementasi Merge Sort dan Quick Sort.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 6, title: 'Binary Tree & Binary Search Tree (BST)', topicDescription: 'Hierarki node pohon biner, traversal preorder/inorder/postorder, operasi pencarian, penambahan, dan penghapusan BST.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 7, title: 'AVL Tree & Self-Balancing Trees (Review Pra-UTS)', topicDescription: 'Faktor keseimbangan pohon biner, single & double rotation (LL, RR, LR, RL), serta analisis tinggi O(log N).', type: 'QUIZ', status: 'COMPLETED' },
    { num: 8, title: 'Evaluasi Tengah Semester (UTS): Struktur Data & Algoritma', topicDescription: 'Ujian evaluasi capaian pembelajaran pertemuan 1 hingga 7 mencakup ADT, List, Stack/Queue, Rekursi, dan BST.', type: 'MIDTERM_EXAM', status: 'COMPLETED' },
    { num: 9, title: 'Priority Queue & Binary Heap Data Structure', topicDescription: 'Struktur data Min-Heap & Max-Heap, representasi berbasis array flat, operasi heapify, dan algoritma Heap Sort.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 10, title: 'Disjoint Set Union (DSU) & Algoritma Kruskal', topicDescription: 'Struktur himpunan saling lepas, optimasi find-by-rank dan path compression, serta deteksi siklus graf.', type: 'REGULAR', status: 'IN_PROGRESS' },
    { num: 11, title: 'Graph Representation: Adjacency List & Matrix', topicDescription: 'Pemodelan relasi graf terarah & tidak terarah, perbandingan efisiensi ruang memori adjacency matrix vs adjacency list.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 12, title: 'Graph Traversal: Breadth-First & Depth-First Search', topicDescription: 'Penelusuran graf BFS berbasis queue untuk level-order dan DFS berbasis rekursi/stack untuk topological sort.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 13, title: 'Shortest Path: Dijkstra & Bellman-Ford Algorithm', topicDescription: 'Algoritma jalur terpendek berbobot non-negatif Dijkstra dengan priority queue dan deteksi negative cycle Bellman-Ford.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 14, title: 'Minimum Spanning Tree & Network Optimization', topicDescription: 'Optimasi jaringan pohon rentang minimum menggunakan algoritma Prim dan algoritma Kruskal berbasis graf berbobot.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 15, title: 'Hashing & Open Addressing Collision Handling', topicDescription: 'Fungsi hash matematika, collision resolution chaining, linear probing, quadratic probing, dan double hashing.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 16, title: 'Evaluasi Akhir Semester (UAS): Comprehensive Examination', topicDescription: 'Ujian komprehensif penutup semester mencakup seluruh materi struktur data non-linear, graf, hashing, dan optimasi sistem.', type: 'FINAL_EXAM', status: 'SCHEDULED' }
  ],

  // --- B. IF202: Basis Data Relasional & Serverless ---
  IF202: [
    { num: 1, title: 'Konsep Basis Data Relasional & Model Data Konseptual', topicDescription: 'Arsitektur sistem manajemen basis data (DBMS), independensi data logis/fisik, dan model relasional Dr. E.F. Codd.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 2, title: 'Entity Relationship Diagram (ERD) & Relational Mapping', topicDescription: 'Perancangan entitas, atribut kunci/komposit, relasi kardinalitas 1:1, 1:N, N:M, dan konversi ke skema tabel.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 3, title: 'Normalisasi Database (1NF, 2NF, 3NF, BCNF)', topicDescription: 'Identifikasi functional dependency, anomali insert/update/delete, serta dekomposisi lossless skema database.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 4, title: 'Data Definition Language (DDL) & Integritas Data', topicDescription: 'Pembuatan tabel, tipe data relasional, integritas referensial foreign keys, on delete cascade, dan constraints.', type: 'QUIZ', status: 'COMPLETED' },
    { num: 5, title: 'Data Manipulation Language (DML) & Agregasi SQL Kompleks', topicDescription: 'Kueri manipulasi SELECT, JOIN (INNER, LEFT, RIGHT, FULL OUTER), GROUP BY, HAVING, dan agregat statistika.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 6, title: 'Subquery, Common Table Expressions (CTE) & Window Functions', topicDescription: 'Kueri bersarang, recursive CTE, dan fungsi analitik ROW_NUMBER, RANK, DENSE_RANK, LAG, dan LEAD.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 7, title: 'Indexing B-Tree, Performa Kueri & Query Execution Plan', topicDescription: 'Mekanisme index B-Tree vs Hash vs GiST, analisis EXPLAIN ANALYZE, seq scan vs index scan, dan cost estimation.', type: 'QUIZ', status: 'COMPLETED' },
    { num: 8, title: 'Evaluasi Tengah Semester (UTS): Basis Data Relasional', topicDescription: 'Evaluasi tengah semester meliputi desain ERD, normalisasi skema tabel, dan optimasi kueri analitik SQL kompleks.', type: 'MIDTERM_EXAM', status: 'COMPLETED' },
    { num: 9, title: 'Transaksi ACID, Isolasi Transaksi & Lock Concurrency', topicDescription: 'Prinsip Atomicity, Consistency, Isolation, Durability, level isolasi READ COMMITTED hingga SERIALIZABLE, dan deadlocks.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 10, title: 'Arsitektur Cloud Database & Neon Serverless PostgreSQL', topicDescription: 'Pemisahan storage and compute, serverless branching database, connection pooling, dan arsitektur Neon cloud.', type: 'REGULAR', status: 'IN_PROGRESS' },
    { num: 11, title: 'Object-Relational Mapping (ORM) dengan Drizzle ORM', topicDescription: 'Definisi schema berbasis TypeScript, type-safe SQL query builder, relations API, dan performa zero-overhead ORM.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 12, title: 'Database Migration Strategy & Version-Controlled Schema', topicDescription: 'Manajemen migrasi skema database, drizzle-kit generate/migrate/push, rollbacks, dan validasi idempotensi.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 13, title: 'JSONB Semi-Structured Data & PostgreSQL Full-Text Search', topicDescription: 'Penyimpanan payload dokumen dinamis dalam JSONB column, operator penelusuran @>, tsvector, dan tsquery.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 14, title: 'Database Replication, High Availability & Connection Pooling', topicDescription: 'Konfigurasi read-replicas, write-ahead logging (WAL), streaming replication, dan PgBouncer pooling.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 15, title: 'Keamanan Basis Data, Row-Level Security (RLS) & Sanitasi SQL', topicDescription: 'Enkripsi data at rest & in transit, granular access control, RLS policies PostgreSQL, dan mitigasi SQL Injection.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 16, title: 'Evaluasi Akhir Semester (UAS): Desain Skema Enterprise', topicDescription: 'Ujian komprehensif perancangan skema database enterprise skala besar lengkap dengan indeks, migrasi, dan keamanan.', type: 'FINAL_EXAM', status: 'SCHEDULED' }
  ],

  // --- C. IF302: Pengembangan Aplikasi Web Full-Stack Modern ---
  IF302: [
    { num: 1, title: 'Arsitektur Modern Web Application & SSR vs CSR vs Hydration', topicDescription: 'Evolusi web development, Single Page Applications (SPA), Server-Side Rendering (SSR), dan proses hidrasi DOM klien.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 2, title: 'Nuxt 3 Framework Fundamentals & File-System Routing', topicDescription: 'Struktur proyek Nuxt 3, auto-imports modul, file-based routing sistem pada folder pages/ dan layouts terpusat.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 3, title: 'TypeScript Strict Mode untuk Enterprise Full-Stack', topicDescription: 'Konfigurasi TypeScript strict mode, interfaces data transfer (DTO), inferensi tipe otomatis, dan generic types.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 4, title: 'State Management Global dengan Pinia & Auto-Imports', topicDescription: 'Desain global state store berbasis Pinia, reactivitas Vue Composition API (ref, reactive, computed), dan action async.', type: 'QUIZ', status: 'COMPLETED' },
    { num: 5, title: 'Server Engine Nitro, Event Handlers & Server API Routes', topicDescription: 'Arsitektur Nitro server engine, pembuatan REST endpoint server/api, penanganan HTTP methods, dan query parsing.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 6, title: 'Middleware Autentikasi, Session Cookies & H3 Context', topicDescription: 'Proteksi rute aplikasi melalui Nuxt middleware, session cookie secure/httpOnly, dan manajemen token autentikasi.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 7, title: 'Integrasi UI Modern: Tailwind CSS, Headless & Lucide Icons', topicDescription: 'Desain antarmuka responsif institusional dengan utility-first Tailwind CSS, micro-interactions, dan ikonografi dinamis.', type: 'QUIZ', status: 'COMPLETED' },
    { num: 8, title: 'Evaluasi Tengah Semester (UTS): Full-Stack Application Blueprint', topicDescription: 'Ujian evaluasi arsitektur aplikasi full-stack web, desain komponen reaktif, integrasi API, dan autentikasi pengguna.', type: 'MIDTERM_EXAM', status: 'COMPLETED' },
    { num: 9, title: 'Form Validation Enterprise menggunakan Zod & Sanitasi Input', topicDescription: 'Validasi skema runtime menggunakan Zod, sanitasi payload request HTTP, dan standarisasi pesan kesalahan validasi.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 10, title: 'Real-Time Telemetry, WebSockets & Reactive Dashboards', topicDescription: 'Penyajian data analitik waktu nyata, polling terorkestrasi, reactive charts, dan integrasi Early Warning System (EWS).', type: 'REGULAR', status: 'IN_PROGRESS' },
    { num: 11, title: 'Presigned URL, S3 Object Storage & File Upload Pipeline', topicDescription: 'Arsitektur direct browser upload ke S3-compatible cloud storage menggunakan presigned PUT URLs berjangka waktu aman.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 12, title: 'Error Handling Terpusat, HTTP RFC-7807 & Logging', topicDescription: 'Standarisasi error handling server/klien berbasis format RFC-7807 problem details dan audit logging aktivitas.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 13, title: 'Automated Testing: Unit Test, Integration Test & Mocking', topicDescription: 'Pengujian otomatis end-to-end dan unit testing menggunakan Vitest/Playwright untuk menguji logika bisnis frontend & backend.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 14, title: 'Web Performance Optimization, Lazy Loading & Core Web Vitals', topicDescription: 'Optimasi kecepatan loading website, code-splitting, tree-shaking, caching HTTP, dan kepatuhan Google Core Web Vitals.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 15, title: 'Containerization Docker, CI/CD Pipeline & Production Deployment', topicDescription: 'Pembuatan image Docker multi-stage build, GitHub Actions deployment workflow, dan deployment ke edge server platform.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 16, title: 'Evaluasi Akhir Semester (UAS): Capstone Web System Defense', topicDescription: 'Sidang evaluasi akhir implementasi sistem web terintegrasi skala enterprise dengan kriteria performa dan keamanan tinggi.', type: 'FINAL_EXAM', status: 'SCHEDULED' }
  ],

  // --- D. CY101: Kriptografi & Keamanan Sistem Komputer ---
  CY101: [
    { num: 1, title: 'Pengantar Keamanan Informasi, Prinsip CIA Triad & Threat Modeling', topicDescription: 'Fondasi keamanan komputer, Confidentiality, Integrity, Availability, threat surface analysis, dan kerangka STRIDE.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 2, title: 'Matematika Kriptografi: Aljabar Modular, Bilangan Prima & GCD', topicDescription: 'Aritmatika modulo, teorema Fermat Kecil, algoritma Euclidean dan Extended Euclidean untuk penghitungan modular inverse.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 3, title: 'Kriptografi Klasik: Caesar, Vigenère & Transposition Ciphers', topicDescription: 'Sejarah kriptografi, substitusi monoalfabetik & polialfabetik, analisis frekuensi huruf, dan kelemahan cipher klasik.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 4, title: 'Kriptografi Simetrik Modern: Data Encryption Standard & AES', topicDescription: 'Struktur Feistel network, algoritma Rijndael / Advanced Encryption Standard (AES-128/256), SubBytes, dan MixColumns.', type: 'QUIZ', status: 'COMPLETED' },
    { num: 5, title: 'Mode Operasi Block Cipher: ECB, CBC, CFB, OFB & GCM', topicDescription: 'Kelemahan mode ECB, mekanisme CBC dengan Initialization Vector (IV), dan Authenticated Encryption GCM mode.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 6, title: 'Kriptografi Asimetrik: Diffie-Hellman Key Exchange & Algoritma RSA', topicDescription: 'Konsep public/private key, problem faktorisasi integer besar pada RSA, pembangkitan keypair, dan enkripsi asimetris.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 7, title: 'Cryptographic Hash Functions: SHA-256, SHA-3 & HMAC', topicDescription: 'Sifat one-way function, resistensi collision & preimage, konstruksi Merkle-Damgard, dan integritas pesan berbasis HMAC.', type: 'QUIZ', status: 'COMPLETED' },
    { num: 8, title: 'Evaluasi Tengah Semester (UTS): Kriptografi & Protokol Keamanan', topicDescription: 'Ujian komprehensif menguji penguasaan matematika kriptografi, implementasi AES/RSA, dan fungsi hash kriptografi.', type: 'MIDTERM_EXAM', status: 'COMPLETED' },
    { num: 9, title: 'Digital Signature, Sertifikat Digital X.509 & Public Key Infrastructure', topicDescription: 'Mekanisme tanda tangan digital ECDSA/RSA, struktur sertifikat standar ITU-T X.509, Certificate Authority, dan CRL/OCSP.', type: 'REGULAR', status: 'COMPLETED' },
    { num: 10, title: 'Protokol Transport Layer Security (TLS 1.3) & Handshake Analysis', topicDescription: 'Prosedur handshake TLS 1.3 terenkripsi, cipher suite negotiation, perfect forward secrecy (PFS), dan proteksi MiTM.', type: 'REGULAR', status: 'IN_PROGRESS' },
    { num: 11, title: 'Kerentanan Perangkat Lunak: Buffer Overflow, Memory Corruption & ASLR', topicDescription: 'Eksploitasi memory safety C/C++, overwrite return address, mitigasi Address Space Layout Randomization (ASLR) & DEP.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 12, title: 'Web Security: Cross-Site Scripting (XSS), SQLi & CSRF Mitigation', topicDescription: 'Anatomi serangan OWASP Top 10, sanitasi input kontekstual, Content Security Policy (CSP), dan SameSite cookies.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 13, title: 'Identity & Access Management: OAuth 2.0, OpenID Connect & JWT Security', topicDescription: 'Protokol otorisasi modern OAuth 2.0, token JWT (header, payload, signature), validasi claim, dan pencegahan token theft.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 14, title: 'Network Security, Firewall Rules, Intrusion Detection & Zero-Trust', topicDescription: 'Arsitektur keamanan jaringan perimeter vs Zero-Trust Architecture, paket filtering IPTables/UFW, dan IDS/IPS Suricata.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 15, title: 'Quantum Computing Threats & Post-Quantum Cryptography (PQC)', topicDescription: 'Dampak Algoritma Shor terhadap RSA/ECC, inisiatif standarisasi NIST PQC (Kyber, Dilithium), dan kriptografi masa depan.', type: 'REGULAR', status: 'SCHEDULED' },
    { num: 16, title: 'Evaluasi Akhir Semester (UAS): Penetrasi Sistem & Audit Kriptografi', topicDescription: 'Ujian komprehensif akhir mencakup evaluasi kerentanan keamanan perangkat lunak, konfigurasi TLS, dan audit kriptografi.', type: 'FINAL_EXAM', status: 'SCHEDULED' }
  ]
}

// ----------------------------------------------------------------------------
// 8. DATA MASTER KUIS & UJIAN LENGKAP DENGAN SOAL MULTIPLE CHOICE / ESSAY
// ----------------------------------------------------------------------------
export const quizMasterData: QuizDefinition[] = [
  {
    title: 'Kuis 1: ADT, Stack, dan Queue',
    sessionNum: 4,
    type: 'QUIZ',
    duration: 45,
    questions: [
      {
        id: 'q-k1-1',
        type: 'MULTIPLE_CHOICE',
        prompt: 'Struktur data manakah yang bekerja secara mutlak dengan prinsip First-In First-Out (FIFO)?',
        points: 50,
        options: [
          { id: 'opt-a', text: 'Stack' },
          { id: 'opt-b', text: 'Queue' },
          { id: 'opt-c', text: 'Priority Queue' },
          { id: 'opt-d', text: 'Binary Tree' }
        ],
        correctOptionId: 'opt-b',
        explanation: 'Queue bekerja dengan prinsip elemen yang pertama kali dimasukkan akan menjadi elemen pertama yang keluar (FIFO).'
      },
      {
        id: 'q-k1-2',
        type: 'MULTIPLE_CHOICE',
        prompt: 'Operasi pengambilan sekaligus penghapusan elemen teratas pada Stack disebut?',
        points: 50,
        options: [
          { id: 'opt-a', text: 'Push' },
          { id: 'opt-b', text: 'Enqueue' },
          { id: 'opt-c', text: 'Pop' },
          { id: 'opt-d', text: 'Dequeue' }
        ],
        correctOptionId: 'opt-c',
        explanation: 'Pop adalah operasi standar untuk mengambil dan menghapus elemen di posisi top stack.'
      }
    ]
  },
  {
    title: 'Kuis 2: Binary Search Tree & Balancing',
    sessionNum: 7,
    type: 'QUIZ',
    duration: 45,
    questions: [
      {
        id: 'q-k2-1',
        type: 'MULTIPLE_CHOICE',
        prompt: 'Berapakah kompleksitas waktu pencarian rata-rata pada Binary Search Tree yang seimbang secara sempurna?',
        points: 50,
        options: [
          { id: 'opt-a', text: 'O(1)' },
          { id: 'opt-b', text: 'O(log N)' },
          { id: 'opt-c', text: 'O(N)' },
          { id: 'opt-d', text: 'O(N log N)' }
        ],
        correctOptionId: 'opt-b',
        explanation: 'Pohon BST seimbang memiliki tinggi log N sehingga pencarian elemen rata-rata membutuhkan waktu O(log N).'
      },
      {
        id: 'q-k2-2',
        type: 'MULTIPLE_CHOICE',
        prompt: 'Operasi rotasi apa yang dibutuhkan jika terjadi ketidakseimbangan tipe Left-Right (LR) pada AVL Tree?',
        points: 50,
        options: [
          { id: 'opt-a', text: 'Single Right Rotation' },
          { id: 'opt-b', text: 'Left-Right Double Rotation' },
          { id: 'opt-c', text: 'Single Left Rotation' },
          { id: 'opt-d', text: 'Right-Left Double Rotation' }
        ],
        correctOptionId: 'opt-b',
        explanation: 'Kasus LR diselesaikan dengan rotasi tunggal ke kiri pada anak kiri, diikuti rotasi ke kanan pada simpul kakek.'
      }
    ]
  },
  {
    title: 'Ujian Tengah Semester (UTS): Struktur Data & Algoritma',
    sessionNum: 8,
    type: 'MIDTERM_EXAM',
    duration: 90,
    questions: [
      {
        id: 'q-uts-1',
        type: 'MULTIPLE_CHOICE',
        prompt: 'Algoritma pengurutan manakah yang memiliki jaminan batas atas terburuk O(N log N) dan tidak membutuhkan alokasi memori array tambahan O(N)?',
        points: 40,
        options: [
          { id: 'opt-a', text: 'Merge Sort' },
          { id: 'opt-b', text: 'Heap Sort' },
          { id: 'opt-c', text: 'Quick Sort' },
          { id: 'opt-d', text: 'Bubble Sort' }
        ],
        correctOptionId: 'opt-b',
        explanation: 'Heap Sort mengurutkan in-place dengan batas waktu terburuk O(N log N) tanpa alokasi memori tambahan seperti Merge Sort.'
      },
      {
        id: 'q-uts-2',
        type: 'ESSAY',
        prompt: 'Jelaskan perbedaan mendasar antara representasi Adjacency Matrix dan Adjacency List pada Graph dalam konteks efisiensi memori untuk sparse graph!',
        points: 60,
        rubric: 'Analisis kompleksitas ruang memori O(V^2) vs O(V+E) (30 poin), penjelasan kesimpulan efisiensi sparse graph (30 poin).'
      }
    ]
  }
]

// ----------------------------------------------------------------------------
// 9. DATA MASTER TUGAS PERKULIAHAN (ASSIGNMENTS)
// ----------------------------------------------------------------------------
export const assignmentMasterData: AssignmentDefinition[] = [
  {
    title: 'Tugas 1: Analisis Kompleksitas & Implementasi Linked List',
    sessionNum: 3,
    description: 'Implementasikan Singly & Doubly Linked List dengan operasi traversal, insertion O(1), dan deletion O(1).',
    instructions: 'Kumpulkan dalam format ZIP berisi source code TypeScript/Python dan laporan PDF analisis kompleksitas.',
    maxScore: '100.00'
  },
  {
    title: 'Tugas 2: Sistem Antrean Berbasis Priority Queue & BST',
    sessionNum: 6,
    description: 'Bangun simulasi scheduling task dengan Binary Search Tree dan hitung kedalaman maksimum tree secara asimptotik.',
    instructions: 'Sertakan script benchmarking pengujian 10.000 data acak dan analisa performa AVL balancing.',
    maxScore: '100.00'
  },
  {
    title: 'Tugas 3: Representasi Graph & Deteksi Siklus dengan DFS',
    sessionNum: 9,
    description: 'Implementasi algoritma deteksi cycle pada Directed Graph menggunakan pendekatan 3-color Depth-First Search.',
    instructions: 'Kumpulkan file zip kode program dan screenshot visualisasi lintasan siklus graf yang terdeteksi.',
    maxScore: '100.00'
  }
]

// ----------------------------------------------------------------------------
// 10. KONFIGURASI BOBOT GRADEBOOK RESMI INSTITUT TEKNOLOGI WAKANDA (TOTAL = 100%)
// ----------------------------------------------------------------------------
export const seedGradeWeights = [
  { componentName: 'ATTENDANCE' as const, weightPercentage: '10.00', description: 'Kehadiran minimum 75% syarat kelulusan' },
  { componentName: 'ASSIGNMENT' as const, weightPercentage: '20.00', description: 'Rata-rata akumulasi tugas mandiri & praktikum' },
  { componentName: 'QUIZ' as const, weightPercentage: '20.00', description: 'Akumulasi kuis berkala pengerjaan daring' },
  { componentName: 'MIDTERM_EXAM' as const, weightPercentage: '25.00', description: 'Evaluasi Tengah Semester (Pertemuan 8)' },
  { componentName: 'FINAL_EXAM' as const, weightPercentage: '25.00', description: 'Evaluasi Akhir Semester (Pertemuan 16)' }
]

// ----------------------------------------------------------------------------
// 11. DATA EVALUASI HISTORIS KELAS IF2041-A (UNTUK TELEMETRI EWS & DEMO AKUN)
// ----------------------------------------------------------------------------
export const if2041AttendanceTelemetry = {
  // Nakia Lupita: Selalu hadir (16/16 = 100%) -> EWS Aman (#16A34A)
  nakia: { status: 'PRESENT' as const, note: 'Hadir tepat waktu' },
  // M'Baku Jabari: 11 PRESENT, 1 LATE (P4), 1 SICK (P6), 3 ABSENT (P7, P10, P14) -> ~75-78% -> EWS Waspada (#D97706)
  mbakuRules: (sessionNum: number) => {
    if (sessionNum === 4) return { status: 'LATE' as const, method: 'TOKEN' as const, note: 'Terlambat 15 menit karena kendala transportasi' }
    if (sessionNum === 6) return { status: 'SICK' as const, method: 'MANUAL_LECTURER' as const, note: 'Izin sakit dengan surat dokter' }
    if ([7, 10, 14].includes(sessionNum)) return { status: 'ABSENT' as const, method: 'MANUAL_LECTURER' as const, note: 'Alpa tanpa keterangan' }
    return { status: 'PRESENT' as const, method: 'TOKEN' as const, note: 'Hadir' }
  },
  // N'Jadaka Erik: 8 sesi PRESENT, 8 sesi ABSENT -> 50% (<75%) -> EWS Kritis (#DC2626)
  erikRules: (sessionNum: number) => {
    if ([2, 4, 5, 7, 10, 11, 13, 15].includes(sessionNum)) return { status: 'ABSENT' as const, method: 'MANUAL_LECTURER' as const, note: 'Tidak hadir tanpa pemberitahuan' }
    return { status: 'PRESENT' as const, method: 'TOKEN' as const, note: 'Hadir' }
  },
  // Riri Williams: Selalu hadir via QR Scan (16/16 = 100%) -> Siap Pengujian Aktif
  riri: { status: 'PRESENT' as const, method: 'QR_SCAN' as const, note: 'Hadir via scan QR dinamis' }
}

export const if2041SubmissionsData = [
  // Nakia: 3/3 on-time (Avg 96.00)
  { assignIdx: 0, studentEmail: 'nakia@student.wakanda.ac.id', isLate: false, score: '96.00', status: 'GRADED' as const, feedback: 'Implementasi sangat bersih, modular, dan efisien.' },
  { assignIdx: 1, studentEmail: 'nakia@student.wakanda.ac.id', isLate: false, score: '94.00', status: 'GRADED' as const, feedback: 'AVL Tree balancing berjalan sempurna.' },
  { assignIdx: 2, studentEmail: 'nakia@student.wakanda.ac.id', isLate: false, score: '98.00', status: 'GRADED' as const, feedback: 'Penanganan edge case graph sangat teliti.' },
  // M'Baku: 1 on-time (75.00), 2 terlambat (68.00, 70.00) -> Avg 71.00
  { assignIdx: 0, studentEmail: 'mbaku@student.wakanda.ac.id', isLate: false, score: '75.00', status: 'GRADED' as const, feedback: 'Kode berjalan baik, namun perhatikan manajemen pointer.' },
  { assignIdx: 1, studentEmail: 'mbaku@student.wakanda.ac.id', isLate: true, score: '68.00', status: 'GRADED' as const, feedback: 'Pengumpulan terlambat 14 jam. Struktur tree belum diuji edge-case.' },
  { assignIdx: 2, studentEmail: 'mbaku@student.wakanda.ac.id', isLate: true, score: '70.00', status: 'GRADED' as const, feedback: 'Pengumpulan terlambat 8 jam. Format output graph perlu dirapikan.' },
  // Erik: 1 terlambat (45.00), 2 missing -> EWS Kritis
  { assignIdx: 0, studentEmail: 'erik@student.wakanda.ac.id', isLate: true, score: '45.00', status: 'GRADED' as const, feedback: 'Terlambat 2 hari. Program mengalami memory leak fatal.' },
  // Riri Williams: 3/3 on-time (Avg 90.00)
  { assignIdx: 0, studentEmail: 'riri@student.wakanda.ac.id', isLate: false, score: '90.00', status: 'GRADED' as const, feedback: 'Solusi elegan dan optimal.' },
  { assignIdx: 1, studentEmail: 'riri@student.wakanda.ac.id', isLate: false, score: '92.00', status: 'GRADED' as const, feedback: 'Kompleksitas O(log N) tercapai dengan baik.' },
  { assignIdx: 2, studentEmail: 'riri@student.wakanda.ac.id', isLate: false, score: '88.00', status: 'GRADED' as const, feedback: 'Bagus, siap untuk proyek implementasi tingkat lanjut.' }
]

export const if2041QuizAttemptsData = [
  // Nakia: Kuis1 95, Kuis2 92, UTS 94
  { quizIdx: 0, studentEmail: 'nakia@student.wakanda.ac.id', score: '95.00', autoScore: '95.00', manualScore: '0.00' },
  { quizIdx: 1, studentEmail: 'nakia@student.wakanda.ac.id', score: '92.00', autoScore: '92.00', manualScore: '0.00' },
  { quizIdx: 2, studentEmail: 'nakia@student.wakanda.ac.id', score: '94.00', autoScore: '40.00', manualScore: '54.00' },
  // M'Baku: Kuis1 65, Kuis2 60, UTS 62
  { quizIdx: 0, studentEmail: 'mbaku@student.wakanda.ac.id', score: '65.00', autoScore: '65.00', manualScore: '0.00' },
  { quizIdx: 1, studentEmail: 'mbaku@student.wakanda.ac.id', score: '60.00', autoScore: '60.00', manualScore: '0.00' },
  { quizIdx: 2, studentEmail: 'mbaku@student.wakanda.ac.id', score: '62.00', autoScore: '25.00', manualScore: '37.00' },
  // Erik: Kuis1 35, Kuis2 40, UTS 42
  { quizIdx: 0, studentEmail: 'erik@student.wakanda.ac.id', score: '35.00', autoScore: '35.00', manualScore: '0.00' },
  { quizIdx: 1, studentEmail: 'erik@student.wakanda.ac.id', score: '40.00', autoScore: '40.00', manualScore: '0.00' },
  { quizIdx: 2, studentEmail: 'erik@student.wakanda.ac.id', score: '42.00', autoScore: '20.00', manualScore: '22.00' },
  // Riri: Kuis1 88, Kuis2 90, UTS 89
  { quizIdx: 0, studentEmail: 'riri@student.wakanda.ac.id', score: '88.00', autoScore: '88.00', manualScore: '0.00' },
  { quizIdx: 1, studentEmail: 'riri@student.wakanda.ac.id', score: '90.00', autoScore: '90.00', manualScore: '0.00' },
  { quizIdx: 2, studentEmail: 'riri@student.wakanda.ac.id', score: '89.00', autoScore: '40.00', manualScore: '49.00' }
]

export const if2041FinalGradesData = [
  {
    studentEmail: 'nakia@student.wakanda.ac.id',
    attendanceScore: '100.00',
    assignmentScore: '96.00',
    quizScore: '93.50',
    midtermScore: '94.00',
    finalExamScore: '92.00',
    totalScore: '94.40',
    letterGrade: 'A' as const,
    gradePoint: '4.00',
    status: 'PUBLISHED' as const
  },
  {
    studentEmail: 'mbaku@student.wakanda.ac.id',
    attendanceScore: '77.80',
    assignmentScore: '71.00',
    quizScore: '62.50',
    midtermScore: '62.00',
    finalExamScore: '65.00',
    totalScore: '66.23',
    letterGrade: 'BC' as const,
    gradePoint: '2.50',
    status: 'DRAFT' as const
  },
  {
    studentEmail: 'erik@student.wakanda.ac.id',
    attendanceScore: '55.60',
    assignmentScore: '15.00',
    quizScore: '37.50',
    midtermScore: '42.00',
    finalExamScore: '0.00',
    totalScore: '26.56',
    letterGrade: 'E' as const,
    gradePoint: '0.00',
    status: 'DRAFT' as const
  },
  {
    studentEmail: 'riri@student.wakanda.ac.id',
    attendanceScore: '100.00',
    assignmentScore: '90.00',
    quizScore: '89.00',
    midtermScore: '89.00',
    finalExamScore: '91.00',
    totalScore: '90.80',
    letterGrade: 'A' as const,
    gradePoint: '4.00',
    status: 'DRAFT' as const
  }
]

export const sampleMaterialsData = [
  {
    sessionNum: 1,
    title: 'Slide 01: Analisis Asimptotik & Big-O Notation',
    materialType: 'SLIDE' as const,
    fileName: 'Pertemuan_01_Kompleksitas.pdf',
    fileUrl: '/materials/pertemuan_01.pdf'
  },
  {
    sessionNum: 2,
    title: 'Code 02: Alokasi Memori Pointer C++/TypeScript',
    materialType: 'CODE' as const,
    fileName: 'pointer_memory.zip',
    fileUrl: '/materials/pointer_memory.zip'
  },
  {
    sessionNum: 3,
    title: 'Slide 03: Singly & Doubly Linked List',
    materialType: 'SLIDE' as const,
    fileName: 'Pertemuan_03_LinkedList.pdf',
    fileUrl: '/materials/pertemuan_03.pdf'
  }
]


// ============================================================================
// BAGIAN KEDUA (PENUTUP) - EXTENSION DATA UNTUK PART 2 SEEDER
// ============================================================================

// ----------------------------------------------------------------------------
// 12. TOKEN PRESENSI P-10 UNTUK SELURUH 5 KELAS AKTIF (Aktif 24 Jam)
// ----------------------------------------------------------------------------
export const attendanceTokensP10: Record<string, { pin: string; lecturerEmail: string }> = {
  'IF2041:A': { pin: '481920', lecturerEmail: 'shuri@lecturer.wakanda.ac.id' },
  'IF2041:B': { pin: '592831', lecturerEmail: 'tchalla@lecturer.wakanda.ac.id' },
  'IF202:A':  { pin: '318492', lecturerEmail: 'shuri@lecturer.wakanda.ac.id' },
  'IF302:A':  { pin: '729401', lecturerEmail: 'tchalla@lecturer.wakanda.ac.id' },
  'CY101:A':  { pin: '641829', lecturerEmail: 'wkabi@lecturer.wakanda.ac.id' }
}

// ----------------------------------------------------------------------------
// 13. PROFIL KEHADIRAN MAHASISWA PENDUKUNG (14 Mahasiswa)
//     Distribusi EWS Kontras Natural untuk Realisme Institusional
// ----------------------------------------------------------------------------
export interface StudentAttendanceProfile {
  email: string
  ewsLevel: 'SAFE' | 'WARNING' | 'CRITICAL'
  absentSessions: number[] // Session numbers di mana mahasiswa ABSEN
  lateSessions: number[]   // Session numbers di mana mahasiswa TERLAMBAT
  sickSessions: number[]   // Session numbers di mana mahasiswa SAKIT
}

export const supportingStudentAttendanceProfiles: StudentAttendanceProfile[] = [
  // === EWS AMAN (≥80% dari 16 sesi = ≥13 hadir) ===
  {
    email: 'okoye@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    absentSessions: [],
    lateSessions: [3],
    sickSessions: []
  },
  {
    email: 'ramonda@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    absentSessions: [],
    lateSessions: [],
    sickSessions: [5]
  },
  {
    email: 'zuri@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    absentSessions: [9],
    lateSessions: [4],
    sickSessions: []
  },
  {
    email: 'griot@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    absentSessions: [7],
    lateSessions: [2],
    sickSessions: []
  },
  {
    email: 'kaluu@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    absentSessions: [5],
    lateSessions: [],
    sickSessions: [9]
  },

  // === EWS WASPADA (75-79% dari 16 sesi) ===
  {
    email: 'ayo@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    absentSessions: [3, 6],
    lateSessions: [4],
    sickSessions: []
  },
  {
    email: 'bucky@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    absentSessions: [5, 8],
    lateSessions: [3],
    sickSessions: [7]
  },
  {
    email: 'sam@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    absentSessions: [4, 7, 9],
    lateSessions: [6],
    sickSessions: []
  },
  {
    email: 'taku@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    absentSessions: [2, 6, 9],
    lateSessions: [],
    sickSessions: [4]
  },
  {
    email: 'zawavari@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    absentSessions: [3, 7],
    lateSessions: [5],
    sickSessions: [8]
  },

  // === EWS KRITIS (<75% dari 16 sesi) ===
  {
    email: 'aneka@student.wakanda.ac.id',
    ewsLevel: 'CRITICAL',
    absentSessions: [1, 2, 5, 7, 8],
    lateSessions: [],
    sickSessions: []
  },
  {
    email: 'attuma@student.wakanda.ac.id',
    ewsLevel: 'CRITICAL',
    absentSessions: [2, 4, 6, 8, 9],
    lateSessions: [],
    sickSessions: []
  },
  {
    email: 'namora@student.wakanda.ac.id',
    ewsLevel: 'CRITICAL',
    absentSessions: [1, 3, 5, 6, 8],
    lateSessions: [],
    sickSessions: []
  },
  {
    email: 'nomble@student.wakanda.ac.id',
    ewsLevel: 'CRITICAL',
    absentSessions: [2, 3, 7, 8, 9],
    lateSessions: [],
    sickSessions: []
  }
]

// ----------------------------------------------------------------------------
// 14. TUGAS PERKULIAHAN PER MATA KULIAH (3 Tugas per Kelas, 4 kelas lainnya)
// ----------------------------------------------------------------------------
export interface ClassAssignmentConfig {
  classKey: string
  lecturerEmail: string
  assignments: AssignmentDefinition[]
}

export const classAssignmentsConfig: ClassAssignmentConfig[] = [
  // IF2041-B
  {
    classKey: 'IF2041:B',
    lecturerEmail: 'tchalla@lecturer.wakanda.ac.id',
    assignments: [
      {
        title: 'Tugas 1 IF2041-B: Implementasi ADT Linked List',
        sessionNum: 3,
        description: 'Implementasikan Singly, Doubly, dan Circular Linked List dengan kompleksitas operasi O(1) untuk insertion dan deletion.',
        instructions: 'Kumpulkan format ZIP berisi source code Python/TypeScript dan laporan analisis Big-O.',
        maxScore: '100.00'
      },
      {
        title: 'Tugas 2 IF2041-B: BST dan Traversal Tree',
        sessionNum: 6,
        description: 'Implementasikan Binary Search Tree dengan semua operasi traversal: pre-order, in-order, dan post-order.',
        instructions: 'Sertakan unit test untuk setiap operasi dan visualisasi pohon dalam format ASCII.',
        maxScore: '100.00'
      },
      {
        title: 'Tugas 3 IF2041-B: Implementasi Graph dengan Algoritma Traversal',
        sessionNum: 9,
        description: 'Implementasikan representasi graph menggunakan adjacency list dan terapkan BFS serta DFS.',
        instructions: 'Visualisasikan hasil traversal dan hitung kompleksitas waktu dan ruang implementasi.',
        maxScore: '100.00'
      }
    ]
  },
  // IF202-A
  {
    classKey: 'IF202:A',
    lecturerEmail: 'shuri@lecturer.wakanda.ac.id',
    assignments: [
      {
        title: 'Tugas 1 IF202: Desain ERD & Normalisasi Skema Database',
        sessionNum: 3,
        description: 'Rancang Entity Relationship Diagram untuk sistem informasi perpustakaan digital dan normalisasikan hingga 3NF.',
        instructions: 'Gunakan tools draw.io atau dbdiagram.io, export PDF beserta laporan normalisasi step-by-step.',
        maxScore: '100.00'
      },
      {
        title: 'Tugas 2 IF202: Advanced SQL Query & Optimasi Index',
        sessionNum: 6,
        description: 'Tulis 10 kueri SQL kompleks menggunakan JOIN, CTE, Window Function, dan tunjukkan perbandingan EXPLAIN ANALYZE dengan/tanpa index.',
        instructions: 'Jalankan query di PostgreSQL, screenshot EXPLAIN ANALYZE output, dan analisis query plan.',
        maxScore: '100.00'
      },
      {
        title: 'Tugas 3 IF202: Implementasi ORM dengan Drizzle & Migrasi Schema',
        sessionNum: 9,
        description: 'Buat mini-project TypeScript menggunakan Drizzle ORM dengan skema 5 tabel, relasi, dan 3 migrasi database terstruktur.',
        instructions: 'Sertakan README instruksi setup, file migrasi drizzle-kit, dan seed data 20 baris per tabel.',
        maxScore: '100.00'
      }
    ]
  },
  // IF302-A
  {
    classKey: 'IF302:A',
    lecturerEmail: 'tchalla@lecturer.wakanda.ac.id',
    assignments: [
      {
        title: 'Tugas 1 IF302: Nuxt 3 Project Setup & File-System Routing',
        sessionNum: 3,
        description: 'Buat aplikasi Nuxt 3 dengan minimal 5 halaman berbeda menggunakan file-system routing dan satu layout dinamis.',
        instructions: 'Push ke GitHub repository, deploy ke Netlify/Vercel, sertakan README dan link deploy.',
        maxScore: '100.00'
      },
      {
        title: 'Tugas 2 IF302: REST API dengan Nitro & Pinia State Management',
        sessionNum: 6,
        description: 'Implementasikan 3 endpoint REST API menggunakan Nitro server routes, integrasikan dengan Pinia store di frontend.',
        instructions: 'Dokumentasikan API menggunakan komentar JSDoc, sertakan screenshot alur data request-response.',
        maxScore: '100.00'
      },
      {
        title: 'Tugas 3 IF302: Authentication System & Protected Routes',
        sessionNum: 9,
        description: 'Implementasikan sistem autentikasi lengkap: registrasi, login, session cookie, middleware proteksi rute, dan logout.',
        instructions: 'Gunakan bcrypt untuk hashing password, implementasikan rate limiting, dan tulis 5 test case.',
        maxScore: '100.00'
      }
    ]
  },
  // CY101-A
  {
    classKey: 'CY101:A',
    lecturerEmail: 'wkabi@lecturer.wakanda.ac.id',
    assignments: [
      {
        title: 'Tugas 1 CY101: Implementasi Caesar & Vigenère Cipher',
        sessionNum: 3,
        description: 'Implementasikan Caesar Cipher dan Vigenère Cipher dengan fungsi enkripsi, dekripsi, dan analisis frekuensi kriptanalisis.',
        instructions: 'Gunakan Python atau TypeScript, sertakan contoh teks 100 karakter dengan validasi output enkripsi/dekripsi.',
        maxScore: '100.00'
      },
      {
        title: 'Tugas 2 CY101: Implementasi AES-256 & Mode Operasi CBC',
        sessionNum: 6,
        description: 'Implementasikan enkripsi AES-256 dengan mode CBC menggunakan library kriptografi dan tunjukkan kelemahan mode ECB.',
        instructions: 'Enkripsi pesan 500 karakter, perbandingan visual output ECB vs CBC, laporan analisis pola.',
        maxScore: '100.00'
      },
      {
        title: 'Tugas 3 CY101: PKI Simulation - RSA Keypair & Digital Signature',
        sessionNum: 9,
        description: 'Simulasikan Public Key Infrastructure dengan pembangkitan keypair RSA-2048, enkripsi/dekripsi asimetrik, dan tanda tangan digital.',
        instructions: 'Gunakan library openssl atau node-forge, demonstrasikan verify signature, sertakan analisis keamanan.',
        maxScore: '100.00'
      }
    ]
  }
]

// ----------------------------------------------------------------------------
// 15. KONFIGURASI KUIS PER KELAS (selain IF2041-A yang sudah ada)
// ----------------------------------------------------------------------------
export interface ClassQuizConfig {
  classKey: string
  lecturerEmail: string
  quizzes: QuizDefinition[]
}

export const classQuizzesConfig: ClassQuizConfig[] = [
  // IF2041-B
  {
    classKey: 'IF2041:B',
    lecturerEmail: 'tchalla@lecturer.wakanda.ac.id',
    quizzes: [
      {
        title: 'Kuis 1 IF2041-B: Stack & Queue',
        sessionNum: 4,
        type: 'QUIZ',
        duration: 45,
        questions: [
          {
            id: 'q-b-k1-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Operasi manakah yang digunakan untuk menambahkan elemen ke dalam Stack?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'Push' },
              { id: 'opt-b', text: 'Enqueue' },
              { id: 'opt-c', text: 'Insert' },
              { id: 'opt-d', text: 'Add' }
            ],
            correctOptionId: 'opt-a',
            explanation: 'Push adalah operasi standar untuk menambahkan elemen ke puncak (top) Stack.'
          },
          {
            id: 'q-b-k1-2',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Kompleksitas waktu operasi Enqueue dan Dequeue pada Queue berbasis linked list adalah?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'O(N)' },
              { id: 'opt-b', text: 'O(log N)' },
              { id: 'opt-c', text: 'O(1)' },
              { id: 'opt-d', text: 'O(N²)' }
            ],
            correctOptionId: 'opt-c',
            explanation: 'Dengan menjaga pointer head dan tail, Enqueue dan Dequeue berjalan dalam O(1) konstan.'
          }
        ]
      },
      {
        title: 'Kuis 2 IF2041-B: Tree & Rekursi',
        sessionNum: 7,
        type: 'QUIZ',
        duration: 45,
        questions: [
          {
            id: 'q-b-k2-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Traversal Binary Tree manakah yang mengunjungi simpul dalam urutan Left → Root → Right?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'Pre-order' },
              { id: 'opt-b', text: 'In-order' },
              { id: 'opt-c', text: 'Post-order' },
              { id: 'opt-d', text: 'Level-order' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'In-order traversal mengunjungi Left subtree, kemudian Root, kemudian Right subtree.'
          },
          {
            id: 'q-b-k2-2',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Berapa tinggi BST yang menyimpan N kunci dalam kasus terbaik (perfectly balanced)?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'N' },
              { id: 'opt-b', text: 'N/2' },
              { id: 'opt-c', text: 'log₂(N)' },
              { id: 'opt-d', text: '√N' }
            ],
            correctOptionId: 'opt-c',
            explanation: 'Dalam BST yang seimbang sempurna, tinggi pohon adalah log₂(N).'
          }
        ]
      },
      {
        title: 'UTS IF2041-B: Struktur Data & Algoritma',
        sessionNum: 8,
        type: 'MIDTERM_EXAM',
        duration: 90,
        questions: [
          {
            id: 'q-b-uts-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Algoritma pengurutan dengan kompleksitas O(N²) dalam kasus terburuk namun O(N log N) rata-rata dan umumnya tercepat di praktik?',
            points: 40,
            options: [
              { id: 'opt-a', text: 'Bubble Sort' },
              { id: 'opt-b', text: 'Merge Sort' },
              { id: 'opt-c', text: 'Quick Sort' },
              { id: 'opt-d', text: 'Insertion Sort' }
            ],
            correctOptionId: 'opt-c',
            explanation: 'Quick Sort memiliki average case O(N log N) dengan cache performance yang sangat baik.'
          },
          {
            id: 'q-b-uts-2',
            type: 'ESSAY',
            prompt: 'Jelaskan konsep rekursi dan berikan contoh implementasi fungsi Fibonacci rekursif beserta analisis kompleksitasnya!',
            points: 60,
            rubric: 'Definisi rekursi yang tepat (20 poin), implementasi fungsi Fibonacci (20 poin), analisis kompleksitas O(2^N) dan optimasi memoization (20 poin).'
          }
        ]
      }
    ]
  },

  // IF202-A
  {
    classKey: 'IF202:A',
    lecturerEmail: 'shuri@lecturer.wakanda.ac.id',
    quizzes: [
      {
        title: 'Kuis 1 IF202: DDL & Integritas Data',
        sessionNum: 4,
        type: 'QUIZ',
        duration: 45,
        questions: [
          {
            id: 'q-db-k1-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Constraint mana yang memastikan nilai pada suatu kolom selalu UNIK dan BUKAN NULL?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'FOREIGN KEY' },
              { id: 'opt-b', text: 'PRIMARY KEY' },
              { id: 'opt-c', text: 'CHECK' },
              { id: 'opt-d', text: 'DEFAULT' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'PRIMARY KEY secara implisit menerapkan NOT NULL dan UNIQUE pada kolom yang ditentukan.'
          },
          {
            id: 'q-db-k1-2',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Pada bentuk normal manakah setiap atribut non-kunci harus bergantung penuh pada seluruh primary key komposit?',
            points: 50,
            options: [
              { id: 'opt-a', text: '1NF' },
              { id: 'opt-b', text: '2NF' },
              { id: 'opt-c', text: '3NF' },
              { id: 'opt-d', text: 'BCNF' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'Bentuk Normal Kedua (2NF) mensyaratkan setiap atribut non-kunci bergantung penuh pada keseluruhan primary key.'
          }
        ]
      },
      {
        title: 'Kuis 2 IF202: SQL Advanced & Indexing',
        sessionNum: 7,
        type: 'QUIZ',
        duration: 45,
        questions: [
          {
            id: 'q-db-k2-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Fungsi window SQL manakah yang mengembalikan peringkat tanpa celah (gap) untuk nilai yang sama?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'RANK()' },
              { id: 'opt-b', text: 'ROW_NUMBER()' },
              { id: 'opt-c', text: 'DENSE_RANK()' },
              { id: 'opt-d', text: 'NTILE()' }
            ],
            correctOptionId: 'opt-c',
            explanation: 'DENSE_RANK() memberikan peringkat berurutan tanpa celah, berbeda dengan RANK() yang membiarkan celah untuk nilai duplikat.'
          },
          {
            id: 'q-db-k2-2',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Jenis index PostgreSQL manakah yang paling efisien untuk kueri pencarian exact-match pada kolom teks?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'GiST Index' },
              { id: 'opt-b', text: 'B-Tree Index' },
              { id: 'opt-c', text: 'Hash Index' },
              { id: 'opt-d', text: 'BRIN Index' }
            ],
            correctOptionId: 'opt-c',
            explanation: 'Hash Index sangat efisien untuk operasi equality (=) namun tidak mendukung range query.'
          }
        ]
      },
      {
        title: 'UTS IF202: Basis Data Relasional',
        sessionNum: 8,
        type: 'MIDTERM_EXAM',
        duration: 90,
        questions: [
          {
            id: 'q-db-uts-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Sifat transaksi database manakah yang menjamin bahwa perubahan yang sudah di-commit tidak hilang meskipun terjadi system crash?',
            points: 40,
            options: [
              { id: 'opt-a', text: 'Atomicity' },
              { id: 'opt-b', text: 'Consistency' },
              { id: 'opt-c', text: 'Isolation' },
              { id: 'opt-d', text: 'Durability' }
            ],
            correctOptionId: 'opt-d',
            explanation: 'Durability menjamin bahwa transaksi yang telah berhasil di-commit akan tetap tersimpan secara permanen.'
          },
          {
            id: 'q-db-uts-2',
            type: 'ESSAY',
            prompt: 'Jelaskan perbedaan antara LEFT JOIN, RIGHT JOIN, dan INNER JOIN beserta kapan masing-masing digunakan!',
            points: 60,
            rubric: 'Definisi INNER JOIN (20 poin), LEFT JOIN dengan penanganan NULL (20 poin), skenario penggunaan tepat (20 poin).'
          }
        ]
      }
    ]
  },

  // IF302-A
  {
    classKey: 'IF302:A',
    lecturerEmail: 'tchalla@lecturer.wakanda.ac.id',
    quizzes: [
      {
        title: 'Kuis 1 IF302: Nuxt 3 & Pinia',
        sessionNum: 4,
        type: 'QUIZ',
        duration: 45,
        questions: [
          {
            id: 'q-web-k1-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Folder manakah dalam Nuxt 3 yang digunakan untuk mendefinisikan Server API endpoint secara otomatis?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'server/routes/' },
              { id: 'opt-b', text: 'server/api/' },
              { id: 'opt-c', text: 'api/handlers/' },
              { id: 'opt-d', text: 'server/endpoints/' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'Nuxt 3 secara otomatis mendaftarkan file di folder server/api/ sebagai API endpoint.'
          },
          {
            id: 'q-web-k1-2',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Composable Pinia manakah yang digunakan untuk mendefinisikan sebuah store?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'createStore()' },
              { id: 'opt-b', text: 'defineStore()' },
              { id: 'opt-c', text: 'useStore()' },
              { id: 'opt-d', text: 'newStore()' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'defineStore() adalah API utama Pinia untuk mendefinisikan store dengan id unik, state, getters, dan actions.'
          }
        ]
      },
      {
        title: 'Kuis 2 IF302: TypeScript & Nitro API',
        sessionNum: 7,
        type: 'QUIZ',
        duration: 45,
        questions: [
          {
            id: 'q-web-k2-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Keyword TypeScript manakah yang digunakan untuk mendefinisikan tipe yang bisa berupa salah satu dari beberapa tipe?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'interface' },
              { id: 'opt-b', text: 'type (union dengan |)' },
              { id: 'opt-c', text: 'enum' },
              { id: 'opt-d', text: 'class' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'Union type dengan operator pipe (|) memungkinkan sebuah nilai memiliki lebih dari satu tipe alternatif.'
          },
          {
            id: 'q-web-k2-2',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Utility Nuxt 3 manakah yang digunakan untuk membaca query parameter dari URL di server handler?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'getQuery(event)' },
              { id: 'opt-b', text: 'readBody(event)' },
              { id: 'opt-c', text: 'getRouterParam(event)' },
              { id: 'opt-d', text: 'getRequestHeaders(event)' }
            ],
            correctOptionId: 'opt-a',
            explanation: 'getQuery(event) mengekstrak semua query parameter dari URL request di server event handler Nitro.'
          }
        ]
      },
      {
        title: 'UTS IF302: Full-Stack Web Development',
        sessionNum: 8,
        type: 'MIDTERM_EXAM',
        duration: 90,
        questions: [
          {
            id: 'q-web-uts-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Perbedaan utama antara Server-Side Rendering (SSR) dan Static Site Generation (SSG) dalam konteks Nuxt 3 adalah?',
            points: 40,
            options: [
              { id: 'opt-a', text: 'SSR menghasilkan HTML statis, SSG merender di server saat request' },
              { id: 'opt-b', text: 'SSR merender HTML di server saat setiap request, SSG menghasilkan HTML saat build time' },
              { id: 'opt-c', text: 'SSR hanya untuk halaman dinamis, SSG tidak mendukung data fetching' },
              { id: 'opt-d', text: 'SSR dan SSG tidak memiliki perbedaan signifikan' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'SSR merender setiap request di server (data selalu fresh), SSG menghasilkan HTML statis saat build.'
          },
          {
            id: 'q-web-uts-2',
            type: 'ESSAY',
            prompt: 'Jelaskan arsitektur sistem autentikasi berbasis session cookie dalam aplikasi Nuxt 3 beserta langkah-langkah keamanan yang perlu diterapkan!',
            points: 60,
            rubric: 'Alur login-session-logout (20 poin), atribut cookie HttpOnly, Secure, SameSite (20 poin), proteksi CSRF dan middleware rute (20 poin).'
          }
        ]
      }
    ]
  },

  // CY101-A
  {
    classKey: 'CY101:A',
    lecturerEmail: 'wkabi@lecturer.wakanda.ac.id',
    quizzes: [
      {
        title: 'Kuis 1 CY101: Kriptografi Klasik & Simetrik',
        sessionNum: 4,
        type: 'QUIZ',
        duration: 45,
        questions: [
          {
            id: 'q-cy-k1-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Kelemahan utama Cipher Vigenère yang membuatnya rentan terhadap Kasiski examination adalah?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'Kunci terlalu panjang' },
              { id: 'opt-b', text: 'Pengulangan pola kunci menciptakan periodisitas yang dapat dieksploitasi' },
              { id: 'opt-c', text: 'Hanya menggunakan substitusi tunggal' },
              { id: 'opt-d', text: 'Tidak mendukung huruf kapital' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'Vigenère mengulang kunci, menciptakan pola yang dapat dideteksi melalui Kasiski test atau Indeks of Coincidence.'
          },
          {
            id: 'q-cy-k1-2',
            type: 'MULTIPLE_CHOICE',
            prompt: 'AES-256 menggunakan berapa putaran (rounds) enkripsi?',
            points: 50,
            options: [
              { id: 'opt-a', text: '10 rounds' },
              { id: 'opt-b', text: '12 rounds' },
              { id: 'opt-c', text: '14 rounds' },
              { id: 'opt-d', text: '16 rounds' }
            ],
            correctOptionId: 'opt-c',
            explanation: 'AES-128 = 10 rounds, AES-192 = 12 rounds, AES-256 = 14 rounds enkripsi.'
          }
        ]
      },
      {
        title: 'Kuis 2 CY101: RSA & Hash Functions',
        sessionNum: 7,
        type: 'QUIZ',
        duration: 45,
        questions: [
          {
            id: 'q-cy-k2-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Properti kriptografi hash manakah yang menjamin bahwa tidak mungkin menemukan dua input berbeda yang menghasilkan hash yang sama?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'Pre-image resistance' },
              { id: 'opt-b', text: 'Second pre-image resistance' },
              { id: 'opt-c', text: 'Collision resistance' },
              { id: 'opt-d', text: 'Avalanche effect' }
            ],
            correctOptionId: 'opt-c',
            explanation: 'Collision resistance menjamin tidak ada dua pesan berbeda yang bisa menghasilkan nilai hash yang identik.'
          },
          {
            id: 'q-cy-k2-2',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Keamanan RSA bergantung pada kesulitan komputasional dari masalah matematika apa?',
            points: 50,
            options: [
              { id: 'opt-a', text: 'Discrete logarithm problem' },
              { id: 'opt-b', text: 'Integer factorization problem' },
              { id: 'opt-c', text: 'Shortest vector problem' },
              { id: 'opt-d', text: 'Elliptic curve discrete log' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'RSA bergantung pada sulitnya memfaktorkan bilangan bulat besar N = p × q menjadi faktor prima p dan q.'
          }
        ]
      },
      {
        title: 'UTS CY101: Kriptografi & Keamanan Sistem',
        sessionNum: 8,
        type: 'MIDTERM_EXAM',
        duration: 90,
        questions: [
          {
            id: 'q-cy-uts-1',
            type: 'MULTIPLE_CHOICE',
            prompt: 'Dalam protokol TLS, proses negosiasi cipher suite dan pertukaran kunci terjadi pada fase apa?',
            points: 40,
            options: [
              { id: 'opt-a', text: 'Application Data Phase' },
              { id: 'opt-b', text: 'TLS Handshake Protocol' },
              { id: 'opt-c', text: 'Record Layer Protocol' },
              { id: 'opt-d', text: 'Alert Protocol' }
            ],
            correctOptionId: 'opt-b',
            explanation: 'TLS Handshake Protocol menangani autentikasi server/klien, negosiasi cipher suite, dan pembangkitan session key.'
          },
          {
            id: 'q-cy-uts-2',
            type: 'ESSAY',
            prompt: 'Jelaskan bagaimana Digital Signature bekerja menggunakan kriptografi asimetrik dan apa yang ia jamin dalam komunikasi digital!',
            points: 60,
            rubric: 'Proses penandatanganan menggunakan private key (20 poin), verifikasi menggunakan public key (20 poin), jaminan authenticity, integrity, dan non-repudiation (20 poin).'
          }
        ]
      }
    ]
  }
]

// ----------------------------------------------------------------------------
// 16. PROFIL NILAI FINAL GRADE DISTRIBUSI NATURAL UNTUK 14 MAHASISWA PENDUKUNG
// ----------------------------------------------------------------------------
export interface StudentFinalGradeProfile {
  email: string
  ewsLevel: 'SAFE' | 'WARNING' | 'CRITICAL'
  attendanceScore: string
  assignmentScore: string
  quizScore: string
  midtermScore: string
  finalExamScore: string
  totalScore: string
  letterGrade: 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'E'
  gradePoint: string
  status: 'DRAFT' | 'PUBLISHED'
}

export const supportingStudentGradeProfiles: StudentFinalGradeProfile[] = [
  // === EWS AMAN: Nilai Baik (A/AB) ===
  {
    email: 'okoye@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    attendanceScore: '100.00',
    assignmentScore: '91.00',
    quizScore: '89.00',
    midtermScore: '88.00',
    finalExamScore: '90.00',
    totalScore: '90.50',
    letterGrade: 'A',
    gradePoint: '4.00',
    status: 'DRAFT'
  },
  {
    email: 'ramonda@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    attendanceScore: '100.00',
    assignmentScore: '94.00',
    quizScore: '91.00',
    midtermScore: '92.00',
    finalExamScore: '93.00',
    totalScore: '93.25',
    letterGrade: 'A',
    gradePoint: '4.00',
    status: 'DRAFT'
  },
  {
    email: 'zuri@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    attendanceScore: '93.80',
    assignmentScore: '88.00',
    quizScore: '85.00',
    midtermScore: '87.00',
    finalExamScore: '86.00',
    totalScore: '87.23',
    letterGrade: 'A',
    gradePoint: '4.00',
    status: 'DRAFT'
  },
  {
    email: 'griot@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    attendanceScore: '93.80',
    assignmentScore: '92.00',
    quizScore: '90.00',
    midtermScore: '91.00',
    finalExamScore: '89.00',
    totalScore: '90.78',
    letterGrade: 'A',
    gradePoint: '4.00',
    status: 'DRAFT'
  },
  {
    email: 'kaluu@student.wakanda.ac.id',
    ewsLevel: 'SAFE',
    attendanceScore: '93.80',
    assignmentScore: '84.00',
    quizScore: '82.00',
    midtermScore: '80.00',
    finalExamScore: '83.00',
    totalScore: '83.33',
    letterGrade: 'AB',
    gradePoint: '3.50',
    status: 'DRAFT'
  },

  // === EWS WASPADA: Nilai Menengah (B/BC) ===
  {
    email: 'ayo@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    attendanceScore: '87.50',
    assignmentScore: '75.00',
    quizScore: '72.00',
    midtermScore: '71.00',
    finalExamScore: '73.00',
    totalScore: '74.15',
    letterGrade: 'B',
    gradePoint: '3.00',
    status: 'DRAFT'
  },
  {
    email: 'bucky@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    attendanceScore: '87.50',
    assignmentScore: '72.00',
    quizScore: '68.00',
    midtermScore: '70.00',
    finalExamScore: '71.00',
    totalScore: '72.00',
    letterGrade: 'B',
    gradePoint: '3.00',
    status: 'DRAFT'
  },
  {
    email: 'sam@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    attendanceScore: '81.30',
    assignmentScore: '68.00',
    quizScore: '65.00',
    midtermScore: '64.00',
    finalExamScore: '66.00',
    totalScore: '67.23',
    letterGrade: 'BC',
    gradePoint: '2.50',
    status: 'DRAFT'
  },
  {
    email: 'taku@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    attendanceScore: '81.30',
    assignmentScore: '70.00',
    quizScore: '67.00',
    midtermScore: '68.00',
    finalExamScore: '69.00',
    totalScore: '69.78',
    letterGrade: 'BC',
    gradePoint: '2.50',
    status: 'DRAFT'
  },
  {
    email: 'zawavari@student.wakanda.ac.id',
    ewsLevel: 'WARNING',
    attendanceScore: '87.50',
    assignmentScore: '73.00',
    quizScore: '71.00',
    midtermScore: '72.00',
    finalExamScore: '74.00',
    totalScore: '74.05',
    letterGrade: 'B',
    gradePoint: '3.00',
    status: 'DRAFT'
  },

  // === EWS KRITIS: Diskualifikasi UAS → E ===
  {
    email: 'aneka@student.wakanda.ac.id',
    ewsLevel: 'CRITICAL',
    attendanceScore: '68.75',
    assignmentScore: '48.00',
    quizScore: '42.00',
    midtermScore: '45.00',
    finalExamScore: '0.00',
    totalScore: '36.13',
    letterGrade: 'E',
    gradePoint: '0.00',
    status: 'DRAFT'
  },
  {
    email: 'attuma@student.wakanda.ac.id',
    ewsLevel: 'CRITICAL',
    attendanceScore: '68.75',
    assignmentScore: '50.00',
    quizScore: '44.00',
    midtermScore: '48.00',
    finalExamScore: '0.00',
    totalScore: '37.68',
    letterGrade: 'E',
    gradePoint: '0.00',
    status: 'DRAFT'
  },
  {
    email: 'namora@student.wakanda.ac.id',
    ewsLevel: 'CRITICAL',
    attendanceScore: '68.75',
    assignmentScore: '52.00',
    quizScore: '46.00',
    midtermScore: '50.00',
    finalExamScore: '0.00',
    totalScore: '38.98',
    letterGrade: 'E',
    gradePoint: '0.00',
    status: 'DRAFT'
  },
  {
    email: 'nomble@student.wakanda.ac.id',
    ewsLevel: 'CRITICAL',
    attendanceScore: '68.75',
    assignmentScore: '46.00',
    quizScore: '40.00',
    midtermScore: '43.00',
    finalExamScore: '0.00',
    totalScore: '34.83',
    letterGrade: 'E',
    gradePoint: '0.00',
    status: 'DRAFT'
  }
]

// ----------------------------------------------------------------------------
// 17. HELPER: GENERATE SUBMISSION UNTUK MAHASISWA PENDUKUNG
// ----------------------------------------------------------------------------
export function generateSupportingSubmissions(
  studentEmail: string,
  ewsLevel: 'SAFE' | 'WARNING' | 'CRITICAL',
  assignIdx: number
): { score: string; isLate: boolean; status: 'GRADED'; feedback: string } {
  const scoreRanges: Record<string, [number, number]> = {
    SAFE:     [80, 95],
    WARNING:  [60, 78],
    CRITICAL: [30, 55]
  }
  const [min, max] = scoreRanges[ewsLevel]
  const hash = studentEmail.charCodeAt(0) + studentEmail.charCodeAt(5) + assignIdx * 7
  const score = min + (hash % (max - min + 1))
  const isLate = ewsLevel === 'WARNING' && assignIdx > 0
  const feedbacks: Record<string, string[]> = {
    SAFE: [
      'Implementasi sangat baik dan sesuai spesifikasi.',
      'Kode bersih dengan dokumentasi lengkap.',
      'Solusi efisien dengan kompleksitas optimal.'
    ],
    WARNING: [
      `${isLate ? 'Pengumpulan terlambat. ' : ''}Implementasi cukup baik namun perlu peningkatan.`,
      `${isLate ? 'Terlambat 1 hari. ' : ''}Sebagian edge case belum ditangani.`,
      `${isLate ? 'Pengumpulan melewati deadline. ' : ''}Logika inti sudah benar, kerapihan perlu perbaikan.`
    ],
    CRITICAL: [
      'Pengumpulan terlambat signifikan. Banyak komponen belum diimplementasikan.',
      'Implementasi tidak lengkap. Hanya 40% requirement terpenuhi.',
      'Terlambat dan tidak memenuhi standar minimum. Perlu konsultasi dosen.'
    ]
  }
  return {
    score: `${score}.00`,
    isLate,
    status: 'GRADED',
    feedback: feedbacks[ewsLevel][assignIdx % 3]
  }
}

// ----------------------------------------------------------------------------
// 18. HELPER: GENERATE QUIZ ATTEMPT UNTUK MAHASISWA PENDUKUNG
// ----------------------------------------------------------------------------
export function generateSupportingQuizAttempt(
  studentEmail: string,
  ewsLevel: 'SAFE' | 'WARNING' | 'CRITICAL',
  quizIdx: number  // 0=Kuis1, 1=Kuis2, 2=UTS
): { score: string; autoScore: string; manualScore: string } {
  const scoreRanges: Record<string, [number, number]> = {
    SAFE:     [78, 95],
    WARNING:  [58, 75],
    CRITICAL: [25, 52]
  }
  const [min, max] = scoreRanges[ewsLevel]
  const hash = studentEmail.charCodeAt(2) + studentEmail.charCodeAt(4) + quizIdx * 11
  const rawScore = min + (hash % (max - min + 1))
  const isUTS = quizIdx === 2
  if (isUTS) {
    const autoPoints = Math.min(40, Math.floor(rawScore * 0.4))
    const manualPoints = Math.max(0, rawScore - autoPoints)
    return {
      score: `${rawScore}.00`,
      autoScore: `${autoPoints}.00`,
      manualScore: `${manualPoints}.00`
    }
  }
  return {
    score: `${rawScore}.00`,
    autoScore: `${rawScore}.00`,
    manualScore: '0.00'
  }
}

// ----------------------------------------------------------------------------
// 19. MATERIAL LENGKAP PER SESI (P-1 s/d P-9) UNTUK SEMUA KELAS
// ----------------------------------------------------------------------------
export interface SessionMaterialConfig {
  sessionNum: number
  title: string
  materialType: 'SLIDE' | 'CODE' | 'VIDEO' | 'DOCUMENT'
  fileName: string
  fileUrl: string
  orderIndex: number
}

export const if2041MaterialsAll: SessionMaterialConfig[] = [
  { sessionNum: 1, title: 'Slide 01: Pengantar Struktur Data & Big-O', materialType: 'SLIDE', fileName: 'P01_BigO_Intro.pdf', fileUrl: '/materials/if2041/p01_bigo_intro.pdf', orderIndex: 1 },
  { sessionNum: 1, title: 'Video 01: Visualisasi Kompleksitas Algoritma', materialType: 'VIDEO', fileName: 'p01_complexity_visual.mp4', fileUrl: 'https://drive.google.com/if2041/p01_complexity', orderIndex: 2 },
  { sessionNum: 2, title: 'Slide 02: Abstract Data Type & Pointer', materialType: 'SLIDE', fileName: 'P02_ADT_Pointer.pdf', fileUrl: '/materials/if2041/p02_adt_pointer.pdf', orderIndex: 1 },
  { sessionNum: 2, title: 'Code 02: Demonstrasi Alokasi Memori C++', materialType: 'CODE', fileName: 'p02_memory_alloc.zip', fileUrl: '/materials/if2041/p02_memory_alloc.zip', orderIndex: 2 },
  { sessionNum: 3, title: 'Slide 03: Linked List Singly & Doubly', materialType: 'SLIDE', fileName: 'P03_LinkedList.pdf', fileUrl: '/materials/if2041/p03_linked_list.pdf', orderIndex: 1 },
  { sessionNum: 3, title: 'Code 03: Implementasi Linked List TypeScript', materialType: 'CODE', fileName: 'p03_linked_list.zip', fileUrl: '/materials/if2041/p03_linked_list.zip', orderIndex: 2 },
  { sessionNum: 4, title: 'Slide 04: Stack, Queue & Notasi Postfix', materialType: 'SLIDE', fileName: 'P04_Stack_Queue.pdf', fileUrl: '/materials/if2041/p04_stack_queue.pdf', orderIndex: 1 },
  { sessionNum: 5, title: 'Slide 05: Rekursi & Divide-and-Conquer', materialType: 'SLIDE', fileName: 'P05_Recursion_DnC.pdf', fileUrl: '/materials/if2041/p05_recursion.pdf', orderIndex: 1 },
  { sessionNum: 5, title: 'Code 05: MergeSort & QuickSort', materialType: 'CODE', fileName: 'p05_sorting.zip', fileUrl: '/materials/if2041/p05_sorting.zip', orderIndex: 2 },
  { sessionNum: 6, title: 'Slide 06: Binary Tree & BST', materialType: 'SLIDE', fileName: 'P06_BST.pdf', fileUrl: '/materials/if2041/p06_bst.pdf', orderIndex: 1 },
  { sessionNum: 7, title: 'Slide 07: AVL Tree & Self-Balancing', materialType: 'SLIDE', fileName: 'P07_AVL_Tree.pdf', fileUrl: '/materials/if2041/p07_avl.pdf', orderIndex: 1 },
  { sessionNum: 8, title: 'Dokumen 08: Panduan UTS Struktur Data', materialType: 'DOCUMENT', fileName: 'UTS_Guide_IF2041.pdf', fileUrl: '/materials/if2041/uts_guide.pdf', orderIndex: 1 },
  { sessionNum: 9, title: 'Slide 09: Priority Queue & Binary Heap', materialType: 'SLIDE', fileName: 'P09_Heap.pdf', fileUrl: '/materials/if2041/p09_heap.pdf', orderIndex: 1 }
]

export const if202MaterialsAll: SessionMaterialConfig[] = [
  { sessionNum: 1, title: 'Slide 01: Konsep DBMS & Model Relasional', materialType: 'SLIDE', fileName: 'P01_DBMS_Intro.pdf', fileUrl: '/materials/if202/p01_dbms_intro.pdf', orderIndex: 1 },
  { sessionNum: 2, title: 'Slide 02: ERD & Relational Mapping', materialType: 'SLIDE', fileName: 'P02_ERD.pdf', fileUrl: '/materials/if202/p02_erd.pdf', orderIndex: 1 },
  { sessionNum: 2, title: 'Video 02: Tutorial draw.io ERD Design', materialType: 'VIDEO', fileName: 'p02_erd_tutorial.mp4', fileUrl: 'https://drive.google.com/if202/p02_erd', orderIndex: 2 },
  { sessionNum: 3, title: 'Slide 03: Normalisasi 1NF-BCNF', materialType: 'SLIDE', fileName: 'P03_Normalization.pdf', fileUrl: '/materials/if202/p03_normalization.pdf', orderIndex: 1 },
  { sessionNum: 4, title: 'Slide 04: DDL & Integritas Referensial', materialType: 'SLIDE', fileName: 'P04_DDL.pdf', fileUrl: '/materials/if202/p04_ddl.pdf', orderIndex: 1 },
  { sessionNum: 4, title: 'Code 04: Script DDL PostgreSQL', materialType: 'CODE', fileName: 'p04_ddl_scripts.zip', fileUrl: '/materials/if202/p04_ddl_scripts.zip', orderIndex: 2 },
  { sessionNum: 5, title: 'Slide 05: DML & Agregasi SQL Kompleks', materialType: 'SLIDE', fileName: 'P05_DML_Advanced.pdf', fileUrl: '/materials/if202/p05_dml_advanced.pdf', orderIndex: 1 },
  { sessionNum: 6, title: 'Slide 06: CTE & Window Functions', materialType: 'SLIDE', fileName: 'P06_CTE_Window.pdf', fileUrl: '/materials/if202/p06_cte_window.pdf', orderIndex: 1 },
  { sessionNum: 7, title: 'Slide 07: Indexing & Query Optimization', materialType: 'SLIDE', fileName: 'P07_Indexing.pdf', fileUrl: '/materials/if202/p07_indexing.pdf', orderIndex: 1 },
  { sessionNum: 8, title: 'Dokumen 08: Panduan UTS Basis Data', materialType: 'DOCUMENT', fileName: 'UTS_Guide_IF202.pdf', fileUrl: '/materials/if202/uts_guide.pdf', orderIndex: 1 },
  { sessionNum: 9, title: 'Slide 09: Transaksi ACID & Isolasi', materialType: 'SLIDE', fileName: 'P09_ACID.pdf', fileUrl: '/materials/if202/p09_acid.pdf', orderIndex: 1 }
]

export const if302MaterialsAll: SessionMaterialConfig[] = [
  { sessionNum: 1, title: 'Slide 01: Modern Web Architecture & SSR', materialType: 'SLIDE', fileName: 'P01_Web_Architecture.pdf', fileUrl: '/materials/if302/p01_architecture.pdf', orderIndex: 1 },
  { sessionNum: 2, title: 'Slide 02: Nuxt 3 Fundamentals & File Routing', materialType: 'SLIDE', fileName: 'P02_Nuxt3_Basics.pdf', fileUrl: '/materials/if302/p02_nuxt3.pdf', orderIndex: 1 },
  { sessionNum: 2, title: 'Code 02: Nuxt 3 Starter Template', materialType: 'CODE', fileName: 'p02_nuxt3_starter.zip', fileUrl: '/materials/if302/p02_nuxt3_starter.zip', orderIndex: 2 },
  { sessionNum: 3, title: 'Slide 03: TypeScript Strict Mode', materialType: 'SLIDE', fileName: 'P03_TypeScript_Strict.pdf', fileUrl: '/materials/if302/p03_typescript.pdf', orderIndex: 1 },
  { sessionNum: 4, title: 'Slide 04: Pinia State Management', materialType: 'SLIDE', fileName: 'P04_Pinia.pdf', fileUrl: '/materials/if302/p04_pinia.pdf', orderIndex: 1 },
  { sessionNum: 5, title: 'Slide 05: Nitro Server Engine & API Routes', materialType: 'SLIDE', fileName: 'P05_Nitro_API.pdf', fileUrl: '/materials/if302/p05_nitro.pdf', orderIndex: 1 },
  { sessionNum: 6, title: 'Slide 06: Auth Middleware & Session Cookies', materialType: 'SLIDE', fileName: 'P06_Auth.pdf', fileUrl: '/materials/if302/p06_auth.pdf', orderIndex: 1 },
  { sessionNum: 7, title: 'Slide 07: Tailwind CSS & UI Components', materialType: 'SLIDE', fileName: 'P07_Tailwind.pdf', fileUrl: '/materials/if302/p07_tailwind.pdf', orderIndex: 1 },
  { sessionNum: 8, title: 'Dokumen 08: Panduan UTS Full-Stack Dev', materialType: 'DOCUMENT', fileName: 'UTS_Guide_IF302.pdf', fileUrl: '/materials/if302/uts_guide.pdf', orderIndex: 1 },
  { sessionNum: 9, title: 'Slide 09: Zod Validation & Input Sanitasi', materialType: 'SLIDE', fileName: 'P09_Zod.pdf', fileUrl: '/materials/if302/p09_zod.pdf', orderIndex: 1 }
]

export const cy101MaterialsAll: SessionMaterialConfig[] = [
  { sessionNum: 1, title: 'Slide 01: Keamanan Informasi & CIA Triad', materialType: 'SLIDE', fileName: 'P01_CIA_Triad.pdf', fileUrl: '/materials/cy101/p01_cia_triad.pdf', orderIndex: 1 },
  { sessionNum: 2, title: 'Slide 02: Matematika Kriptografi', materialType: 'SLIDE', fileName: 'P02_Crypto_Math.pdf', fileUrl: '/materials/cy101/p02_crypto_math.pdf', orderIndex: 1 },
  { sessionNum: 3, title: 'Slide 03: Kriptografi Klasik', materialType: 'SLIDE', fileName: 'P03_Classical_Crypto.pdf', fileUrl: '/materials/cy101/p03_classical.pdf', orderIndex: 1 },
  { sessionNum: 3, title: 'Code 03: Implementasi Caesar & Vigenere Python', materialType: 'CODE', fileName: 'p03_ciphers.zip', fileUrl: '/materials/cy101/p03_ciphers.zip', orderIndex: 2 },
  { sessionNum: 4, title: 'Slide 04: AES & Block Cipher', materialType: 'SLIDE', fileName: 'P04_AES.pdf', fileUrl: '/materials/cy101/p04_aes.pdf', orderIndex: 1 },
  { sessionNum: 5, title: 'Slide 05: Mode Operasi Block Cipher', materialType: 'SLIDE', fileName: 'P05_Block_Modes.pdf', fileUrl: '/materials/cy101/p05_block_modes.pdf', orderIndex: 1 },
  { sessionNum: 6, title: 'Slide 06: Kriptografi Asimetrik & RSA', materialType: 'SLIDE', fileName: 'P06_RSA.pdf', fileUrl: '/materials/cy101/p06_rsa.pdf', orderIndex: 1 },
  { sessionNum: 7, title: 'Slide 07: Hash Functions SHA-256 & HMAC', materialType: 'SLIDE', fileName: 'P07_Hash_HMAC.pdf', fileUrl: '/materials/cy101/p07_hash.pdf', orderIndex: 1 },
  { sessionNum: 8, title: 'Dokumen 08: Panduan UTS Kriptografi', materialType: 'DOCUMENT', fileName: 'UTS_Guide_CY101.pdf', fileUrl: '/materials/cy101/uts_guide.pdf', orderIndex: 1 },
  { sessionNum: 9, title: 'Slide 09: Digital Signature & PKI', materialType: 'SLIDE', fileName: 'P09_PKI.pdf', fileUrl: '/materials/cy101/p09_pki.pdf', orderIndex: 1 }
]

export const classMaterialsMap: Record<string, SessionMaterialConfig[]> = {
  'IF2041:A': if2041MaterialsAll,
  'IF2041:B': if2041MaterialsAll,
  'IF202:A':  if202MaterialsAll,
  'IF302:A':  if302MaterialsAll,
  'CY101:A':  cy101MaterialsAll
}
