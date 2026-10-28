import { eq, and, inArray, desc, sql, asc } from 'drizzle-orm'
import {
  db,
  gradeWeights,
  finalGrades,
  gradeAuditLogs,
  courseClasses,
  courses,
  academicTerms,
  classEnrollments,
  classSessions,
  attendanceLogs,
  assignments,
  submissions,
  quizzes,
  quizAttempts,
  users,
  type GradeWeight,
  type FinalGrade,
  type GradeAuditLog,
  type NewFinalGrade,
  type NewGradeAuditLog
} from '../database'
import type {
  GradeComponent,
  GradeStatus,
  LetterGrade,
  GradeWeightItemDto,
  GradeAuditLogDto
} from '~/types'

export interface EnrolledStudentInfo {
  studentId: string
  name: string
  nimNidn: string | null
  email: string
  avatarUrl: string | null
}

export interface ClassGradeAssessmentData {
  classId: string
  className: string
  courseCode: string
  courseName: string
  termName: string
  weights: GradeWeight[]
  enrolledStudents: EnrolledStudentInfo[]
  sessions: { id: string; sessionNumber: number; title: string }[]
  attendanceLogs: {
    sessionId: string
    studentId: string
    status: 'PRESENT' | 'PERMIT' | 'SICK' | 'ABSENT' | 'LATE'
  }[]
  assignments: {
    id: string
    title: string
    maxScore: string | number
  }[]
  submissions: {
    assignmentId: string
    studentId: string
    score: string | number | null
    status: string
  }[]
  quizzes: {
    id: string
    title: string
    quizType: string
    maxScore: string | number
  }[]
  quizAttempts: {
    quizId: string
    studentId: string
    score: string | number | null
    status: string
  }[]
  finalGrades: FinalGrade[]
}

export interface IGradebookRepository {
  findClassInfo(classId: string): Promise<{
    id: string
    code: string
    courseId: string
    courseCode: string
    courseName: string
    termId: string
    termName: string
  } | null>
  findGradeWeights(classId: string): Promise<GradeWeight[]>
  upsertGradeWeights(
    classId: string,
    weights: { componentName: GradeComponent; weightPercentage: number; description?: string | null }[]
  ): Promise<GradeWeight[]>
  findEnrolledStudents(classId: string): Promise<EnrolledStudentInfo[]>
  findClassAssessmentData(classId: string): Promise<ClassGradeAssessmentData | null>
  findFinalGradesByClass(classId: string): Promise<FinalGrade[]>
  findFinalGradeByStudent(classId: string, studentId: string): Promise<FinalGrade | null>
  upsertFinalGrade(record: {
    classId: string
    studentId: string
    attendanceScore: number
    assignmentScore: number
    quizScore: number
    midtermScore: number
    finalExamScore: number
    totalScore: number
    letterGrade: LetterGrade
    gradePoint: number
    status?: GradeStatus
    approvedBy?: string | null
    publishedAt?: Date | null
  }): Promise<FinalGrade>
  batchUpsertFinalGrades(records: {
    classId: string
    studentId: string
    attendanceScore: number
    assignmentScore: number
    quizScore: number
    midtermScore: number
    finalExamScore: number
    totalScore: number
    letterGrade: LetterGrade
    gradePoint: number
    status?: GradeStatus
    approvedBy?: string | null
    publishedAt?: Date | null
  }[]): Promise<FinalGrade[]>
  updateFinalGradesStatus(
    classId: string,
    status: GradeStatus,
    approvedBy?: string
  ): Promise<number>
  createAuditLog(log: {
    finalGradeId: string
    changedBy: string
    previousScore?: number | null
    newScore: number
    previousLetter?: LetterGrade | null
    newLetter: LetterGrade
    reason: string
    ipAddress?: string | null
  }): Promise<GradeAuditLog>
  findAuditLogsByClass(classId: string): Promise<GradeAuditLogDto[]>
}

export class GradebookRepository implements IGradebookRepository {
  public async findClassInfo(classId: string): Promise<{
    id: string
    code: string
    courseId: string
    courseCode: string
    courseName: string
    termId: string
    termName: string
  } | null> {
    const rows = await db
      .select({
        id: courseClasses.id,
        code: courseClasses.code,
        courseId: courses.id,
        courseCode: courses.code,
        courseName: courses.name,
        termId: academicTerms.id,
        termName: academicTerms.name
      })
      .from(courseClasses)
      .innerJoin(courses, eq(courseClasses.courseId, courses.id))
      .innerJoin(academicTerms, eq(courseClasses.academicTermId, academicTerms.id))
      .where(eq(courseClasses.id, classId))
      .limit(1)

    return rows.length > 0 ? rows[0] : null
  }

