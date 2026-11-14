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
  sessionMaterials
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
  if2041SubmissionsData,
  if2041QuizAttemptsData,
  if2041FinalGradesData,
  sampleMaterialsData
} from './seed-data'

async function seed() {
  console.log('='.repeat(90))
  console.log('  🏛️  INSTITUT TEKNOLOGI WAKANDA - REALISTIC INSTITUTIONAL DATABASE SEEDER')
  console.log('='.repeat(90))

  // --------------------------------------------------------------------------
  // 1. Verify Database Connection
  // --------------------------------------------------------------------------
  console.log('\n[1/10] Memverifikasi konektivitas ke Neon Serverless PostgreSQL...')
  const isConnected = await pingDatabase()
  if (!isConnected) {
    throw new Error('Koneksi ke Neon PostgreSQL gagal. Pastikan DATABASE_URL valid.')
  }
  console.log('  ✓ Terhubung sukses ke Neon Serverless PostgreSQL!')

  // --------------------------------------------------------------------------
  // 2. Seed Programs (Program Studi)
  // --------------------------------------------------------------------------
  console.log('\n[2/10] Menyemai data Program Studi (Programs)...')
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
  console.log('\n[3/10] Menyemai Tahun Akademik Aktif (Kode: 20261)...')
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
  console.log('\n[4/10] Menyemai seluruh 22 Akun Dummy ITW (1 Admin, 3 Dosen, 18 Mahasiswa)...')
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
  console.log('\n[5/10] Menyemai data Master Mata Kuliah (Courses)...')
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
  console.log('\n[6/10] Menyemai Tepat 5 Kelas Perkuliahan Aktif & Membersihkan Kelas Lama...')
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
  console.log('\n[7/10] Menugaskan Dosen Pengampu untuk 5 Kelas Perkuliahan...')
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
  console.log('\n[8/10] Mendaftarkan Mahasiswa ke 5 Kelas Perkuliahan (10-12 Mahasiswa per Kelas)...')
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
  console.log('\n[9/10] Menyemai Struktur 16 Pertemuan Perkuliahan untuk ke-5 Kelas...')
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
  console.log('\n[10/10] Menetapkan Bobot Penilaian Gradebook Standar ITW untuk Seluruh Kelas...')
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

  // --------------------------------------------------------------------------
  // ELEMEN HISTORIS DAN EVALUASI LANJUTAN (KHUSUS KELAS UTAMA IF2041-A)
  // Menjaga 100% Ketersediaan Data Uji & EWS untuk 4 Persona Demo Inti
  // --------------------------------------------------------------------------
  const if2041AClass = classMap.get('IF2041:A')!
  const if2041Sessions = sessionMaps.get('IF2041:A')!
  const shuriUser = userMap.get('shuri@lecturer.wakanda.ac.id')!
  const nakiaUser = userMap.get('nakia@student.wakanda.ac.id')!
  const mbakuUser = userMap.get('mbaku@student.wakanda.ac.id')!
  const erikUser = userMap.get('erik@student.wakanda.ac.id')!
  const ririUser = userMap.get('riri@student.wakanda.ac.id')!

  // Active Attendance Token (Sesi 10)
  const session10 = if2041Sessions.get(10)!
  const activePinToken = '481920'
  await db
    .insert(attendanceTokens)
    .values({
      sessionId: session10.id,
      token: activePinToken,
      qrCodePayload: `WAKANDA_ATT:${session10.id}:${activePinToken}`,
      validFrom: new Date(Date.now() - 3600_000),
      validUntil: new Date(Date.now() + 24 * 3600_000),
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

  // Attendance Logs IF2041-A (16 Sesi)
  for (let sNum = 1; sNum <= 16; sNum++) {
    const sess = if2041Sessions.get(sNum)!
    const mbakuRule = if2041AttendanceTelemetry.mbakuRules(sNum)
    const erikRule = if2041AttendanceTelemetry.erikRules(sNum)

    const logs = [
      {
        sessionId: sess.id,
        studentId: nakiaUser.id,
        status: if2041AttendanceTelemetry.nakia.status,
        checkInMethod: 'TOKEN' as const,
        notes: if2041AttendanceTelemetry.nakia.note
      },
      {
        sessionId: sess.id,
        studentId: mbakuUser.id,
        status: mbakuRule.status,
        checkInMethod: mbakuRule.method,
        notes: mbakuRule.note
      },
      {
        sessionId: sess.id,
        studentId: erikUser.id,
        status: erikRule.status,
        checkInMethod: erikRule.method,
        notes: erikRule.note
      },
      {
        sessionId: sess.id,
        studentId: ririUser.id,
        status: if2041AttendanceTelemetry.riri.status,
        checkInMethod: if2041AttendanceTelemetry.riri.method,
        notes: if2041AttendanceTelemetry.riri.note
      }
    ]

    for (const log of logs) {
      await db
        .insert(attendanceLogs)
        .values(log)
        .onConflictDoUpdate({
          target: [attendanceLogs.sessionId, attendanceLogs.studentId],
          set: {
            status: log.status,
            checkInMethod: log.checkInMethod,
            notes: log.notes,
            updatedAt: new Date()
          }
        })
    }
  }

  // Assignments & Submissions IF2041-A
  const seededAssignments = []
  for (const a of assignmentMasterData) {
    const sess = if2041Sessions.get(a.sessionNum)!
    const dueDate = new Date(sess.sessionDate)
    dueDate.setDate(dueDate.getDate() + 7)

    const existingAssign = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.classId, if2041AClass.id), eq(assignments.title, a.title)))
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
          dueDate,
          updatedAt: new Date()
        })
        .where(eq(assignments.id, assignId))
    } else {
      const [newAssign] = await db
        .insert(assignments)
        .values({
          classId: if2041AClass.id,
          sessionId: sess.id,
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          maxScore: a.maxScore,
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

  for (const sub of if2041SubmissionsData) {
    const assign = seededAssignments[sub.assignIdx]
    const student = userMap.get(sub.studentEmail)!

    await db
      .insert(submissions)
      .values({
        assignmentId: assign.id,
        studentId: student.id,
        isLate: sub.isLate,
        score: sub.score,
        status: sub.status,
        feedback: sub.feedback,
        fileKey: `submissions/${assign.id}/${student.id}.zip`,
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

  // Quizzes & Attempts IF2041-A
  const seededQuizzes = []
  for (const q of quizMasterData) {
    const sess = if2041Sessions.get(q.sessionNum)!
    const startTime = new Date(sess.sessionDate + 'T08:00:00Z')
    const endTime = new Date(sess.sessionDate + 'T12:00:00Z')

    const existingQuiz = await db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.classId, if2041AClass.id), eq(quizzes.title, q.title)))
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
          classId: if2041AClass.id,
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

  for (const att of if2041QuizAttemptsData) {
    const quiz = seededQuizzes[att.quizIdx]
    const student = userMap.get(att.studentEmail)!

    const existing = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.studentId, student.id)))
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
        quizId: quiz.id,
        studentId: student.id,
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

  // Final Grades IF2041-A
  for (const fg of if2041FinalGradesData) {
    const student = userMap.get(fg.studentEmail)!
    await db
      .insert(finalGrades)
      .values({
        classId: if2041AClass.id,
        studentId: student.id,
        attendanceScore: fg.attendanceScore,
        assignmentScore: fg.assignmentScore,
        quizScore: fg.quizScore,
        midtermScore: fg.midtermScore,
        finalExamScore: fg.finalExamScore,
        totalScore: fg.totalScore,
        letterGrade: fg.letterGrade,
        gradePoint: fg.gradePoint,
        status: fg.status,
        publishedAt: fg.status === 'PUBLISHED' ? new Date() : null,
        approvedBy: fg.status === 'PUBLISHED' ? shuriUser.id : null
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
          publishedAt: fg.status === 'PUBLISHED' ? new Date() : null,
          approvedBy: fg.status === 'PUBLISHED' ? shuriUser.id : null,
          updatedAt: new Date()
        }
      })
  }

  // Session Materials IF2041-A
  for (const mat of sampleMaterialsData) {
    const sess = if2041Sessions.get(mat.sessionNum)!
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
  console.log('  ✨  PROSES SEEDING TAHAP AWAL SELESAI SECARA IDEMPOTENT KE DATABASE NEON!')
  console.log('  📊  Tepat 5 Kelas Aktif terdaftar dengan total 80 sesi dan 10-12 mahasiswa per kelas.')
  console.log('  🔑  Seluruh akun dummy siap digunakan untuk login dengan password: Password123!')
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
