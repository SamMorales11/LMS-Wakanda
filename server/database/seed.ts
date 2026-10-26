import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { eq, sql, not } from 'drizzle-orm'
import {
  db,
  pingDatabase,
  programs,
  academicTerms,
  users,
  courses
} from './index'

interface SeedUserCredential {
  email: string
  name: string
  role: 'admin' | 'lecturer' | 'student'
  nimNidn: string
  plainPassword: string
  phoneNumber?: string
  avatarUrl?: string
}

async function seed() {
  console.log('='.repeat(70))
  console.log('  🏛️  INSTITUT TEKNOLOGI WAKANDA - DATABASE SEEDER (IDEMPOTENT)')
  console.log('='.repeat(70))

  // 1. Verify Database Connection
  console.log('\n[1/5] Memverifikasi konektivitas ke Neon PostgreSQL...')
  const isConnected = await pingDatabase()
  if (!isConnected) {
    throw new Error('Koneksi ke Neon PostgreSQL gagal. Pastikan DATABASE_URL valid.')
  }
  console.log('  ✓ Terhubung sukses ke Neon Serverless PostgreSQL!')

  // 2. Seed Program Studi (Programs)
  console.log('\n[2/5] Menyemai data Program Studi (Programs)...')
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
  console.log(`  ✓ Berhasil menyinkronkan ${seededPrograms.length} Program Studi:`)
  seededPrograms.forEach(p => console.log(`    - [${p.code}] ${p.name}`))

  // 3. Seed Tahun Akademik Aktif (Academic Term 20261)
  console.log('\n[3/5] Menyemai Tahun Akademik Aktif (Kode: 20261)...')
  const activeTermData = {
    code: '20261',
    name: 'Tahun Akademik 2026/2027 - Semester Ganjil',
    year: '2026/2027',
    semester: 'ODD' as const,
    startDate: '2026-09-01',
    endDate: '2027-01-31',
    isActive: true
  }

  // Ensure other terms are deactivated so 20261 is the sole active term
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

  console.log(`  ✓ Berhasil mengaktifkan Tahun Akademik: [${seededTerm.code}] ${seededTerm.name}`)

  // 4. Seed User Accounts dengan Secure Password Hashing
  console.log('\n[4/5] Menyemai Akun Pengguna (Admin, Dosen NIDN, Mahasiswa NIM)...')
  const rawUsers: SeedUserCredential[] = [
    // --- Admin Akademik ---
    {
      name: 'Shuri Al-Wakanda, M.Kom.',
      email: 'admin.akademik@itw.ac.id',
      role: 'admin',
      nimNidn: 'ADM-202601',
      plainPassword: 'AdminWakanda2026!',
      phoneNumber: '+628119876543',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=shuri-admin'
    },
    {
      name: 'Biro Administrasi Akademik (BAA)',
      email: 'baa@itw.ac.id',
      role: 'admin',
      nimNidn: 'ADM-202602',
      plainPassword: 'AdminWakanda2026!',
      phoneNumber: '+628119876544',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=baa-admin'
    },

    // --- Dosen Pengampu (NIDN) ---
    {
      name: "Prof. Dr. T'Challa Udaku, M.Sc.",
      email: 'tchalla.dosen@itw.ac.id',
      role: 'lecturer',
      nimNidn: '0012058001',
      plainPassword: 'DosenWakanda2026!',
      phoneNumber: '+628123456781',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tchalla-lecturer'
    },
    {
      name: "Dr. Nakia N'Jobu, S.T., M.T.",
      email: 'nakia.dosen@itw.ac.id',
      role: 'lecturer',
      nimNidn: '0023088502',
      plainPassword: 'DosenWakanda2026!',
      phoneNumber: '+628123456782',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nakia-lecturer'
    },
    {
      name: "W'Kabi Ramonda, M.Kom.",
      email: 'wkabi.dosen@itw.ac.id',
      role: 'lecturer',
      nimNidn: '0015039003',
      plainPassword: 'DosenWakanda2026!',
      phoneNumber: '+628123456783',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wkabi-lecturer'
    },

    // --- Mahasiswa (NIM) ---
    {
      name: 'Okoye Generalia',
      email: 'okoye.mhs@mhs.itw.ac.id',
      role: 'student',
      nimNidn: '2611501001',
      plainPassword: 'MhsWakanda2026!',
      phoneNumber: '+6285211223344',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=okoye-student'
    },
    {
      name: 'Ayo Dora-Milaje',
      email: 'ayo.mhs@mhs.itw.ac.id',
      role: 'student',
      nimNidn: '2611501002',
      plainPassword: 'MhsWakanda2026!',
      phoneNumber: '+6285211223345',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ayo-student'
    },
    {
      name: "M'Baku Jabari",
      email: 'mbaku.mhs@mhs.itw.ac.id',
      role: 'student',
      nimNidn: '2611501003',
      plainPassword: 'MhsWakanda2026!',
      phoneNumber: '+6285211223346',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mbaku-student'
    }
  ]

  const userInsertValues = await Promise.all(
    rawUsers.map(async u => {
      const passwordHash = await bcrypt.hash(u.plainPassword, 10)
      return {
        name: u.name,
        email: u.email.toLowerCase().trim(),
        passwordHash,
        role: u.role,
        nimNidn: u.nimNidn,
        phoneNumber: u.phoneNumber,
        avatarUrl: u.avatarUrl,
        isActive: true
      }
    })
  )

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
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, nimNidn: users.nimNidn })

  console.log(`  ✓ Berhasil menyinkronkan ${seededUsers.length} Akun Pengguna:`)
  seededUsers.forEach(u => console.log(`    - [${u.role.toUpperCase()}] ${u.name} (${u.nimNidn || '-'}) -> ${u.email}`))

  // 5. Seed Master Mata Kuliah Awal (Courses)
  console.log('\n[5/5] Menyemai data Master Mata Kuliah Awal (Courses)...')
  const tifId = programMap.get('TIF')
  const rplId = programMap.get('RPL')
  const vibId = programMap.get('TEK-VIB')

  if (!tifId || !rplId || !vibId) {
    throw new Error('ID Program Studi tidak ditemukan untuk seeding mata kuliah.')
  }

  const courseList = [
    // S1 Teknik Informatika
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
      code: 'IF102',
      name: 'Struktur Data & Kompleksitas Algoritma',
      credits: 4,
      semester: 2,
      description: 'Struktur data linear dan non-linear: Linked List, Stack, Queue, Tree, Graph, dan analisis Big-O.',
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

    // S1 Rekayasa Perangkat Lunak
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
      programId: rplId,
      code: 'SE201',
      name: 'Pola Desain Perangkat Lunak (Design Patterns)',
      credits: 3,
      semester: 3,
      description: 'Pola desain GoF: Creational, Structural, dan Behavioral patterns pada sistem perangkat lunak.',
      isActive: true
    },
    {
      programId: rplId,
      code: 'SE301',
      name: 'Penjaminan Kualitas & Pengujian Software',
      credits: 3,
      semester: 5,
      description: 'Automated testing, unit testing, integration testing, E2E testing, dan continuous integration (CI/CD).',
      isActive: true
    },

    // S1 Teknik Siber & Vibranium
    {
      programId: vibId,
      code: 'CY101',
      name: 'Kriptografi & Keamanan Sistem Komputer',
      credits: 3,
      semester: 1,
      description: 'Enkripsi simetrik/asimetrik, hashing kriptografi, digital signature, dan sertifikat digital.',
      isActive: true
    },
    {
      programId: vibId,
      code: 'CY201',
      name: 'Keamanan Jaringan & Pertahanan Siber Wakanda',
      credits: 4,
      semester: 3,
      description: 'Arsitektur pertahanan perimeter jaringan, firewall, deteksi intrusi, dan protokol zero-trust.',
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

  console.log(`  ✓ Berhasil menyinkronkan ${seededCourses.length} Master Mata Kuliah:`)
  seededCourses.forEach(c => console.log(`    - [${c.code}] ${c.name} (${c.credits} SKS)`))

  // Print Summary Table of Credentials
  console.log('\n' + '='.repeat(70))
  console.log('  📋  KREDENSIAL PENGGUNA AWAL (DEFAULT TEST ACCOUNTS)')
  console.log('='.repeat(70))
  console.table(
    rawUsers.map(u => ({
      Role: u.role.toUpperCase(),
      Nama: u.name,
      'NIM / NIDN': u.nimNidn,
      Email: u.email,
      Password: u.plainPassword
    }))
  )
  console.log('='.repeat(70))
  console.log('  ✨  PROSES SEEDING SELESAI DENGAN SUKSES & IDEMPOTENT!')
  console.log('='.repeat(70) + '\n')
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