  public async findGradeWeights(classId: string): Promise<GradeWeight[]> {
    return await db
      .select()
      .from(gradeWeights)
      .where(eq(gradeWeights.classId, classId))
  }

  public async upsertGradeWeights(
    classId: string,
    weights: { componentName: GradeComponent; weightPercentage: number; description?: string | null }[]
  ): Promise<GradeWeight[]> {
    return await db.transaction(async (tx) => {
      const now = new Date()
      const results: GradeWeight[] = []

      for (const w of weights) {
        const [upserted] = await tx
          .insert(gradeWeights)
          .values({
            classId,
            componentName: w.componentName,
            weightPercentage: w.weightPercentage.toFixed(2),
            description: w.description ?? null,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [gradeWeights.classId, gradeWeights.componentName],
            set: {
              weightPercentage: w.weightPercentage.toFixed(2),
              description: w.description ?? null,
              updatedAt: now
            }
          })
          .returning()

        if (upserted) {
          results.push(upserted)
        }
      }

      return results
    })
  }

  public async findEnrolledStudents(classId: string): Promise<EnrolledStudentInfo[]> {
    const rows = await db
      .select({
        studentId: users.id,
        name: users.name,
        nimNidn: users.nimNidn,
        email: users.email,
        avatarUrl: users.avatarUrl
      })
      .from(classEnrollments)
      .innerJoin(users, eq(classEnrollments.studentId, users.id))
      .where(
        and(
          eq(classEnrollments.classId, classId),
          eq(classEnrollments.status, 'ENROLLED')
        )
      )
      .orderBy(asc(users.name))

    return rows
  }

  public async findClassAssessmentData(classId: string): Promise<ClassGradeAssessmentData | null> {
    const classInfo = await this.findClassInfo(classId)
    if (!classInfo) {
      return null
    }

    const [
      weights,
      enrolledStudents,
      sessions,
      classAssignments,
      classQuizzes,
      classFinalGrades
    ] = await Promise.all([
      this.findGradeWeights(classId),
      this.findEnrolledStudents(classId),
      db
        .select({
          id: classSessions.id,
          sessionNumber: classSessions.sessionNumber,
          title: classSessions.title
        })
        .from(classSessions)
        .where(eq(classSessions.classId, classId))
        .orderBy(asc(classSessions.sessionNumber)),
      db
        .select({
          id: assignments.id,
          title: assignments.title,
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
          maxScore: quizzes.maxScore
        })
        .from(quizzes)
        .where(
          and(
            eq(quizzes.classId, classId),
            eq(quizzes.isPublished, true)
          )
        ),
      this.findFinalGradesByClass(classId)
    ])

    // Attendance logs for all sessions of this class
    const sessionIds = sessions.map((s) => s.id)
    let logs: {
      sessionId: string
      studentId: string
      status: 'PRESENT' | 'PERMIT' | 'SICK' | 'ABSENT' | 'LATE'
    }[] = []

    if (sessionIds.length > 0) {
      logs = await db
        .select({
          sessionId: attendanceLogs.sessionId,
          studentId: attendanceLogs.studentId,
          status: attendanceLogs.status
        })
        .from(attendanceLogs)
        .where(inArray(attendanceLogs.sessionId, sessionIds))
    }

    // Submissions for class assignments
    const assignmentIds = classAssignments.map((a) => a.id)
    let classSubmissions: {
      assignmentId: string
      studentId: string
      score: string | number | null
      status: string
    }[] = []

    if (assignmentIds.length > 0) {
      classSubmissions = await db
        .select({
          assignmentId: submissions.assignmentId,
          studentId: submissions.studentId,
          score: submissions.score,
          status: submissions.status
        })
        .from(submissions)
        .where(inArray(submissions.assignmentId, assignmentIds))
    }

    // Quiz attempts for class quizzes
    const quizIds = classQuizzes.map((q) => q.id)
    let attempts: {
      quizId: string
      studentId: string
      score: string | number | null
      status: string
    }[] = []

    if (quizIds.length > 0) {
      attempts = await db
        .select({
          quizId: quizAttempts.quizId,
          studentId: quizAttempts.studentId,
          score: quizAttempts.score,
          status: quizAttempts.status
        })
        .from(quizAttempts)
        .where(
          and(
            inArray(quizAttempts.quizId, quizIds),
            inArray(quizAttempts.status, ['SUBMITTED', 'GRADED'])
          )
        )
    }

    return {
      classId,
      className: classInfo.code,
      courseCode: classInfo.courseCode,
      courseName: classInfo.courseName,
      termName: classInfo.termName,
      weights,
      enrolledStudents,
      sessions,
      attendanceLogs: logs,
      assignments: classAssignments,
      submissions: classSubmissions,
      quizzes: classQuizzes,
      quizAttempts: attempts,
      finalGrades: classFinalGrades
    }
  }

