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
