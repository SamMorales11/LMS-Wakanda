import { eq, and, inArray, desc, asc } from 'drizzle-orm'
import {
  db,
  courseClasses,
  courses,
  academicTerms,
  classLecturers,
  classEnrollments,
  classSessions,
  attendanceLogs,
  assignments,
  submissions,
  quizzes,
  quizAttempts,
  users
} from '../database'

export interface EwsRawClassData {
  classId: string
  classCode: string
  courseCode: string
  courseName: string
  termName: string
  lecturerName: string | null
  sessions: {
    id: string
    sessionNumber: number
    title: string
    sessionType: string
  }[]
  enrolledStudents: {
    studentId: string
    name: string
    nimNidn: string | null
    email: string
  }[]
  attendanceLogs: {
    sessionId: string
    studentId: string
    status: 'PRESENT' | 'PERMIT' | 'SICK' | 'ABSENT' | 'LATE'
    checkInTime: Date
  }[]
  assignments: {
    id: string
    title: string
    dueDate: Date
    cutoffDate: Date | null
    maxScore: string | number
  }[]
  submissions: {
    id: string
    assignmentId: string
    studentId: string
    isLate: boolean
    status: string
    score: string | number | null
    submittedAt: Date
  }[]
  quizzes: {
    id: string
    title: string
    quizType: string
    maxScore: string | number
    passingScore: string | number
  }[]
  quizAttempts: {
    id: string
    quizId: string
    studentId: string
    score: string | number | null
    autoScore: string | number | null
    manualScore: string | number | null
    status: string
    submittedAt: Date | null
  }[]
}

export interface IEwsRepository {
  findClassTelemetry(classId: string): Promise<EwsRawClassData | null>
  findAllActiveClassesTelemetry(): Promise<EwsRawClassData[]>
  findStudentTelemetry(classId: string, studentId: string): Promise<EwsRawClassData | null>
}