  public async findFinalGradesByClass(classId: string): Promise<FinalGrade[]> {
    return await db
      .select()
      .from(finalGrades)
      .where(eq(finalGrades.classId, classId))
  }

  public async findFinalGradeByStudent(classId: string, studentId: string): Promise<FinalGrade | null> {
    const rows = await db
      .select()
      .from(finalGrades)
      .where(
        and(
          eq(finalGrades.classId, classId),
          eq(finalGrades.studentId, studentId)
        )
      )
      .limit(1)

    return rows.length > 0 ? rows[0] : null
  }

  public async upsertFinalGrade(record: {
    classId: string
    studentId: string
    attendanceScore: number
    assignmentScore: number
    quizScore: number
    midtermScore: number
    finalExamScore: number
    totalScore: number
    letterGrade: LetterGrade
    gradePoint: number
    status?: GradeStatus
    approvedBy?: string | null
    publishedAt?: Date | null
  }): Promise<FinalGrade> {
    const now = new Date()
    const [result] = await db
      .insert(finalGrades)
      .values({
        classId: record.classId,
        studentId: record.studentId,
        attendanceScore: record.attendanceScore.toFixed(2),
        assignmentScore: record.assignmentScore.toFixed(2),
        quizScore: record.quizScore.toFixed(2),
        midtermScore: record.midtermScore.toFixed(2),
        finalExamScore: record.finalExamScore.toFixed(2),
        totalScore: record.totalScore.toFixed(2),
        letterGrade: record.letterGrade,
        gradePoint: record.gradePoint.toFixed(2),
        status: record.status || 'DRAFT',
        approvedBy: record.approvedBy ?? null,
        publishedAt: record.publishedAt ?? null,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [finalGrades.classId, finalGrades.studentId],
        set: {
          attendanceScore: record.attendanceScore.toFixed(2),
          assignmentScore: record.assignmentScore.toFixed(2),
          quizScore: record.quizScore.toFixed(2),
          midtermScore: record.midtermScore.toFixed(2),
          finalExamScore: record.finalExamScore.toFixed(2),
          totalScore: record.totalScore.toFixed(2),
          letterGrade: record.letterGrade,
          gradePoint: record.gradePoint.toFixed(2),
          status: record.status || sql`${finalGrades.status}`,
          approvedBy: record.approvedBy !== undefined ? record.approvedBy : sql`${finalGrades.approvedBy}`,
          publishedAt: record.publishedAt !== undefined ? record.publishedAt : sql`${finalGrades.publishedAt}`,
          updatedAt: now
        }
      })
      .returning()

    return result
  }

  public async batchUpsertFinalGrades(records: {
    classId: string
    studentId: string
    attendanceScore: number
    assignmentScore: number
    quizScore: number
    midtermScore: number
    finalExamScore: number
    totalScore: number
    letterGrade: LetterGrade
    gradePoint: number
    status?: GradeStatus
    approvedBy?: string | null
    publishedAt?: Date | null
  }[]): Promise<FinalGrade[]> {
    if (records.length === 0) return []

    return await db.transaction(async (tx) => {
      const now = new Date()
      const results: FinalGrade[] = []

      for (const rec of records) {
        const [res] = await tx
          .insert(finalGrades)
          .values({
            classId: rec.classId,
            studentId: rec.studentId,
            attendanceScore: rec.attendanceScore.toFixed(2),
            assignmentScore: rec.assignmentScore.toFixed(2),
            quizScore: rec.quizScore.toFixed(2),
            midtermScore: rec.midtermScore.toFixed(2),
            finalExamScore: rec.finalExamScore.toFixed(2),
            totalScore: rec.totalScore.toFixed(2),
            letterGrade: rec.letterGrade,
            gradePoint: rec.gradePoint.toFixed(2),
            status: rec.status || 'DRAFT',
            approvedBy: rec.approvedBy ?? null,
            publishedAt: rec.publishedAt ?? null,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [finalGrades.classId, finalGrades.studentId],
            set: {
              attendanceScore: rec.attendanceScore.toFixed(2),
              assignmentScore: rec.assignmentScore.toFixed(2),
              quizScore: rec.quizScore.toFixed(2),
              midtermScore: rec.midtermScore.toFixed(2),
              finalExamScore: rec.finalExamScore.toFixed(2),
              totalScore: rec.totalScore.toFixed(2),
              letterGrade: rec.letterGrade,
              gradePoint: rec.gradePoint.toFixed(2),
              updatedAt: now
            }
          })
          .returning()

        if (res) {
          results.push(res)
        }
      }

      return results
    })
  }

