import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { eq, sql, and, not, inArray } from 'drizzle-orm'
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
  sessionMaterials,
  materialReadProgress
} from './index'
import {
  seedPrograms,
  seedActiveTerm,
  seedUsers,
  seedCourses,
  seedClasses,
  classEnrollmentEmails,
  courseCurriculums,
  quizMasterData,
  assignmentMasterData,
  seedGradeWeights,
  if2041AttendanceTelemetry,
  // === BAGIAN KEDUA (PENUTUP) ===
  attendanceTokensP10,
  supportingStudentAttendanceProfiles,
  classAssignmentsConfig,
  classQuizzesConfig,
  supportingStudentGradeProfiles,
  generateSupportingSubmissions,
  generateSupportingQuizAttempt,
  classMaterialsMap
} from './seed-data'

async function seed() {
  console.log('='.repeat(90))
  console.log('  🏛️  INSTITUT TEKNOLOGI WAKANDA - REALISTIC INSTITUTIONAL DATABASE SEEDER')
  console.log('='.repeat(90))

  // --------------------------------------------------------------------------
  // 1. Verify Database Connection
  // --------------------------------------------------------------------------
  console.log('\n[1/16] Memverifikasi konektivitas ke Neon Serverless PostgreSQL...')
  const isConnected = await pingDatabase()
  if (!isConnected) {
    throw new Error('Koneksi ke Neon PostgreSQL gagal. Pastikan DATABASE_URL valid.')
  }
  console.log('  ✓ Terhubung sukses ke Neon Serverless PostgreSQL!')

  // --------------------------------------------------------------------------
  // 2. Seed Programs (Program Studi)
  // --------------------------------------------------------------------------
  console.log('\n[2/16] Menyemai data Program Studi (Programs)...')
  const seededPrograms = await db
    .insert(programs)
    .values(seedPrograms)
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
  console.log(`  ✓ Berhasil menyinkronkan ${seededPrograms.length} Program Studi (${seededPrograms.map(p => p.code).join(', ')})`)

  // --------------------------------------------------------------------------
  // 3. Seed Tahun Akademik Aktif (Academic Term 20261)
  // --------------------------------------------------------------------------
  console.log('\n[3/16] Menyemai Tahun Akademik Aktif (Kode: 20261)...')
  // Deaktivasi semester lain agar 20261 menjadi satu-satunya semester aktif
  await db
    .update(academicTerms)
    .set({ isActive: false, updatedAt: new Date() })
    .where(not(eq(academicTerms.code, seedActiveTerm.code)))

  const [seededTerm] = await db
    .insert(academicTerms)
    .values(seedActiveTerm)
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

  // --------------------------------------------------------------------------
  // 4. Seed Users: 1 Admin, 3 Dosen, 18 Mahasiswa (Uniform: Password123!)
  // --------------------------------------------------------------------------
  console.log('\n[4/16] Menyemai seluruh 22 Akun Dummy ITW (1 Admin, 3 Dosen, 18 Mahasiswa)...')
  const uniformPasswordHash = await bcrypt.hash('Password123!', 10)

  const userInsertValues = seedUsers.map(u => ({
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

  const userMap = new Map(seededUsers.map(u => [u.email.toLowerCase().trim(), u]))
  console.log(`  ✓ Berhasil menyinkronkan ${seededUsers.length} Pengguna Institusional:`)
  console.log(`    - 1 Administrator (${userMap.get('admin@wakanda.ac.id')?.name})`)
  console.log(`    - 3 Dosen Pengampu (${userMap.get('shuri@lecturer.wakanda.ac.id')?.name}, ${userMap.get('tchalla@lecturer.wakanda.ac.id')?.name}, ${userMap.get('wkabi@lecturer.wakanda.ac.id')?.name})`)
  console.log(`    - 18 Mahasiswa (Termasuk 4 Persona Demo Inti: Nakia, M'Baku, Erik, Riri)`)

  // --------------------------------------------------------------------------
  // 5. Seed Master Mata Kuliah (Courses)
  // --------------------------------------------------------------------------
  console.log('\n[5/16] Menyemai data Master Mata Kuliah (Courses)...')
  const courseInsertValues = seedCourses.map(c => {
    const pId = programMap.get(c.programCode)
    if (!pId) throw new Error(`Program dengan kode ${c.programCode} tidak ditemukan`)
    return {
      programId: pId,
      code: c.code,
      name: c.name,
      credits: c.credits,
      semester: c.semester,
      description: c.description,
      isActive: c.isActive
    }
  })

  const seededCourses = await db
    .insert(courses)
    .values(courseInsertValues)
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
  console.log(`  ✓ Berhasil menyinkronkan ${seededCourses.length} Mata Kuliah (${seededCourses.map(c => c.code).join(', ')})`)

  // --------------------------------------------------------------------------
  // 6. Seed Tepat 5 Kelas Aktif & Bersihkan Kelas Lama
  // --------------------------------------------------------------------------
  console.log('\n[6/16] Menyemai Tepat 5 Kelas Perkuliahan Aktif & Membersihkan Kelas Lama...')
  const officialClassIds: string[] = []
  const classMap = new Map<string, typeof courseClasses.$inferSelect>()

  for (const c of seedClasses) {
    const courseId = courseMap.get(c.courseCode)
    if (!courseId) throw new Error(`Mata kuliah ${c.courseCode} tidak ditemukan`)

    const [sc] = await db
      .insert(courseClasses)
      .values({
        courseId,
        academicTermId: seededTerm.id,
        code: c.code,
        capacity: c.capacity,
        room: c.room,
        scheduleDay: c.scheduleDay,
        scheduleStart: c.scheduleStart,
        scheduleEnd: c.scheduleEnd,
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

    officialClassIds.push(sc.id)
    classMap.set(`${c.courseCode}:${c.code}`, sc)
  }

  // Bersihkan kelas lama yang tidak termasuk dalam 5 kelas resmi ini
  const deletedOldClasses = await db
    .delete(courseClasses)
    .where(not(inArray(courseClasses.id, officialClassIds)))
    .returning({ id: courseClasses.id, code: courseClasses.code })

  if (deletedOldClasses.length > 0) {
    console.log(`  ✓ Membersihkan ${deletedOldClasses.length} kelas lama di luar 5 kelas resmi`)
  }
  console.log(`  ✓ Tepat 5 Kelas Aktif Tersinkronisasi (Total Kapasitas: 150 Mahasiswa):`)
  seedClasses.forEach(c => {
    const cl = classMap.get(`${c.courseCode}:${c.code}`)!
    console.log(`    - [${c.courseCode}-${c.code}] ${cl.room} (${c.scheduleDay} ${c.scheduleStart.slice(0, 5)}-${c.scheduleEnd.slice(0, 5)})`)
  })

  // --------------------------------------------------------------------------
  // 7. Seed Pengampu Dosen (Class Lecturers)
  // --------------------------------------------------------------------------
  console.log('\n[7/16] Menugaskan Dosen Pengampu untuk 5 Kelas Perkuliahan...')
  for (const c of seedClasses) {
    const cl = classMap.get(`${c.courseCode}:${c.code}`)!
    const primaryUser = userMap.get(c.primaryLecturerEmail.toLowerCase().trim())
    if (!primaryUser) throw new Error(`Dosen utama ${c.primaryLecturerEmail} tidak ditemukan`)

    const lecturerRows: { classId: string; lecturerId: string; isPrimary: boolean }[] = [
      { classId: cl.id, lecturerId: primaryUser.id, isPrimary: true }
    ]

    if (c.assistantLecturerEmail) {
      const assistantUser = userMap.get(c.assistantLecturerEmail.toLowerCase().trim())
      if (assistantUser) {
        lecturerRows.push({ classId: cl.id, lecturerId: assistantUser.id, isPrimary: false })
      }
    }

    for (const lr of lecturerRows) {
      await db
        .insert(classLecturers)
        .values(lr)
        .onConflictDoUpdate({
          target: [classLecturers.classId, classLecturers.lecturerId],
          set: { isPrimary: lr.isPrimary }
        })
    }
    console.log(`  ✓ Kelas [${c.courseCode}-${c.code}] diampu oleh ${primaryUser.name}${c.assistantLecturerEmail ? ' (Didampingi)' : ''}`)
  }

  // --------------------------------------------------------------------------
  // 8. Seed Enrollments Mahasiswa (10-12 Mahasiswa per Kelas)
  // --------------------------------------------------------------------------
  console.log('\n[8/16] Mendaftarkan Mahasiswa ke 5 Kelas Perkuliahan (10-12 Mahasiswa per Kelas)...')
  for (const [classKey, studentEmails] of Object.entries(classEnrollmentEmails)) {
    const cl = classMap.get(classKey)
    if (!cl) continue

    const enrolledStudents = studentEmails
      .map(email => userMap.get(email.toLowerCase().trim()))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))

    const enrollmentValues = enrolledStudents.map(s => ({
      classId: cl.id,
      studentId: s.id,
      status: 'ENROLLED' as const,
      enrolledAt: new Date('2026-09-01T08:00:00Z'),
      updatedAt: new Date()
    }))

    for (const ev of enrollmentValues) {
      await db
        .insert(classEnrollments)
        .values(ev)
        .onConflictDoUpdate({
          target: [classEnrollments.classId, classEnrollments.studentId],
          set: { status: sql`EXCLUDED.status`, updatedAt: new Date() }
        })
    }
    console.log(`  ✓ Kelas [${classKey}] -> ${enrolledStudents.length} Mahasiswa terdaftar`)
  }

  // --------------------------------------------------------------------------
  // 9. Seed 16 Pertemuan per Kelas (P-1..P-9 COMPLETED, P-10 IN_PROGRESS, P-11..P-16 SCHEDULED)
  // --------------------------------------------------------------------------
  console.log('\n[9/16] Menyemai Struktur 16 Pertemuan Perkuliahan untuk ke-5 Kelas...')
  const sessionMaps = new Map<string, Map<number, typeof classSessions.$inferSelect>>()

  for (const c of seedClasses) {
    const cl = classMap.get(`${c.courseCode}:${c.code}`)!
    const curriculum = courseCurriculums[c.courseCode] || courseCurriculums.IF2041
    const baseDate = new Date(c.baseDate + 'T00:00:00Z')

    const sessionValues = curriculum.map(t => {
      const sDate = new Date(baseDate)
      sDate.setDate(sDate.getDate() + (t.num - 1) * 7)

      return {
        classId: cl.id,
        sessionNumber: t.num,
        title: t.title,
        topicDescription: t.topicDescription,
        sessionDate: sDate.toISOString().split('T')[0],
        startTime: c.scheduleStart,
        endTime: c.scheduleEnd,
        sessionType: t.type,
        status: t.status,
        updatedAt: new Date()
      }
    })

    const seededSessions = await db
      .insert(classSessions)
      .values(sessionValues)
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

    const mapForClass = new Map(seededSessions.map(s => [s.sessionNumber, s]))
    sessionMaps.set(`${c.courseCode}:${c.code}`, mapForClass)
    console.log(`  ✓ Kelas [${c.courseCode}-${c.code}] -> 16 Sesi Tersinkronisasi (P1-P9 Selesai, P10 Berjalan, P11-P16 Terjadwal)`)
  }

  // --------------------------------------------------------------------------
  // 10. Seed Bobot Gradebook Resmi untuk Seluruh 5 Kelas
  // --------------------------------------------------------------------------
  console.log('\n[10/16] Menetapkan Bobot Penilaian Gradebook Standar ITW untuk Seluruh Kelas...')
  for (const c of seedClasses) {
    const cl = classMap.get(`${c.courseCode}:${c.code}`)!
    for (const w of seedGradeWeights) {
      await db
        .insert(gradeWeights)
        .values({
          classId: cl.id,
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
  }
  console.log('  ✓ Bobot Gradebook Ditetapkan: Absensi 10%, Tugas 20%, Kuis 20%, UTS 25%, UAS 25% (Total 100%)')

  // ==========================================================================
  // BAGIAN KEDUA (PENUTUP) - SEEDING TRANSAKSIONAL LENGKAP 5 KELAS AKTIF
  // ==========================================================================

  // --------------------------------------------------------------------------
  // 11. Seeding Materials (P-1 s/d P-9) & Material Read Progress Seluruh 5 Kelas
  // --------------------------------------------------------------------------
  console.log('\n[11/16] Menyemai Bahan Ajar (Materials P-1 s/d P-9) & Read Progress untuk 5 Kelas...')
  let totalMaterialsCount = 0
  let totalReadProgressCount = 0

  for (const [classKey, materials] of Object.entries(classMaterialsMap)) {
    const sessionMap = sessionMaps.get(classKey)
    if (!sessionMap) continue

    const enrolledEmails = classEnrollmentEmails[classKey] || []

    for (const mat of materials) {
      const sess = sessionMap.get(mat.sessionNum)
      if (!sess) continue

      const existing = await db
        .select()
        .from(sessionMaterials)
        .where(and(eq(sessionMaterials.sessionId, sess.id), eq(sessionMaterials.title, mat.title)))
        .limit(1)

      let materialId: string
      if (existing.length > 0) {
        materialId = existing[0].id
        await db
          .update(sessionMaterials)
          .set({
            description: `Bahan ajar resmi pertemuan ke-${mat.sessionNum}`,
            materialType: mat.materialType,
            fileName: mat.fileName,
            fileUrl: mat.fileUrl,
            orderIndex: mat.orderIndex,
            isPublished: true,
            updatedAt: new Date()
          })
          .where(eq(sessionMaterials.id, materialId))
      } else {
        const [inserted] = await db
          .insert(sessionMaterials)
          .values({
            sessionId: sess.id,
            title: mat.title,
            description: `Bahan ajar resmi pertemuan ke-${mat.sessionNum}`,
            materialType: mat.materialType,
            fileName: mat.fileName,
            fileUrl: mat.fileUrl,
            fileSize: 1024 * 512,
            orderIndex: mat.orderIndex,
            isPublished: true
          })
          .returning({ id: sessionMaterials.id })
        materialId = inserted.id
      }
      totalMaterialsCount++

      // Material Read Progress:
      // Nakia & Riri: mahasiswa teladan, selalu membaca seluruh materi
      // Mahasiswa SAFE: okoye, ramonda, zuri, griot, kaluu juga rajin membaca
      // M'Baku, Ayo, Bucky: membaca sebagian (pertemuan <= 5)
      for (const email of enrolledEmails) {
        const student = userMap.get(email.toLowerCase().trim())
        if (!student) continue

        const isDilligent = ['nakia@student.wakanda.ac.id', 'riri@student.wakanda.ac.id', 'okoye@student.wakanda.ac.id', 'ramonda@student.wakanda.ac.id'].includes(email)
        const isModerate = ['mbaku@student.wakanda.ac.id', 'ayo@student.wakanda.ac.id', 'bucky@student.wakanda.ac.id', 'sam@student.wakanda.ac.id'].includes(email)

        if (isDilligent || (isModerate && mat.sessionNum <= 5)) {
          await db
            .insert(materialReadProgress)
            .values({
              materialId,
              studentId: student.id,
              isCompleted: true,
              completedAt: new Date(new Date(sess.sessionDate + 'T12:00:00Z').getTime() + 86400_000)
            })
            .onConflictDoNothing({
              target: [materialReadProgress.materialId, materialReadProgress.studentId]
            })
          totalReadProgressCount++
        }
      }
    }
  }
  console.log(`  ✓ Berhasil menyinkronkan ${totalMaterialsCount} bahan ajar dan ${totalReadProgressCount} progres bacaan`)

  // --------------------------------------------------------------------------
  // 12. Seeding 5 Token Presensi Aktif 24 Jam pada Sesi 10
  // --------------------------------------------------------------------------
  console.log('\n[12/16] Menerbitkan Token Presensi Aktif 24 Jam pada Sesi 10 (P-10 IN_PROGRESS)...')
  for (const [classKey, tokenCfg] of Object.entries(attendanceTokensP10)) {
    const sessionMap = sessionMaps.get(classKey)
    if (!sessionMap) continue
    const session10 = sessionMap.get(10)
    if (!session10) continue

    const lecturer = userMap.get(tokenCfg.lecturerEmail.toLowerCase().trim())
    if (!lecturer) continue

    await db
      .insert(attendanceTokens)
      .values({
        sessionId: session10.id,
        token: tokenCfg.pin,
        qrCodePayload: `WAKANDA_ATT:${session10.id}:${tokenCfg.pin}`,
        validFrom: new Date(Date.now() - 3600_000),
        validUntil: new Date(Date.now() + 24 * 3600_000),
        isActive: true,
        createdBy: lecturer.id
      })
      .onConflictDoUpdate({
        target: attendanceTokens.token,
        set: {
          sessionId: sql`EXCLUDED.session_id`,
          qrCodePayload: sql`EXCLUDED.qr_code_payload`,
          validFrom: sql`EXCLUDED.valid_from`,
          validUntil: sql`EXCLUDED.valid_until`,
          isActive: true
        }
      })
    console.log(`  ✓ Kelas [${classKey}] -> PIN Token: ${tokenCfg.pin} (Dosen: ${lecturer.name}, Berlaku 24 Jam)`)
  }

  // --------------------------------------------------------------------------
  // 13. Seeding Riwayat Attendance Logs Sesi P-1 s/d P-9 untuk Seluruh Kelas
  // --------------------------------------------------------------------------
  console.log('\n[13/16] Menyemai Riwayat Presensi (Attendance Logs Sesi P-1 s/d P-9)...')
  // Hapus log presensi sesi 10-16 jika ada, agar tepat sesi 1-9 yang memiliki riwayat log
  const staleSessionIds: string[] = []
  for (const [, sessionMap] of sessionMaps) {
    for (let sNum = 10; sNum <= 16; sNum++) {
      const sess = sessionMap.get(sNum)
      if (sess) staleSessionIds.push(sess.id)
    }
  }
  if (staleSessionIds.length > 0) {
    await db.delete(attendanceLogs).where(inArray(attendanceLogs.sessionId, staleSessionIds))
  }

  let totalAttendanceLogsCount = 0
  for (const [classKey, studentEmails] of Object.entries(classEnrollmentEmails)) {
    const sessionMap = sessionMaps.get(classKey)
    if (!sessionMap) continue

    for (let sNum = 1; sNum <= 9; sNum++) {
      const sess = sessionMap.get(sNum)
      if (!sess) continue

      for (const email of studentEmails) {
        const student = userMap.get(email.toLowerCase().trim())
        if (!student) continue

        let status: 'PRESENT' | 'LATE' | 'PERMIT' | 'SICK' | 'ABSENT' = 'PRESENT'
        let checkInMethod: 'TOKEN' | 'QR_SCAN' | 'MANUAL_LECTURER' = 'TOKEN'
        let notes: string | null = 'Hadir tepat waktu'

        // Demo persona khusus:
        if (email === 'nakia@student.wakanda.ac.id') {
          status = 'PRESENT'
          checkInMethod = 'TOKEN'
          notes = 'Hadir tepat waktu'
        } else if (email === 'riri@student.wakanda.ac.id') {
          status = 'PRESENT'
          checkInMethod = 'QR_SCAN'
          notes = 'Hadir via scan QR dinamis'
        } else if (email === 'mbaku@student.wakanda.ac.id') {
          if (classKey === 'IF2041:A') {
            const rule = if2041AttendanceTelemetry.mbakuRules(sNum)
            status = rule.status
            checkInMethod = rule.method
            notes = rule.note
          } else {
            if (sNum === 4) {
              status = 'LATE'
              checkInMethod = 'TOKEN'
              notes = 'Terlambat 15 menit karena kendala transportasi'
            } else if (sNum === 6) {
              status = 'SICK'
              checkInMethod = 'MANUAL_LECTURER'
              notes = 'Izin sakit dengan surat dokter'
            } else if (sNum === 7) {
              status = 'ABSENT'
              checkInMethod = 'MANUAL_LECTURER'
              notes = 'Alpa tanpa keterangan'
            } else {
              status = 'PRESENT'
              checkInMethod = 'TOKEN'
              notes = 'Hadir'
            }
          }
        } else if (email === 'erik@student.wakanda.ac.id') {
          if (classKey === 'IF2041:A') {
            const rule = if2041AttendanceTelemetry.erikRules(sNum)
            status = rule.status
            checkInMethod = rule.method
            notes = rule.note
          } else {
            if ([2, 4, 5, 7].includes(sNum)) {
              status = 'ABSENT'
              checkInMethod = 'MANUAL_LECTURER'
              notes = 'Tidak hadir tanpa pemberitahuan'
            } else {
              status = 'PRESENT'
              checkInMethod = 'TOKEN'
              notes = 'Hadir'
            }
          }
        } else {
          // 14 Mahasiswa pendukung
          const profile = supportingStudentAttendanceProfiles.find(p => p.email === email)
          if (profile) {
            if (profile.absentSessions.includes(sNum)) {
              status = 'ABSENT'
              checkInMethod = 'MANUAL_LECTURER'
              notes = 'Alpa tanpa keterangan resmi'
            } else if (profile.sickSessions.includes(sNum)) {
              status = 'SICK'
              checkInMethod = 'MANUAL_LECTURER'
              notes = 'Izin sakit dengan surat dokter'
            } else if (profile.lateSessions.includes(sNum)) {
              status = 'LATE'
              checkInMethod = 'TOKEN'
              notes = 'Terlambat check-in presensi'
            } else {
              status = 'PRESENT'
              checkInMethod = 'TOKEN'
              notes = 'Hadir tepat waktu'
            }
          }
        }

        const baseTime = new Date(`${sess.sessionDate}T08:05:00Z`).getTime()
        const checkInTime = new Date(baseTime + (status === 'LATE' ? 25 * 60_000 : 0))

        await db
          .insert(attendanceLogs)
          .values({
            sessionId: sess.id,
            studentId: student.id,
            status,
            checkInMethod,
            notes,
            checkInTime
          })
          .onConflictDoUpdate({
            target: [attendanceLogs.sessionId, attendanceLogs.studentId],
            set: {
              status,
              checkInMethod,
              notes,
              checkInTime,
              updatedAt: new Date()
            }
          })
        totalAttendanceLogsCount++
      }
    }
  }
  console.log(`  ✓ Berhasil menyinkronkan ${totalAttendanceLogsCount} entri riwayat presensi P-1 s/d P-9`)

  // --------------------------------------------------------------------------
  // 14. Seeding 3 Assignments per Kelas + Submissions + Feedback Dosen
  // --------------------------------------------------------------------------
  console.log('\n[14/16] Menyemai 3 Tugas (Assignments) per Kelas beserta Submissions & Feedback...')
  let totalAssignmentsCount = 0
  let totalSubmissionsCount = 0

  const allAssignmentsConfigs = [
    {
      classKey: 'IF2041:A',
      lecturerEmail: 'shuri@lecturer.wakanda.ac.id',
      assignments: assignmentMasterData
    },
    ...classAssignmentsConfig
  ]

  for (const cfg of allAssignmentsConfigs) {
    const cl = classMap.get(cfg.classKey)
    const sessionMap = sessionMaps.get(cfg.classKey)
    const lecturer = userMap.get(cfg.lecturerEmail.toLowerCase().trim())
    if (!cl || !sessionMap || !lecturer) continue

    const enrolledEmails = classEnrollmentEmails[cfg.classKey] || []

    for (let aIdx = 0; aIdx < cfg.assignments.length; aIdx++) {
      const a = cfg.assignments[aIdx]
      const sess = sessionMap.get(a.sessionNum)
      if (!sess) continue

      const dueDate = new Date(sess.sessionDate)
      dueDate.setDate(dueDate.getDate() + 7)

      const existingAssign = await db
        .select()
        .from(assignments)
        .where(and(eq(assignments.classId, cl.id), eq(assignments.title, a.title)))
        .limit(1)

      let assignId: string
      if (existingAssign.length > 0) {
        assignId = existingAssign[0].id
        await db
          .update(assignments)
          .set({
            sessionId: sess.id,
            description: a.description,
            instructions: a.instructions,
            maxScore: a.maxScore,
            dueDate,
            updatedAt: new Date()
          })
          .where(eq(assignments.id, assignId))
      } else {
        const [newAssign] = await db
          .insert(assignments)
          .values({
            classId: cl.id,
            sessionId: sess.id,
            title: a.title,
            description: a.description,
            instructions: a.instructions,
            maxScore: a.maxScore,
            dueDate,
            allowLateSubmission: true,
            latePenaltyPercentage: '10.00',
            isPublished: true,
            createdBy: lecturer.id
          })
          .returning()
        assignId = newAssign.id
      }
      totalAssignmentsCount++

      // Submissions untuk seluruh mahasiswa di kelas ini
      for (const email of enrolledEmails) {
        const student = userMap.get(email.toLowerCase().trim())
        if (!student) continue

        let score = '85.00'
        let isLate = false
        let feedback = 'Tugas telah dinilai dan memenuhi kriteria dasar.'

        if (email === 'nakia@student.wakanda.ac.id') {
          score = aIdx === 0 ? '96.00' : (aIdx === 1 ? '94.00' : '98.00')
          isLate = false
          feedback = 'Implementasi sangat bersih, modular, dan efisien.'
        } else if (email === 'riri@student.wakanda.ac.id') {
          score = aIdx === 0 ? '90.00' : (aIdx === 1 ? '92.00' : '88.00')
          isLate = false
          feedback = 'Solusi elegan, penanganan error lengkap dan optimal.'
        } else if (email === 'mbaku@student.wakanda.ac.id') {
          score = aIdx === 0 ? '75.00' : (aIdx === 1 ? '68.00' : '70.00')
          isLate = aIdx > 0
          feedback = isLate
            ? 'Pengumpulan terlambat. Struktur kode cukup baik namun belum diuji edge-case.'
            : 'Kode berjalan baik, namun perhatikan kerapihan dan penamaan variabel.'
        } else if (email === 'erik@student.wakanda.ac.id') {
          score = aIdx === 0 ? '45.00' : (aIdx === 1 ? '40.00' : '35.00')
          isLate = true
          feedback = 'Pengumpulan terlambat signifikan. Banyak requirement belum terpenuhi. Hubungi dosen pengampu.'
        } else {
          // Mahasiswa pendukung
          const profile = supportingStudentAttendanceProfiles.find(p => p.email === email)
          const ewsLevel = profile?.ewsLevel || 'SAFE'
          const gen = generateSupportingSubmissions(email, ewsLevel, aIdx)
          score = gen.score
          isLate = gen.isLate
          feedback = gen.feedback
        }

        await db
          .insert(submissions)
          .values({
            assignmentId: assignId,
            studentId: student.id,
            isLate,
            score,
            status: 'GRADED',
            feedback,
            fileKey: `submissions/${assignId}/${student.id}.zip`,
            fileName: 'tugas_praktikum.zip',
            fileSize: 1024 * 350,
            gradedBy: lecturer.id,
            gradedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [submissions.assignmentId, submissions.studentId],
            set: {
              isLate,
              score,
              status: 'GRADED',
              feedback,
              gradedBy: lecturer.id,
              gradedAt: new Date(),
              updatedAt: new Date()
            }
          })
        totalSubmissionsCount++
      }
    }
  }
  console.log(`  ✓ Berhasil menyinkronkan ${totalAssignmentsCount} tugas perkuliahan dan ${totalSubmissionsCount} submissions tergradasi`)

  // --------------------------------------------------------------------------
  // 15. Seeding Quizzes / UTS (3 per Kelas) + Quiz Attempts Seluruh Kelas
  // --------------------------------------------------------------------------
  console.log('\n[15/16] Menyemai Kuis & UTS (3 per Kelas) beserta Quiz Attempts Seluruh Mahasiswa...')
  let totalQuizzesCount = 0
  let totalAttemptsCount = 0

  const allQuizzesConfigs = [
    {
      classKey: 'IF2041:A',
      lecturerEmail: 'shuri@lecturer.wakanda.ac.id',
      quizzes: quizMasterData
    },
    ...classQuizzesConfig
  ]

  for (const cfg of allQuizzesConfigs) {
    const cl = classMap.get(cfg.classKey)
    const sessionMap = sessionMaps.get(cfg.classKey)
    const lecturer = userMap.get(cfg.lecturerEmail.toLowerCase().trim())
    if (!cl || !sessionMap || !lecturer) continue

    const enrolledEmails = classEnrollmentEmails[cfg.classKey] || []

    for (let qIdx = 0; qIdx < cfg.quizzes.length; qIdx++) {
      const q = cfg.quizzes[qIdx]
      const sess = sessionMap.get(q.sessionNum)
      if (!sess) continue

      const startTime = new Date(sess.sessionDate + 'T08:00:00Z')
      const endTime = new Date(sess.sessionDate + 'T12:00:00Z')

      const existingQuiz = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.classId, cl.id), eq(quizzes.title, q.title)))
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
            classId: cl.id,
            sessionId: sess.id,
            title: q.title,
            description: `Evaluasi terstruktur pertemuan ${q.sessionNum} mata kuliah [${cfg.classKey}].`,
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
            createdBy: lecturer.id
          })
          .returning()
        quizId = newQuiz.id
      }
      totalQuizzesCount++

      // Attempts untuk seluruh mahasiswa di kelas ini
      for (const email of enrolledEmails) {
        const student = userMap.get(email.toLowerCase().trim())
        if (!student) continue

        let score = '80.00'
        let autoScore = '80.00'
        let manualScore = '0.00'

        if (email === 'nakia@student.wakanda.ac.id') {
          score = qIdx === 0 ? '95.00' : (qIdx === 1 ? '92.00' : '94.00')
          autoScore = qIdx === 2 ? '40.00' : score
          manualScore = qIdx === 2 ? '54.00' : '0.00'
        } else if (email === 'riri@student.wakanda.ac.id') {
          score = qIdx === 0 ? '88.00' : (qIdx === 1 ? '90.00' : '89.00')
          autoScore = qIdx === 2 ? '40.00' : score
          manualScore = qIdx === 2 ? '49.00' : '0.00'
        } else if (email === 'mbaku@student.wakanda.ac.id') {
          score = qIdx === 0 ? '65.00' : (qIdx === 1 ? '60.00' : '62.00')
          autoScore = qIdx === 2 ? '25.00' : score
          manualScore = qIdx === 2 ? '37.00' : '0.00'
        } else if (email === 'erik@student.wakanda.ac.id') {
          score = qIdx === 0 ? '35.00' : (qIdx === 1 ? '40.00' : '42.00')
          autoScore = qIdx === 2 ? '20.00' : score
          manualScore = qIdx === 2 ? '22.00' : '0.00'
        } else {
          const profile = supportingStudentAttendanceProfiles.find(p => p.email === email)
          const ewsLevel = profile?.ewsLevel || 'SAFE'
          const gen = generateSupportingQuizAttempt(email, ewsLevel, qIdx)
          score = gen.score
          autoScore = gen.autoScore
          manualScore = gen.manualScore
        }

        const existingAtt = await db
          .select()
          .from(quizAttempts)
          .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, student.id)))
          .limit(1)

        if (existingAtt.length > 0) {
          await db
            .update(quizAttempts)
            .set({
              score,
              autoScore,
              manualScore,
              status: 'GRADED',
              submittedAt: new Date(sess.sessionDate + 'T10:00:00Z'),
              gradedBy: lecturer.id,
              gradedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(quizAttempts.id, existingAtt[0].id))
        } else {
          await db.insert(quizAttempts).values({
            quizId,
            studentId: student.id,
            attemptNumber: 1,
            score,
            autoScore,
            manualScore,
            status: 'GRADED',
            startedAt: new Date(sess.sessionDate + 'T08:30:00Z'),
            expiresAt: new Date(sess.sessionDate + 'T10:30:00Z'),
            submittedAt: new Date(sess.sessionDate + 'T10:00:00Z'),
            gradedBy: lecturer.id,
            gradedAt: new Date()
          })
        }
        totalAttemptsCount++
      }
    }
  }
  console.log(`  ✓ Berhasil menyinkronkan ${totalQuizzesCount} kuis & UTS dan ${totalAttemptsCount} quiz attempts tergradasi`)

  // --------------------------------------------------------------------------
  // 16. Seeding Final Grades Distribusi EWS Kontras untuk Seluruh Mahasiswa
  // --------------------------------------------------------------------------
  console.log('\n[16/16] Menetapkan Nilai Akhir (Final Grades) Kontras EWS untuk Seluruh 5 Kelas...')
  let totalFinalGradesCount = 0

  for (const [classKey, studentEmails] of Object.entries(classEnrollmentEmails)) {
    const cl = classMap.get(classKey)
    if (!cl) continue
    const classConfig = seedClasses.find(c => `${c.courseCode}:${c.code}` === classKey)
    const lecturer = userMap.get(classConfig?.primaryLecturerEmail?.toLowerCase().trim() || '')

    for (const email of studentEmails) {
      const student = userMap.get(email.toLowerCase().trim())
      if (!student) continue

      let attendanceScore = '100.00'
      let assignmentScore = '88.00'
      let quizScore = '85.00'
      let midtermScore = '86.00'
      let finalExamScore = '88.00'
      let totalScore = '88.10'
      let letterGrade = 'A'
      let gradePoint = '4.00'
      let status: 'DRAFT' | 'PUBLISHED' = 'DRAFT'

      if (email === 'nakia@student.wakanda.ac.id') {
        attendanceScore = '100.00'
        assignmentScore = '96.00'
        quizScore = '93.50'
        midtermScore = '94.00'
        finalExamScore = '92.00'
        totalScore = '94.10'
        letterGrade = 'A'
        gradePoint = '4.00'
        status = 'PUBLISHED'
      } else if (email === 'riri@student.wakanda.ac.id') {
        attendanceScore = '100.00'
        assignmentScore = '90.00'
        quizScore = '89.00'
        midtermScore = '89.00'
        finalExamScore = '91.00'
        totalScore = '90.80'
        letterGrade = 'A'
        gradePoint = '4.00'
        status = 'PUBLISHED'
      } else if (email === 'mbaku@student.wakanda.ac.id') {
        attendanceScore = '75.00'
        assignmentScore = '71.00'
        quizScore = '62.50'
        midtermScore = '62.00'
        finalExamScore = '68.00'
        totalScore = '66.70'
        letterGrade = 'BC'
        gradePoint = '2.50'
        status = 'DRAFT'
      } else if (email === 'erik@student.wakanda.ac.id') {
        // Diskualifikasi UAS karena kehadiran < 75% -> Nilai E
        attendanceScore = '50.00'
        assignmentScore = '45.00'
        quizScore = '37.50'
        midtermScore = '42.00'
        finalExamScore = '0.00'
        totalScore = '32.00'
        letterGrade = 'E'
        gradePoint = '0.00'
        status = 'DRAFT'
      } else {
        const gradeProf = supportingStudentGradeProfiles.find(p => p.email === email)
        if (gradeProf) {
          attendanceScore = gradeProf.attendanceScore
          assignmentScore = gradeProf.assignmentScore
          quizScore = gradeProf.quizScore
          midtermScore = gradeProf.midtermScore
          finalExamScore = gradeProf.finalExamScore
          totalScore = gradeProf.totalScore
          letterGrade = gradeProf.letterGrade
          gradePoint = gradeProf.gradePoint
          status = gradeProf.status
        }
      }

      await db
        .insert(finalGrades)
        .values({
          classId: cl.id,
          studentId: student.id,
          attendanceScore,
          assignmentScore,
          quizScore,
          midtermScore,
          finalExamScore,
          totalScore,
          letterGrade,
          gradePoint,
          status,
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
          approvedBy: status === 'PUBLISHED' && lecturer ? lecturer.id : null
        })
        .onConflictDoUpdate({
          target: [finalGrades.classId, finalGrades.studentId],
          set: {
            attendanceScore,
            assignmentScore,
            quizScore,
            midtermScore,
            finalExamScore,
            totalScore,
            letterGrade,
            gradePoint,
            status,
            publishedAt: status === 'PUBLISHED' ? new Date() : null,
            approvedBy: status === 'PUBLISHED' && lecturer ? lecturer.id : null,
            updatedAt: new Date()
          }
        })
      totalFinalGradesCount++
    }
  }
  console.log(`  ✓ Berhasil menetapkan ${totalFinalGradesCount} nilai akhir (Final Grades) kontras EWS across 5 kelas`)

  // --------------------------------------------------------------------------
  // Ringkasan Kredensial 8 Akun Terproteksi (7 Akun Utama + W'Kabi)
  // --------------------------------------------------------------------------
  const protectedEmails = [
    'admin@wakanda.ac.id',
    'shuri@lecturer.wakanda.ac.id',
    'tchalla@lecturer.wakanda.ac.id',
    'wkabi@lecturer.wakanda.ac.id',
    'nakia@student.wakanda.ac.id',
    'mbaku@student.wakanda.ac.id',
    'erik@student.wakanda.ac.id',
    'riri@student.wakanda.ac.id'
  ]

  console.log('\n' + '='.repeat(105))
  console.log('   🏛️  TABEL KREDENSIAL AKUN DEMO TERPROTEKSI INSTITUT TEKNOLOGI WAKANDA')
  console.log('='.repeat(105))
  console.table(
    seedUsers
      .filter(u => protectedEmails.includes(u.email.toLowerCase()))
      .map(u => ({
        Role: u.role.toUpperCase(),
        'Nama Lengkap': u.name,
        'NIM / NIDN': u.nimNidn,
        'Email Login': u.email,
        'Password Seragam': u.plainPassword,
        'Skenario / Keterangan': u.ewsScenario
      }))
  )
  console.log('='.repeat(105))
  console.log('  ✨  PROSES SEEDING INSTITUSIONAL LENGKAP SELESAI SECARA IDEMPOTENT KE DATABASE NEON!')
  console.log('  📊  Tepat 5 Kelas Aktif terdaftar dengan total 80 sesi dan 10-12 mahasiswa per kelas.')
  console.log('  📚  Bahan Ajar (P-1 s/d P-9), Token Presensi Sesi 10, Log Kehadiran, Tugas, Kuis, & Nilai Akhir Tersemai.')
  console.log('  🔑  Seluruh 22 akun (Admin, Dosen, Mahasiswa) siap digunakan login dengan password: Password123!')
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