export class EwsRepository implements IEwsRepository {
  /**
   * Mengambil seluruh data mentah telemetri akademik untuk kelas tertentu
   */
  public async findClassTelemetry(classId: string): Promise<EwsRawClassData | null> {
    // 1. Ambil detail kelas, mata kuliah, semester, dan dosen pengampu utama
    const classRows = await db
      .select({
        id: courseClasses.id,
        code: courseClasses.code,
        courseCode: courses.code,
        courseName: courses.name,
        termName: academicTerms.name
      })
      .from(courseClasses)
      .innerJoin(courses, eq(courseClasses.courseId, courses.id))
      .innerJoin(academicTerms, eq(courseClasses.academicTermId, academicTerms.id))
      .where(eq(courseClasses.id, classId))
      .limit(1)

    if (classRows.length === 0) {
      return null
    }

    const cls = classRows[0]

    // Dosen pengampu
    const lecturerRows = await db
      .select({
        name: users.name
      })
      .from(classLecturers)
      .innerJoin(users, eq(classLecturers.lecturerId, users.id))
      .where(eq(classLecturers.classId, classId))
      .limit(1)

    const lecturerName = lecturerRows.length > 0 ? lecturerRows[0].name : null

    // 2. Ambil paralel: Mahasiswa terdaftar, Sesi pertemuan, Tugas, Kuis
    const [
      enrolledStudents,
      sessions,
      classAssignments,
      classQuizzes
    ] = await Promise.all([
      db
        .select({
          studentId: users.id,
          name: users.name,
          nimNidn: users.nimNidn,
          email: users.email
        })
        .from(classEnrollments)
        .innerJoin(users, eq(classEnrollments.studentId, users.id))
        .where(
          and(
            eq(classEnrollments.classId, classId),
            eq(classEnrollments.status, 'ENROLLED')
          )
        )
        .orderBy(asc(users.name)),
      db
        .select({
          id: classSessions.id,
          sessionNumber: classSessions.sessionNumber,
          title: classSessions.title,
          sessionType: classSessions.sessionType
        })
        .from(classSessions)
        .where(eq(classSessions.classId, classId))
        .orderBy(asc(classSessions.sessionNumber)),
      db
        .select({
          id: assignments.id,
          title: assignments.title,
          dueDate: assignments.dueDate,
          cutoffDate: assignments.cutoffDate,
          maxScore: assignments.maxScore
        })
        .from(assignments)
        .where(
          and(
            eq(assignments.classId, classId),
            eq(assignments.isPublished, true)
          )
        ),
      db
        .select({
          id: quizzes.id,
          title: quizzes.title,
          quizType: quizzes.quizType,
          maxScore: quizzes.maxScore,
          passingScore: quizzes.passingScore
        })
        .from(quizzes)
        .where(
          and(
            eq(quizzes.classId, classId),
            eq(quizzes.isPublished, true)
          )
        )
    ])

    // 3. Log presensi untuk seluruh sesi kelas
    const sessionIds = sessions.map((s) => s.id)
    let logs: {
      sessionId: string
      studentId: string
      status: 'PRESENT' | 'PERMIT' | 'SICK' | 'ABSENT' | 'LATE'
      checkInTime: Date
    }[] = []

    if (sessionIds.length > 0) {
      logs = await db
        .select({
          sessionId: attendanceLogs.sessionId,
          studentId: attendanceLogs.studentId,
          status: attendanceLogs.status,
          checkInTime: attendanceLogs.checkInTime
        })
        .from(attendanceLogs)
        .where(inArray(attendanceLogs.sessionId, sessionIds))
    }

    // 4. Submissions untuk tugas kelas
    const assignmentIds = classAssignments.map((a) => a.id)
    let classSubmissions: {
      id: string
      assignmentId: string
      studentId: string
      isLate: boolean
      status: string
      score: string | number | null
      submittedAt: Date
    }[] = []

    if (assignmentIds.length > 0) {
      classSubmissions = await db
        .select({
          id: submissions.id,
          assignmentId: submissions.assignmentId,
          studentId: submissions.studentId,
          isLate: submissions.isLate,
          status: submissions.status,
          score: submissions.score,
          submittedAt: submissions.submittedAt
        })
        .from(submissions)
        .where(inArray(submissions.assignmentId, assignmentIds))
    }

    // 5. Quiz attempts untuk kuis/ujian kelas
    const quizIds = classQuizzes.map((q) => q.id)
    let attempts: {
      id: string
      quizId: string
      studentId: string
      score: string | number | null
      autoScore: string | number | null
      manualScore: string | number | null
      status: string
      submittedAt: Date | null
    }[] = []

    if (quizIds.length > 0) {
      attempts = await db
        .select({
          id: quizAttempts.id,
          quizId: quizAttempts.quizId,
          studentId: quizAttempts.studentId,
          score: quizAttempts.score,
          autoScore: quizAttempts.autoScore,
          manualScore: quizAttempts.manualScore,
          status: quizAttempts.status,
          submittedAt: quizAttempts.submittedAt
        })
        .from(quizAttempts)
        .where(
          and(
            inArray(quizAttempts.quizId, quizIds),
            inArray(quizAttempts.status, ['SUBMITTED', 'GRADED', 'TIMED_OUT'])
          )
        )
    }

    return {
      classId: cls.id,
      classCode: cls.code,
      courseCode: cls.courseCode,
      courseName: cls.courseName,
      termName: cls.termName,
      lecturerName,
      sessions,
      enrolledStudents,
      attendanceLogs: logs,
      assignments: classAssignments,
      submissions: classSubmissions,
      quizzes: classQuizzes,
      quizAttempts: attempts
    }
  }

  /**
   * Mengambil telemetri seluruh kelas aktif untuk analitik Program Studi
   */
  public async findAllActiveClassesTelemetry(): Promise<EwsRawClassData[]> {
    const activeClasses = await db
      .select({
        id: courseClasses.id
      })
      .from(courseClasses)
      .where(eq(courseClasses.isActive, true))

    const results: EwsRawClassData[] = []
    for (const c of activeClasses) {
      const data = await this.findClassTelemetry(c.id)
      if (data) {
        results.push(data)
      }
    }

    return results
  }

  /**
   * Mengambil telemetri spesifik seorang mahasiswa pada suatu kelas
   */
  public async findStudentTelemetry(classId: string, studentId: string): Promise<EwsRawClassData | null> {
    const classData = await this.findClassTelemetry(classId)
    if (!classData) return null

    // Filter hanya mahasiswa bersangkutan
    classData.enrolledStudents = classData.enrolledStudents.filter((s) => s.studentId === studentId)
    classData.attendanceLogs = classData.attendanceLogs.filter((l) => l.studentId === studentId)
    classData.submissions = classData.submissions.filter((s) => s.studentId === studentId)
    classData.quizAttempts = classData.quizAttempts.filter((a) => a.studentId === studentId)

    return classData
  }
}

export const ewsRepository = new EwsRepository()