  public async updateFinalGradesStatus(
    classId: string,
    status: GradeStatus,
    approvedBy?: string
  ): Promise<number> {
    const now = new Date()
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: now
    }

    if (status === 'PUBLISHED') {
      updatePayload.publishedAt = now
    }
    if (approvedBy) {
      updatePayload.approvedBy = approvedBy
    }

    const result = await db
      .update(finalGrades)
      .set(updatePayload)
      .where(eq(finalGrades.classId, classId))
      .returning({ id: finalGrades.id })

    return result.length
  }

  public async createAuditLog(log: {
    finalGradeId: string
    changedBy: string
    previousScore?: number | null
    newScore: number
    previousLetter?: LetterGrade | null
    newLetter: LetterGrade
    reason: string
    ipAddress?: string | null
  }): Promise<GradeAuditLog> {
    const [result] = await db
      .insert(gradeAuditLogs)
      .values({
        finalGradeId: log.finalGradeId,
        changedBy: log.changedBy,
        previousScore: log.previousScore !== undefined && log.previousScore !== null ? log.previousScore.toFixed(2) : null,
        newScore: log.newScore.toFixed(2),
        previousLetter: log.previousLetter ?? null,
        newLetter: log.newLetter,
        reason: log.reason,
        ipAddress: log.ipAddress ?? null,
        createdAt: new Date()
      })
      .returning()

    return result
  }

  public async findAuditLogsByClass(classId: string): Promise<GradeAuditLogDto[]> {
    const rows = await db
      .select({
        id: gradeAuditLogs.id,
        finalGradeId: gradeAuditLogs.finalGradeId,
        studentName: users.name,
        studentNim: users.nimNidn,
        changedById: gradeAuditLogs.changedBy,
        previousScore: gradeAuditLogs.previousScore,
        newScore: gradeAuditLogs.newScore,
        previousLetter: gradeAuditLogs.previousLetter,
        newLetter: gradeAuditLogs.newLetter,
        reason: gradeAuditLogs.reason,
        ipAddress: gradeAuditLogs.ipAddress,
        createdAt: gradeAuditLogs.createdAt
      })
      .from(gradeAuditLogs)
      .innerJoin(finalGrades, eq(gradeAuditLogs.finalGradeId, finalGrades.id))
      .innerJoin(users, eq(finalGrades.studentId, users.id))
      .where(eq(finalGrades.classId, classId))
      .orderBy(desc(gradeAuditLogs.createdAt))

    // Fetch changer names in batch
    const changerIds = [...new Set(rows.map((r) => r.changedById).filter(Boolean))]
    const changerMap = new Map<string, string>()

    if (changerIds.length > 0) {
      const changers = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, changerIds as string[]))

      changers.forEach((c) => changerMap.set(c.id, c.name))
    }

    return rows.map((r) => ({
      id: r.id,
      finalGradeId: r.finalGradeId,
      studentName: r.studentName,
      studentNim: r.studentNim,
      changedById: r.changedById,
      changedByName: changerMap.get(r.changedById) || 'Sistem / Dosen Pengampu',
      previousScore: r.previousScore !== null ? parseFloat(r.previousScore) : null,
      newScore: parseFloat(r.newScore),
      previousLetter: (r.previousLetter as LetterGrade) || null,
      newLetter: r.newLetter as LetterGrade,
      reason: r.reason,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
    }))
  }
}

export const gradebookRepository = new GradebookRepository()
