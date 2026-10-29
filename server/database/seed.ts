import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { eq, sql, and, not } from 'drizzle-orm'
import {
  db,
  pingDatabase,
  programs,
  academicTerms,
  users,
  courses,
  courseClasses,
  classLecturers,
  classEnrollments,
  classSessions,
  attendanceTokens,
  attendanceLogs,
  assignments,
  submissions,
  quizzes,
  quizAttempts,
  gradeWeights,
  finalGrades,
  sessionMaterials
} from './index'

interface SeedUserCredential {
  email: string
  name: string
  role: 'admin' | 'lecturer' | 'student'
  nimNidn: string
  plainPassword: string
  phoneNumber?: string
  avatarUrl?: string
  ewsScenario?: string
}

async function seed() {
  console.log('='.repeat(80))
  console.log('  🏛️  INSTITUT TEKNOLOGI WAKANDA - DATABASE SEEDER (IDEMPOTENT & PRODUCTION READY)')
  console.log('='.repeat(80))

  // 1. Verify Database Connection
  console.log('\n[1/10] Memverifikasi konektivitas ke Neon Serverless PostgreSQL...')
  const isConnected = await pingDatabase()
  if (!isConnected) {
    throw new Error('Koneksi ke Neon PostgreSQL gagal. Pastikan DATABASE_URL valid.')
  }
  console.log('  ✓ Terhubung sukses ke Neon Serverless PostgreSQL!')

  // 2. Seed Program Studi (Programs)
  console.log('\n[2/10] Menyemai data Program Studi (Programs)...')
  const programData = [
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

  const seededPrograms = await db
    .insert(programs)
    .values(programData)
    .onConflictDoUpdate({
      target: programs.code,
      set: {
        name: sql`EXCLUDED.name`,
        degree: sql`EXCLUDED.degree`,
        description: sql`EXCLUDED.description`,
        isActive: sql`EXCLUDED.is_active`,
        updatedAt: new Date()
      }
    })
    .returning({ id: programs.id, code: programs.code, name: programs.name })

  const programMap = new Map(seededPrograms.map(p => [p.code, p.id]))
  console.log(`  ✓ Berhasil menyinkronkan ${seededPrograms.length} Program Studi`)

  // 3. Seed Tahun Akademik Aktif (Academic Term 20261)
  console.log('\n[3/10] Menyemai Tahun Akademik Aktif (Kode: 20261)...')
  const activeTermData = {
    code: '20261',
    name: 'Tahun Akademik 2026/2027 - Semester Ganjil',
    year: '2026/2027',
    semester: 'ODD' as const,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
    isActive: true
  }

  // Deaktivasi semester lain agar 20261 menjadi satu-satunya semester aktif
  await db
    .update(academicTerms)
    .set({ isActive: false, updatedAt: new Date() })
    .where(not(eq(academicTerms.code, activeTermData.code)))

  const [seededTerm] = await db
    .insert(academicTerms)
    .values(activeTermData)
    .onConflictDoUpdate({
      target: academicTerms.code,
      set: {
        name: sql`EXCLUDED.name`,
        year: sql`EXCLUDED.year`,
        semester: sql`EXCLUDED.semester`,
        startDate: sql`EXCLUDED.start_date`,
        endDate: sql`EXCLUDED.end_date`,
        isActive: true,
        updatedAt: new Date()
      }
    })
    .returning()

  console.log(`  ✓ Tahun Akademik Aktif: [${seededTerm.code}] ${seededTerm.name}`)

  // 4. Seed 7 Akun Dummy Utama Institut Teknologi Wakanda dengan Password Seragam "Password123!"
  console.log('\n[4/10] Menyemai 7 Akun Dummy Utama ITW (Password: "Password123!")...')
  const uniformPassword = 'Password123!'
  const uniformPasswordHash = await bcrypt.hash(uniformPassword, 10)

  const rawUsers: SeedUserCredential[] = [
    // --- 1. Admin Akademik ---
    {
      name: 'Admin Akademik ITW',
      email: 'admin@wakanda.ac.id',
      role: 'admin',
      nimNidn: 'ADM-001',
      plainPassword: uniformPassword,
      phoneNumber: '+628110000001',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-wakanda',
      ewsScenario: 'Administrator Sistem & Akademik'
    },

    // --- 2. Dosen 1: Prof. Shuri Udaku ---
    {
      name: 'Prof. Shuri Udaku',
      email: 'shuri@lecturer.wakanda.ac.id',
      role: 'lecturer',
      nimNidn: '1011088901',
      plainPassword: uniformPassword,
      phoneNumber: '+628120000001',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shuri-lecturer',
      ewsScenario: 'Dosen Pengampu Utama (Koordinator)'
    },

    // --- 3. Dosen 2: Dr. T\'Challa ---
    {
      name: "Dr. T'Challa",
      email: 'tchalla@lecturer.wakanda.ac.id',
      role: 'lecturer',
      nimNidn: '1015058502',
      plainPassword: uniformPassword,
      phoneNumber: '+628120000002',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tchalla-lecturer',
      ewsScenario: 'Dosen Pengampu Pendamping'
    },

    // --- 4. Mahasiswa 1: Nakia Lupita (EWS: Aman, Kehadiran 100%, Nilai A) ---
    {
      name: 'Nakia Lupita',
      email: 'nakia@student.wakanda.ac.id',
      role: 'student',
      nimNidn: '11241001',
      plainPassword: uniformPassword,
      phoneNumber: '+628520000001',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nakia-student',
      ewsScenario: 'EWS Aman (Kehadiran 100%, Nilai A, Zero Late)'
    },

    // --- 5. Mahasiswa 2: M\'Baku Jabari (EWS: Waspada, Kehadiran 78%, Beberapa Tugas Terlambat) ---
    {
      name: "M'Baku Jabari",
      email: 'mbaku@student.wakanda.ac.id',
      role: 'student',
      nimNidn: '11241002',
      plainPassword: uniformPassword,
      phoneNumber: '+628520000002',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mbaku-student',
      ewsScenario: 'EWS Waspada (Kehadiran 78%, Tugas Terlambat, Nilai Marginal BC)'
    },

    // --- 6. Mahasiswa 3: N\'Jadaka Erik (EWS: Kritis, Kehadiran < 75%, Nilai E) ---
    {
      name: "N'Jadaka Erik",
      email: 'erik@student.wakanda.ac.id',
      role: 'student',
      nimNidn: '11241003',
      plainPassword: uniformPassword,
      phoneNumber: '+628520000003',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=erik-student',
      ewsScenario: 'EWS Kritis (Kehadiran 55.6% < 75%, Diskualifikasi UAS, Nilai E)'
    },

    // --- 7. Mahasiswa 4: Riri Williams (Untuk Pengujian Aktif) ---
    {
      name: 'Riri Williams',
      email: 'riri@student.wakanda.ac.id',
      role: 'student',
      nimNidn: '11241004',
      plainPassword: uniformPassword,
      phoneNumber: '+628520000004',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=riri-student',
      ewsScenario: 'Pengujian Aktif (Ujian Daring & Presensi Real-Time)'
    }
  ]

  const userInsertValues = rawUsers.map(u => ({
    name: u.name,
    email: u.email.toLowerCase().trim(),
    passwordHash: uniformPasswordHash,
    role: u.role,
    nimNidn: u.nimNidn,
    phoneNumber: u.phoneNumber,
    avatarUrl: u.avatarUrl,
    isActive: true,
    updatedAt: new Date()
  }))

  const seededUsers = await db
    .insert(users)
    .values(userInsertValues)
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: sql`EXCLUDED.name`,
        passwordHash: sql`EXCLUDED.password_hash`,
        role: sql`EXCLUDED.role`,
        nimNidn: sql`EXCLUDED.nim_nidn`,
        phoneNumber: sql`EXCLUDED.phone_number`,
        avatarUrl: sql`EXCLUDED.avatar_url`,
        isActive: sql`EXCLUDED.is_active`,
        updatedAt: new Date()
      }
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      nimNidn: users.nimNidn
    })

  const userMap = new Map(seededUsers.map(u => [u.email, u]))
  console.log(`  ✓ Berhasil menyinkronkan ${seededUsers.length} Akun Pengguna Dummy`)

  // 5. Seed Master Mata Kuliah (Termasuk IF2041 Struktur Data & Algoritma)
  console.log('\n[5/10] Menyemai data Master Mata Kuliah (Courses)...')
  const tifId = programMap.get('TIF')
  const rplId = programMap.get('RPL')
  const vibId = programMap.get('TEK-VIB')

  if (!tifId || !rplId || !vibId) {
    throw new Error('ID Program Studi tidak ditemukan untuk seeding mata kuliah.')
  }

  const courseList = [
    // Mata Kuliah Utama Ujian & EWS: IF2041 Struktur Data & Algoritma
    {
      programId: tifId,
      code: 'IF2041',
      name: 'Struktur Data & Algoritma',
      credits: 4,
      semester: 3,
      description: 'Struktur data linear dan non-linear, analisis kompleksitas Big-O, pohon biner seimbang (AVL), graph traversal, dan algoritma jalur terpendek.',
      isActive: true
    },
    {
      programId: tifId,
      code: 'IF101',
      name: 'Algoritma & Pemrograman Dasar',
      credits: 3,
      semester: 1,
      description: 'Konsep dasar algoritma, pemrograman terstruktur, tipe data, kontrol alur, dan fungsi.',
      isActive: true
    },
    {
      programId: tifId,
      code: 'IF201',
      name: 'Pemrograman Berorientasi Objek & Clean Code',
      credits: 3,
      semester: 3,
      description: 'Prinsip OOP (Encapsulation, Inheritance, Polymorphism, Abstraction) dan clean coding standard.',
      isActive: true
    },
    {
      programId: tifId,
      code: 'IF202',
      name: 'Basis Data Relasional & Serverless',
      credits: 3,
      semester: 3,
      description: 'Desain skema relasional, normalisasi, indexing performa tinggi, dan orkestrasi Drizzle ORM.',
      isActive: true
    },
    {
      programId: tifId,
      code: 'IF301',
      name: 'Rekayasa Perangkat Lunak & Clean Architecture',
      credits: 4,
      semester: 5,
      description: 'Penerapan Clean Architecture, domain-driven design, dependency injection, dan pengujian unit.',
      isActive: true
    },
    {
      programId: tifId,
      code: 'IF302',
      name: 'Pengembangan Aplikasi Web Full-Stack Modern',
      credits: 3,
      semester: 5,
      description: 'Pembangunan aplikasi enterprise menggunakan Nuxt 3, TypeScript, Pinia, dan Tailwind CSS.',
      isActive: true
    },
    {
      programId: rplId,
      code: 'SE101',
      name: 'Pengantar Rekayasa Perangkat Lunak',
      credits: 3,
      semester: 1,
      description: 'Siklus hidup pengembangan perangkat lunak (SDLC), Scrum, Agile, dan manajemen requirement.',
      isActive: true
    },
    {
      programId: vibId,
      code: 'CY101',
      name: 'Kriptografi & Keamanan Sistem Komputer',
      credits: 3,
      semester: 1,
      description: 'Enkripsi simetrik/asimetrik, hashing kriptografi, digital signature, dan sertifikat digital.',
      isActive: true
    }
  ]

  const seededCourses = await db
    .insert(courses)
    .values(courseList)
    .onConflictDoUpdate({
      target: [courses.programId, courses.code],
      set: {
        name: sql`EXCLUDED.name`,
        credits: sql`EXCLUDED.credits`,
        semester: sql`EXCLUDED.semester`,
        description: sql`EXCLUDED.description`,
        isActive: sql`EXCLUDED.is_active`,
        updatedAt: new Date()
      }
    })
    .returning({ id: courses.id, code: courses.code, name: courses.name, credits: courses.credits })

  const courseMap = new Map(seededCourses.map(c => [c.code, c.id]))
  const if2041CourseId = courseMap.get('IF2041')
  if (!if2041CourseId) {
    throw new Error('Gagal menyemai mata kuliah IF2041.')
  }
  console.log(`  ✓ Mata Kuliah Utama: [IF2041] Struktur Data & Algoritma (4 SKS)`)

  // 6. Seed Kelas IF2041 Kelas A di Semester 20261
  console.log('\n[6/10] Menyemai Kelas Perkuliahan (IF2041 - Kelas A)...')
  const [seededClass] = await db
    .insert(courseClasses)
    .values({
      courseId: if2041CourseId,
      academicTermId: seededTerm.id,
      code: 'A',
      capacity: 40,
      room: 'Vibranium Lab 301',
      scheduleDay: 'MONDAY',
      scheduleStart: '08:00:00',
      scheduleEnd: '11:30:00',
      isActive: true
    })
    .onConflictDoUpdate({
      target: [courseClasses.academicTermId, courseClasses.courseId, courseClasses.code],
      set: {
        capacity: sql`EXCLUDED.capacity`,
        room: sql`EXCLUDED.room`,
        scheduleDay: sql`EXCLUDED.schedule_day`,
        scheduleStart: sql`EXCLUDED.schedule_start`,
        scheduleEnd: sql`EXCLUDED.schedule_end`,
        isActive: true,
        updatedAt: new Date()
      }
    })
    .returning()

  console.log(`  ✓ Kelas Aktif: [IF2041 - Kelas ${seededClass.code}] Ruang: ${seededClass.room} (Senin 08:00 - 11:30 WIB)`)

  // 7. Seed Pengampu Dosen (Prof. Shuri Udaku sebagai Primary, Dr. T\'Challa sebagai Secondary)
  console.log('\n[7/10] Menugaskan Dosen Pengampu Kelas IF2041-A...')
  const shuriUser = userMap.get('shuri@lecturer.wakanda.ac.id')!
  const tchallaUser = userMap.get('tchalla@lecturer.wakanda.ac.id')!

  await db
    .insert(classLecturers)
    .values([
      { classId: seededClass.id, lecturerId: shuriUser.id, isPrimary: true },
      { classId: seededClass.id, lecturerId: tchallaUser.id, isPrimary: false }
    ])
    .onConflictDoUpdate({
      target: [classLecturers.classId, classLecturers.lecturerId],
      set: { isPrimary: sql`EXCLUDED.is_primary` }
    })
  console.log(`  ✓ Dosen Utama: ${shuriUser.name} (${shuriUser.nimNidn})`)
  console.log(`  ✓ Dosen Pendamping: ${tchallaUser.name} (${tchallaUser.nimNidn})`)

  // 8. Enroll 4 Mahasiswa Dummy ke Kelas IF2041-A
  console.log('\n[8/10] Mendaftarkan 4 Mahasiswa ke Kelas IF2041-A...')
  const nakiaUser = userMap.get('nakia@student.wakanda.ac.id')!
  const mbakuUser = userMap.get('mbaku@student.wakanda.ac.id')!
  const erikUser = userMap.get('erik@student.wakanda.ac.id')!
  const ririUser = userMap.get('riri@student.wakanda.ac.id')!

  const studentUsers = [nakiaUser, mbakuUser, erikUser, ririUser]
  const enrollmentValues = studentUsers.map(s => ({
    classId: seededClass.id,
    studentId: s.id,
    status: 'ENROLLED' as const,
    enrolledAt: new Date('2026-09-01T08:00:00Z'),
    updatedAt: new Date()
  }))

  await db
    .insert(classEnrollments)
    .values(enrollmentValues)
    .onConflictDoUpdate({
      target: [classEnrollments.classId, classEnrollments.studentId],
      set: { status: sql`EXCLUDED.status`, updatedAt: new Date() }
    })
  console.log(`  ✓ Berhasil mendaftarkan 4 mahasiswa ke kelas IF2041-A`)

  // 9. Seed Struktur 16 Pertemuan Perkuliahan (Class Sessions)
  console.log('\n[9/10] Menyemai Struktur 16 Pertemuan Perkuliahan & Sesi Presensi/Ujian...')
  const sessionTopics = [
    { num: 1, title: 'Pengantar Struktur Data & Analisis Kompleksitas Big-O', type: 'REGULAR' as const, status: 'COMPLETED' as const },
    { num: 2, title: 'Abstract Data Type (ADT) & Pointer di Memori', type: 'REGULAR' as const, status: 'COMPLETED' as const },
    { num: 3, title: 'Linked List: Singly & Doubly Linked List', type: 'REGULAR' as const, status: 'COMPLETED' as const },
    { num: 4, title: 'Stack & Queue serta Evaluasi Notasi Postfix', type: 'QUIZ' as const, status: 'COMPLETED' as const },
    { num: 5, title: 'Rekursi & Strategi Divide-and-Conquer', type: 'REGULAR' as const, status: 'COMPLETED' as const },
    { num: 6, title: 'Binary Tree & Binary Search Tree (BST)', type: 'REGULAR' as const, status: 'COMPLETED' as const },
    { num: 7, title: 'AVL Tree & Self-Balancing Trees (Review Pra-UTS)', type: 'QUIZ' as const, status: 'COMPLETED' as const },
    { num: 8, title: 'Evaluasi Tengah Semester (UTS): Struktur Data & Algoritma', type: 'MIDTERM_EXAM' as const, status: 'COMPLETED' as const },
    { num: 9, title: 'Priority Queue & Binary Heap Data Structure', type: 'REGULAR' as const, status: 'COMPLETED' as const },
    { num: 10, title: 'Disjoint Set Union & Kruskal Algorithm', type: 'REGULAR' as const, status: 'IN_PROGRESS' as const },
    { num: 11, title: 'Graph Representation: Adjacency List & Matrix', type: 'REGULAR' as const, status: 'SCHEDULED' as const },
    { num: 12, title: 'Graph Traversal: Breadth-First & Depth-First Search', type: 'REGULAR' as const, status: 'SCHEDULED' as const },
    { num: 13, title: 'Shortest Path: Dijkstra & Bellman-Ford Algorithm', type: 'REGULAR' as const, status: 'SCHEDULED' as const },
    { num: 14, title: 'Minimum Spanning Tree & Network Optimization', type: 'REGULAR' as const, status: 'SCHEDULED' as const },
    { num: 15, title: 'Hashing & Open Addressing Collision Handling', type: 'REGULAR' as const, status: 'SCHEDULED' as const },
    { num: 16, title: 'Evaluasi Akhir Semester (UAS): Comprehensive Examination', type: 'FINAL_EXAM' as const, status: 'SCHEDULED' as const }
  ]

  const baseDate = new Date('2026-09-07T08:00:00Z') // Senin awal semester
  const sessionInsertValues = sessionTopics.map(t => {
    const sDate = new Date(baseDate)
    sDate.setDate(sDate.getDate() + (t.num - 1) * 7)
    return {
      classId: seededClass.id,
      sessionNumber: t.num,
      title: t.title,
      topicDescription: `Silabus perkuliahan pertemuan ${t.num} mata kuliah IF2041 Struktur Data & Algoritma.`,
      sessionDate: sDate.toISOString().split('T')[0],
      startTime: '08:00:00',
      endTime: '11:30:00',
      sessionType: t.type,
      status: t.status,
      updatedAt: new Date()
    }
  })

  const seededSessions = await db
    .insert(classSessions)
    .values(sessionInsertValues)
    .onConflictDoUpdate({
      target: [classSessions.classId, classSessions.sessionNumber],
      set: {
        title: sql`EXCLUDED.title`,
        topicDescription: sql`EXCLUDED.topic_description`,
        sessionDate: sql`EXCLUDED.session_date`,
        startTime: sql`EXCLUDED.start_time`,
        endTime: sql`EXCLUDED.end_time`,
        sessionType: sql`EXCLUDED.session_type`,
        status: sql`EXCLUDED.status`,
        updatedAt: new Date()
      }
    })
    .returning()

  const sessionMap = new Map(seededSessions.map(s => [s.sessionNumber, s]))
  console.log(`  ✓ 16 Pertemuan Tersinkronisasi (Sesi 1-9 Selesai, Sesi 10 Berjalan, Sesi 11-16 Terjadwal)`)

  // 10. Seed Active Attendance Token untuk Sesi 10 (Valid 24 jam untuk pengujian presensi instan)
  const session10 = sessionMap.get(10)!
  const activePinToken = '481920'
  await db
    .insert(attendanceTokens)
    .values({
      sessionId: session10.id,
      token: activePinToken,
      qrCodePayload: `WAKANDA_ATT:${session10.id}:${activePinToken}`,
      validFrom: new Date(Date.now() - 3600_000), // Sudah aktif sejak 1 jam lalu
      validUntil: new Date(Date.now() + 24 * 3600_000), // Berlaku 24 jam ke depan
      isActive: true,
      createdBy: shuriUser.id
    })
    .onConflictDoUpdate({
      target: attendanceTokens.token,
      set: {
        sessionId: sql`EXCLUDED.session_id`,
        validFrom: sql`EXCLUDED.valid_from`,
        validUntil: sql`EXCLUDED.valid_until`,
        isActive: true
      }
    })
  console.log(`  ✓ Token PIN Presensi Aktif untuk Sesi 10: [${activePinToken}] (Siap digunakan untuk check-in)`)

  // 11. Seed Attendance Logs untuk 16 Pertemuan sesuai skenario EWS
  // - Nakia: Hadir 16/16 (100.0%) -> EWS Aman (#16A34A)
  // - M'Baku: Hadir 12 PRESENT + 1 LATE, 1 SICK, 2 ABSENT -> 12.5/16 ~ 78.1% (78%) -> EWS Waspada (#D97706)
  // - N'Jadaka Erik: Hadir 8/16 (50.0% < 75%) -> EWS Kritis (#DC2626) (Diskualifikasi UAS)
  // - Riri Williams: Hadir 16/16 (100.0%) -> Siap Pengujian Aktif
  const attendanceRecords = []

  for (let sNum = 1; sNum <= 16; sNum++) {
    const sess = sessionMap.get(sNum)!

    // Nakia: Selalu PRESENT (16/16 = 100%)
    attendanceRecords.push({
      sessionId: sess.id,
      studentId: nakiaUser.id,
      status: 'PRESENT' as const,
      checkInMethod: 'TOKEN' as const,
      notes: 'Hadir tepat waktu'
    })

    // M'Baku: 11 PRESENT + 1 LATE (Sesi 4), 1 SICK (Sesi 6), 3 ABSENT (Sesi 7, 10, 14) -> 12/16 = 75.0% (Waspada)
    let mbakuStatus: 'PRESENT' | 'LATE' | 'SICK' | 'ABSENT' = 'PRESENT'
    let mbakuNotes = 'Hadir'
    if (sNum === 4) {
      mbakuStatus = 'LATE'
      mbakuNotes = 'Terlambat 15 menit karena kendala transportasi'
    } else if (sNum === 6) {
      mbakuStatus = 'SICK'
      mbakuNotes = 'Izin sakit dengan surat dokter'
    } else if (sNum === 7 || sNum === 10 || sNum === 14) {
      mbakuStatus = 'ABSENT'
      mbakuNotes = 'Alpa tanpa keterangan'
    }

    attendanceRecords.push({
      sessionId: sess.id,
      studentId: mbakuUser.id,
      status: mbakuStatus,
      checkInMethod: mbakuStatus === 'PRESENT' || mbakuStatus === 'LATE' ? ('TOKEN' as const) : ('MANUAL_LECTURER' as const),
      notes: mbakuNotes
    })

    // N'Jadaka Erik: 8 sesi PRESENT, 8 sesi ABSENT (50% < 75% -> Kritis)
    let erikStatus: 'PRESENT' | 'ABSENT' = 'PRESENT'
    let erikNotes = 'Hadir'
    if ([2, 4, 5, 7, 10, 11, 13, 15].includes(sNum)) {
      erikStatus = 'ABSENT'
      erikNotes = 'Tidak hadir tanpa pemberitahuan'
    }

    attendanceRecords.push({
      sessionId: sess.id,
      studentId: erikUser.id,
      status: erikStatus,
      checkInMethod: erikStatus === 'PRESENT' ? ('TOKEN' as const) : ('MANUAL_LECTURER' as const),
      notes: erikNotes
    })

    // Riri: Selalu PRESENT (16/16 = 100%)
    attendanceRecords.push({
      sessionId: sess.id,
      studentId: ririUser.id,
      status: 'PRESENT' as const,
      checkInMethod: 'QR_SCAN' as const,
      notes: 'Hadir via scan QR dinamis'
    })
  }

  for (const record of attendanceRecords) {
    await db
      .insert(attendanceLogs)
      .values(record)
      .onConflictDoUpdate({
        target: [attendanceLogs.sessionId, attendanceLogs.studentId],
        set: {
          status: record.status,
          checkInMethod: record.checkInMethod,
          notes: record.notes,
          updatedAt: new Date()
        }
      })
  }
  console.log(`  ✓ Log Presensi 16 Pertemuan Tersinkronisasi (Nakia 100%, M'Baku 75-78%, Erik 50%, Riri 100%)`)

  // 12. Seed Bobot Penilaian Gradebook (Total = 100.00%)
  const weightsConfig = [
    { componentName: 'ATTENDANCE', weightPercentage: '10.00', description: 'Kehadiran minimum 75% syarat kelulusan' },
    { componentName: 'ASSIGNMENT', weightPercentage: '20.00', description: 'Rata-rata akumulasi tugas mandiri & praktikum' },
    { componentName: 'QUIZ', weightPercentage: '20.00', description: 'Akumulasi kuis berkala pengerjaan daring' },
    { componentName: 'MIDTERM_EXAM', weightPercentage: '25.00', description: 'Evaluasi Tengah Semester (Pertemuan 8)' },
    { componentName: 'FINAL_EXAM', weightPercentage: '25.00', description: 'Evaluasi Akhir Semester (Pertemuan 16)' }
  ]

  for (const w of weightsConfig) {
    await db
      .insert(gradeWeights)
      .values({
        classId: seededClass.id,
        componentName: w.componentName,
        weightPercentage: w.weightPercentage,
        description: w.description
      })
      .onConflictDoUpdate({
        target: [gradeWeights.classId, gradeWeights.componentName],
        set: {
          weightPercentage: w.weightPercentage,
          description: w.description,
          updatedAt: new Date()
        }
      })
  }
  console.log(`  ✓ Bobot Gradebook Ditetapkan: Absensi 10%, Tugas 20%, Kuis 20%, UTS 25%, UAS 25% (Total 100%)`)

  // 13. Seed Assignments & Submissions (Tugas Kuliah & Pengumpulan Mahasiswa)
  const assignmentData = [
    {
      title: 'Tugas 1: Analisis Kompleksitas & Implementasi Linked List',
      sessionNum: 3,
      description: 'Implementasikan Singly & Doubly Linked List dengan operasi traversal, insertion O(1), dan deletion O(1).'
    },
    {
      title: 'Tugas 2: Sistem Antrean Berbasis Priority Queue & BST',
      sessionNum: 6,
      description: 'Bangun simulasi scheduling task dengan Binary Search Tree dan hitung kedalaman maksimum tree.'
    },
    {
      title: 'Tugas 3: Representasi Graph & Deteksi Siklus dengan DFS',
      sessionNum: 9,
      description: 'Implementasi algoritma deteksi cycle pada Directed Graph menggunakan pendekatan 3-color DFS.'
    }
  ]

  const seededAssignments = []
  for (const a of assignmentData) {
    const sess = sessionMap.get(a.sessionNum)!
    const dueDate = new Date(sess.sessionDate)
    dueDate.setDate(dueDate.getDate() + 7)

    // Cek apakah assignment dengan title ini sudah ada di class
    const existingAssign = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.classId, seededClass.id), eq(assignments.title, a.title)))
      .limit(1)

    let assignId: string
    if (existingAssign.length > 0) {
      assignId = existingAssign[0].id
      await db
        .update(assignments)
        .set({
          sessionId: sess.id,
          description: a.description,
          dueDate,
          updatedAt: new Date()
        })
        .where(eq(assignments.id, assignId))
    } else {
      const [newAssign] = await db
        .insert(assignments)
        .values({
          classId: seededClass.id,
          sessionId: sess.id,
          title: a.title,
          description: a.description,
          instructions: 'Kumpulkan dalam format ZIP berisi source code TypeScript/Python dan laporan PDF analisis.',
          maxScore: '100.00',
          dueDate,
          allowLateSubmission: true,
          latePenaltyPercentage: '10.00',
          isPublished: true,
          createdBy: shuriUser.id
        })
        .returning()
      assignId = newAssign.id
    }
    seededAssignments.push({ id: assignId, title: a.title })
  }

  // Seed Submissions sesuai Profil Siswa
  const assign1 = seededAssignments[0].id
  const assign2 = seededAssignments[1].id
  const assign3 = seededAssignments[2].id

  const submissionRows = [
    // Nakia: 3/3 on-time (Skor: 96, 94, 98 -> Avg 96.00)
    { assignmentId: assign1, studentId: nakiaUser.id, isLate: false, score: '96.00', status: 'GRADED' as const, feedback: 'Implementasi sangat bersih, modular, dan efisien.' },
    { assignmentId: assign2, studentId: nakiaUser.id, isLate: false, score: '94.00', status: 'GRADED' as const, feedback: 'AVL Tree balancing berjalan sempurna.' },
    { assignmentId: assign3, studentId: nakiaUser.id, isLate: false, score: '98.00', status: 'GRADED' as const, feedback: 'Penanganan edge case graph sangat teliti.' },

    // M'Baku: 1 on-time (75.00), 2 terlambat (68.00, 70.00) -> Avg 71.00
    { assignmentId: assign1, studentId: mbakuUser.id, isLate: false, score: '75.00', status: 'GRADED' as const, feedback: 'Kode berjalan baik, namun perhatikan manajemen pointer.' },
    { assignmentId: assign2, studentId: mbakuUser.id, isLate: true, score: '68.00', status: 'GRADED' as const, feedback: 'Pengumpulan terlambat 14 jam. Struktur tree belum diuji edge-case.' },
    { assignmentId: assign3, studentId: mbakuUser.id, isLate: true, score: '70.00', status: 'GRADED' as const, feedback: 'Pengumpulan terlambat 8 jam. Format output graph perlu dirapikan.' },

    // N'Jadaka Erik: 1 terlambat (45.00), 2 missing -> Rata-rata rendah, indikator EWS Kritis
    { assignmentId: assign1, studentId: erikUser.id, isLate: true, score: '45.00', status: 'GRADED' as const, feedback: 'Terlambat 2 hari. Program mengalami memory leak fatal.' },

    // Riri Williams: 3/3 on-time (Skor: 90, 92, 88 -> Avg 90.00)
    { assignmentId: assign1, studentId: ririUser.id, isLate: false, score: '90.00', status: 'GRADED' as const, feedback: 'Solusi elegan dan optimal.' },
    { assignmentId: assign2, studentId: ririUser.id, isLate: false, score: '92.00', status: 'GRADED' as const, feedback: 'Kompleksitas O(log N) tercapai dengan baik.' },
    { assignmentId: assign3, studentId: ririUser.id, isLate: false, score: '88.00', status: 'GRADED' as const, feedback: 'Bagus, siap untuk proyek implementasi tingkat lanjut.' }
  ]

  for (const sub of submissionRows) {
    await db
      .insert(submissions)
      .values({
        ...sub,
        fileKey: `submissions/${sub.assignmentId}/${sub.studentId}.zip`,
        fileName: 'tugas_praktikum.zip',
        fileSize: 1024 * 350,
        gradedBy: shuriUser.id,
        gradedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [submissions.assignmentId, submissions.studentId],
        set: {
          isLate: sub.isLate,
          score: sub.score,
          status: sub.status,
          feedback: sub.feedback,
          gradedBy: shuriUser.id,
          gradedAt: new Date(),
          updatedAt: new Date()
        }
      })
  }
  console.log(`  ✓ Data Pengumpulan Tugas (Submissions) & Umpan Balik Tersinkronisasi`)

  // 14. Seed Quizzes, UTS, dan Percobaan Ujian (Quiz Attempts)
  const quizMasterData = [
    {
      title: 'Kuis 1: ADT, Stack, dan Queue',
      sessionNum: 4,
      type: 'QUIZ' as const,
      duration: 45,
      questions: [
        {
          id: 'q-k1-1',
          type: 'MULTIPLE_CHOICE' as const,
          prompt: 'Struktur data manakah yang bekerja dengan prinsip First-In First-Out (FIFO)?',
          points: 50,
          options: [
            { id: 'opt-a', text: 'Stack' },
            { id: 'opt-b', text: 'Queue' },
            { id: 'opt-c', text: 'Priority Queue' },
            { id: 'opt-d', text: 'Binary Tree' }
          ],
          correctOptionId: 'opt-b',
          explanation: 'Queue bekerja dengan urutan pertama masuk pertama keluar (FIFO).'
        },
        {
          id: 'q-k1-2',
          type: 'MULTIPLE_CHOICE' as const,
          prompt: 'Operasi pengambilan elemen teratas pada Stack disebut?',
          points: 50,
          options: [
            { id: 'opt-a', text: 'Push' },
            { id: 'opt-b', text: 'Enqueue' },
            { id: 'opt-c', text: 'Pop' },
            { id: 'opt-d', text: 'Dequeue' }
          ],
          correctOptionId: 'opt-c',
          explanation: 'Pop adalah operasi untuk mengambil dan menghapus elemen puncak Stack.'
        }
      ]
    },
    {
      title: 'Kuis 2: Binary Search Tree & Balancing',
      sessionNum: 7,
      type: 'QUIZ' as const,
      duration: 45,
      questions: [
        {
          id: 'q-k2-1',
          type: 'MULTIPLE_CHOICE' as const,
          prompt: 'Berapakah kompleksitas waktu pencarian rata-rata pada Binary Search Tree yang seimbang?',
          points: 50,
          options: [
            { id: 'opt-a', text: 'O(1)' },
            { id: 'opt-b', text: 'O(log N)' },
            { id: 'opt-c', text: 'O(N)' },
            { id: 'opt-d', text: 'O(N log N)' }
          ],
          correctOptionId: 'opt-b',
          explanation: 'Pohon BST seimbang memiliki tinggi log N sehingga pencarian membutuhkan O(log N).'
        },
        {
          id: 'q-k2-2',
          type: 'MULTIPLE_CHOICE' as const,
          prompt: 'Rotasi apa yang dibutuhkan jika terjadi ketidakseimbangan tipe Left-Right pada AVL Tree?',
          points: 50,
          options: [
            { id: 'opt-a', text: 'Single Right Rotation' },
            { id: 'opt-b', text: 'Left-Right Double Rotation' },
            { id: 'opt-c', text: 'Single Left Rotation' },
            { id: 'opt-d', text: 'Right-Left Double Rotation' }
          ],
          correctOptionId: 'opt-b',
          explanation: 'Kasus LR diselesaikan dengan rotasi kiri pada anak kiri diikuti rotasi kanan pada simpul kakek.'
        }
      ]
    },
    {
      title: 'Ujian Tengah Semester (UTS): Struktur Data & Algoritma',
      sessionNum: 8,
      type: 'MIDTERM_EXAM' as const,
      duration: 90,
      questions: [
        {
          id: 'q-uts-1',
          type: 'MULTIPLE_CHOICE' as const,
          prompt: 'Algoritma pengurutan manakah yang memiliki jaminan batas terburuk O(N log N) dan tidak membutuhkan alokasi memori tambahan?',
          points: 40,
          options: [
            { id: 'opt-a', text: 'Merge Sort' },
            { id: 'opt-b', text: 'Heap Sort' },
            { id: 'opt-c', text: 'Quick Sort' },
            { id: 'opt-d', text: 'Bubble Sort' }
          ],
          correctOptionId: 'opt-b',
          explanation: 'Heap Sort mengurutkan in-place dengan kompleksitas terburuk O(N log N).'
        },
        {
          id: 'q-uts-2',
          type: 'ESSAY' as const,
          prompt: 'Jelaskan perbedaan mendasar antara representasi Adjacency Matrix dan Adjacency List pada Graph dalam konteks efisiensi memori untuk sparse graph!',
          points: 60,
          rubric: 'Penjelasan memori O(V^2) vs O(V+E) (30 poin), kesimpulan efisiensi sparse graph (30 poin).'
        }
      ]
    }
  ]

  const seededQuizzes = []
  for (const q of quizMasterData) {
    const sess = sessionMap.get(q.sessionNum)!
    const startTime = new Date(sess.sessionDate + 'T08:00:00Z')
    const endTime = new Date(sess.sessionDate + 'T12:00:00Z')

    const existingQuiz = await db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.classId, seededClass.id), eq(quizzes.title, q.title)))
      .limit(1)

    let quizId: string
    if (existingQuiz.length > 0) {
      quizId = existingQuiz[0].id
      await db
        .update(quizzes)
        .set({
          sessionId: sess.id,
          quizType: q.type,
          durationMinutes: q.duration,
          questionsJsonb: q.questions,
          startTime,
          endTime,
          isPublished: true,
          updatedAt: new Date()
        })
        .where(eq(quizzes.id, quizId))
    } else {
      const [newQuiz] = await db
        .insert(quizzes)
        .values({
          classId: seededClass.id,
          sessionId: sess.id,
          title: q.title,
          description: `Evaluasi terstruktur pertemuan ${q.sessionNum} mata kuliah IF2041.`,
          quizType: q.type,
          durationMinutes: q.duration,
          maxScore: '100.00',
          passingScore: '55.00',
          startTime,
          endTime,
          shuffleQuestions: true,
          maxAttempts: 1,
          questionsJsonb: q.questions,
          isPublished: true,
          createdBy: shuriUser.id
        })
        .returning()
      quizId = newQuiz.id
    }
    seededQuizzes.push({ id: quizId, title: q.title, type: q.type })
  }

  const quiz1Id = seededQuizzes[0].id
  const quiz2Id = seededQuizzes[1].id
  const utsQuizId = seededQuizzes[2].id

  // Attempts Data (Kuis 1, Kuis 2, UTS)
  const attemptEntries = [
    // Nakia: Kuis1 95, Kuis2 92, UTS 94
    { quizId: quiz1Id, studentId: nakiaUser.id, score: '95.00', autoScore: '95.00', manualScore: '0.00' },
    { quizId: quiz2Id, studentId: nakiaUser.id, score: '92.00', autoScore: '92.00', manualScore: '0.00' },
    { quizId: utsQuizId, studentId: nakiaUser.id, score: '94.00', autoScore: '40.00', manualScore: '54.00' },

    // M'Baku: Kuis1 65, Kuis2 60, UTS 62 (Marginal 60-65 range -> EWS Waspada)
    { quizId: quiz1Id, studentId: mbakuUser.id, score: '65.00', autoScore: '65.00', manualScore: '0.00' },
    { quizId: quiz2Id, studentId: mbakuUser.id, score: '60.00', autoScore: '60.00', manualScore: '0.00' },
    { quizId: utsQuizId, studentId: mbakuUser.id, score: '62.00', autoScore: '25.00', manualScore: '37.00' },

    // N'Jadaka Erik: Kuis1 35, Kuis2 40, UTS 42 (< 55.0 -> EWS Kritis)
    { quizId: quiz1Id, studentId: erikUser.id, score: '35.00', autoScore: '35.00', manualScore: '0.00' },
    { quizId: quiz2Id, studentId: erikUser.id, score: '40.00', autoScore: '40.00', manualScore: '0.00' },
    { quizId: utsQuizId, studentId: erikUser.id, score: '42.00', autoScore: '20.00', manualScore: '22.00' },

    // Riri Williams: Kuis1 88, Kuis2 90, UTS 89
    { quizId: quiz1Id, studentId: ririUser.id, score: '88.00', autoScore: '88.00', manualScore: '0.00' },
    { quizId: quiz2Id, studentId: ririUser.id, score: '90.00', autoScore: '90.00', manualScore: '0.00' },
    { quizId: utsQuizId, studentId: ririUser.id, score: '89.00', autoScore: '40.00', manualScore: '49.00' }
  ]

  for (const att of attemptEntries) {
    const existing = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, att.quizId), eq(quizAttempts.studentId, att.studentId)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(quizAttempts)
        .set({
          score: att.score,
          autoScore: att.autoScore,
          manualScore: att.manualScore,
          status: 'GRADED',
          submittedAt: new Date(),
          gradedBy: shuriUser.id,
          gradedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(quizAttempts.id, existing[0].id))
    } else {
      await db.insert(quizAttempts).values({
        quizId: att.quizId,
        studentId: att.studentId,
        attemptNumber: 1,
        score: att.score,
        autoScore: att.autoScore,
        manualScore: att.manualScore,
        status: 'GRADED',
        startedAt: new Date(Date.now() - 3600_000),
        expiresAt: new Date(Date.now() + 3600_000),
        submittedAt: new Date(),
        gradedBy: shuriUser.id,
        gradedAt: new Date()
      })
    }
  }
  console.log(`  ✓ Master Ujian (Kuis 1, Kuis 2, UTS) & Percobaan Pengerjaan Mahasiswa Tersinkronisasi`)

  // 15. Seed Final Grades (Nilai Akhir Berbasis Rumus PRD)
  // Formula PRD:
  // NA = (0.10 * Absensi) + (0.20 * Rata_Tugas) + (0.20 * Rata_Kuis) + (0.25 * Skor_UTS) + (0.25 * Skor_UAS)
  //
  // 1. Nakia Lupita:
  //    Absen: 100, Tugas: 96, Kuis: 93.5, UTS: 94, UAS: 92
  //    NA = (10) + (19.2) + (18.7) + (23.5) + (23.0) = 94.40 ➔ A (4.00) (PUBLISHED)
  //
  // 2. M'Baku Jabari:
  //    Absen: 77.8, Tugas: 71, Kuis: 62.5, UTS: 62, UAS: 65
  //    NA = (7.78) + (14.2) + (12.5) + (15.5) + (16.25) = 66.23 ➔ BC (2.50) (DRAFT)
  //
  // 3. N'Jadaka Erik:
  //    Absen: 55.6 (< 75% ➔ Diskualifikasi UAS otomatis ke huruf E), Tugas: 15, Kuis: 37.5, UTS: 42, UAS: 0
  //    NA = (5.56) + (3.0) + (7.5) + (10.5) + (0) = 26.56 ➔ E (0.00) (DRAFT)
  //
  // 4. Riri Williams:
  //    Absen: 100, Tugas: 90, Kuis: 89, UTS: 89, UAS: 91
  //    NA = (10) + (18.0) + (17.8) + (22.25) + (22.75) = 90.80 ➔ A (4.00) (DRAFT)
  const finalGradesData = [
    {
      studentId: nakiaUser.id,
      attendanceScore: '100.00',
      assignmentScore: '96.00',
      quizScore: '93.50',
      midtermScore: '94.00',
      finalExamScore: '92.00',
      totalScore: '94.40',
      letterGrade: 'A',
      gradePoint: '4.00',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      approvedBy: shuriUser.id
    },
    {
      studentId: mbakuUser.id,
      attendanceScore: '77.80',
      assignmentScore: '71.00',
      quizScore: '62.50',
      midtermScore: '62.00',
      finalExamScore: '65.00',
      totalScore: '66.23',
      letterGrade: 'BC',
      gradePoint: '2.50',
      status: 'DRAFT' as const,
      publishedAt: null,
      approvedBy: null
    },
    {
      studentId: erikUser.id,
      attendanceScore: '55.60',
      assignmentScore: '15.00',
      quizScore: '37.50',
      midtermScore: '42.00',
      finalExamScore: '0.00',
      totalScore: '26.56',
      letterGrade: 'E',
      gradePoint: '0.00',
      status: 'DRAFT' as const,
      publishedAt: null,
      approvedBy: null
    },
    {
      studentId: ririUser.id,
      attendanceScore: '100.00',
      assignmentScore: '90.00',
      quizScore: '89.00',
      midtermScore: '89.00',
      finalExamScore: '91.00',
      totalScore: '90.80',
      letterGrade: 'A',
      gradePoint: '4.00',
      status: 'DRAFT' as const,
      publishedAt: null,
      approvedBy: null
    }
  ]

  for (const fg of finalGradesData) {
    await db
      .insert(finalGrades)
      .values({
        classId: seededClass.id,
        ...fg
      })
      .onConflictDoUpdate({
        target: [finalGrades.classId, finalGrades.studentId],
        set: {
          attendanceScore: fg.attendanceScore,
          assignmentScore: fg.assignmentScore,
          quizScore: fg.quizScore,
          midtermScore: fg.midtermScore,
          finalExamScore: fg.finalExamScore,
          totalScore: fg.totalScore,
          letterGrade: fg.letterGrade,
          gradePoint: fg.gradePoint,
          status: fg.status,
          publishedAt: fg.publishedAt,
          approvedBy: fg.approvedBy,
          updatedAt: new Date()
        }
      })
  }
  console.log(`  ✓ Rekapitulasi Nilai Akhir (Gradebook) & Indeks Nilai A-E Tersinkronisasi`)

  // 16. Seed Materi Perkuliahan Awal (Session Materials)
  const sampleMaterials = [
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

  for (const mat of sampleMaterials) {
    const sess = sessionMap.get(mat.sessionNum)!
    const existing = await db
      .select()
      .from(sessionMaterials)
      .where(and(eq(sessionMaterials.sessionId, sess.id), eq(sessionMaterials.title, mat.title)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(sessionMaterials).values({
        sessionId: sess.id,
        title: mat.title,
        description: `Bahan ajar resmi pertemuan ke-${mat.sessionNum}`,
        materialType: mat.materialType,
        fileName: mat.fileName,
        fileUrl: mat.fileUrl,
        fileSize: 1024 * 512,
        orderIndex: 1,
        isPublished: true
      })
    }
  }
  console.log(`  ✓ Materi Ajar Perkuliahan Tersinkronisasi`)

  // 17. Cetak Tabel Ringkasan Kredensial 7 Akun Dummy
  console.log('\n' + '='.repeat(105))
  console.log('   🏛️  TABEL KREDENSIAL 7 AKUN DUMMY UTAMA INSTITUT TEKNOLOGI WAKANDA')
  console.log('='.repeat(105))
  console.table(
    rawUsers.map(u => ({
      'Role': u.role.toUpperCase(),
      'Nama Lengkap': u.name,
      'NIM / NIDN': u.nimNidn,
      'Email Login': u.email,
      'Password Seragam': u.plainPassword,
      'Status / Skenario EWS': u.ewsScenario
    }))
  )
  console.log('='.repeat(105))
  console.log('  ✨  PROSES SEEDING SELESAI SECARA IDEMPOTENT KE DATABASE NEON!')
  console.log('  🔑  Seluruh 7 akun dummy kini siap digunakan untuk login dengan password: Password123!')
  console.log('='.repeat(105) + '\n')
}

// Run seeder
seed()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Terjadi kesalahan saat menjalankan database seeder:', err)
    process.exit(1)
  })
