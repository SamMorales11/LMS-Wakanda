import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm'
import type {
  QuizDto,
  CreateQuizDto,
  UpdateQuizDto,
  QuizAttemptDto,
  QuizQuestion,
  QuizQuestionStudentView,
  QuizAttemptAnswer,
  QuizAccessStatus,
  QuizType
} from '~/types'
import {
  db,
  quizzes,
  quizAttempts,
  users,
  classSessions,
  type Quiz,
  type QuizAttempt,
  type NewQuiz,
  type NewQuizAttempt
} from '../database'

export interface IQuizRepository {
  findById(id: string, includeQuestions?: boolean): Promise<QuizDto | null>
  findByClassId(classId: string, studentId?: string): Promise<QuizDto[]>
  findBySessionId(sessionId: string, studentId?: string): Promise<QuizDto[]>
  create(dto: CreateQuizDto, createdBy?: string): Promise<QuizDto>
  update(id: string, dto: UpdateQuizDto): Promise<QuizDto | null>
  delete(id: string): Promise<boolean>

  // Attempts
  findAttemptById(id: string): Promise<QuizAttemptDto | null>
  findActiveAttempt(quizId: string, studentId: string): Promise<QuizAttemptDto | null>
  findAttemptsByQuizId(quizId: string): Promise<QuizAttemptDto[]>
  findStudentAttempts(quizId: string, studentId: string): Promise<QuizAttemptDto[]>
  countStudentAttempts(quizId: string, studentId: string): Promise<number>
  createAttempt(
    quizId: string,
    studentId: string,
    attemptNumber: number,
    questionOrder: string[],
    expiresAt?: Date
  ): Promise<QuizAttemptDto>
  updateProgressAnswers(
    attemptId: string,
    answers: QuizAttemptAnswer[]
  ): Promise<QuizAttemptDto | null>
  saveAttemptAnswers(
    attemptId: string,
    answers: QuizAttemptAnswer[],
    autoScore: number,
    totalScore: number | null,
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'TIMED_OUT',
    submittedAt?: Date
  ): Promise<QuizAttemptDto | null>
  gradeAttempt(
    attemptId: string,
    manualScore: number,
    totalScore: number,
    answers: QuizAttemptAnswer[],
    feedback?: string | null,
    gradedBy?: string
  ): Promise<QuizAttemptDto | null>
}

export class QuizRepository implements IQuizRepository {
  /**
   * Helper: Transform database Quiz row to QuizDto
   */
  public toQuizDto(
    row: Quiz,
    sessionRow?: { sessionNumber: number; title: string } | null,
    includeQuestions = true,
    myAttemptsCount = 0,
    myLatestAttempt?: QuizAttemptDto | null
  ): QuizDto {
    const now = Date.now()
    const startMs = row.startTime.getTime()
    const endMs = row.endTime.getTime()

    let accessStatus: QuizAccessStatus = 'UPCOMING'
    if (now >= startMs && now <= endMs) {
      accessStatus = 'ACTIVE'
    } else if (now > endMs) {
      accessStatus = 'ENDED'
    }

    const questionsList = (row.questionsJsonb as QuizQuestion[]) || []

    return {
      id: row.id,
      classId: row.classId,
      sessionId: row.sessionId,
      sessionNumber: sessionRow?.sessionNumber ?? null,
      sessionTitle: sessionRow?.title ?? null,
      title: row.title,
      description: row.description,
      quizType: (row.quizType as QuizType) || 'QUIZ',
      durationMinutes: row.durationMinutes,
      maxScore: String(row.maxScore),
      passingScore: String(row.passingScore),
      startTime: row.startTime.toISOString(),
      endTime: row.endTime.toISOString(),
      shuffleQuestions: row.shuffleQuestions,
      maxAttempts: row.maxAttempts,
      isPublished: row.isPublished,
      questionsCount: questionsList.length,
      questions: includeQuestions ? questionsList : null,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      accessStatus,
      myAttemptsCount,
      myLatestAttempt: myLatestAttempt ?? null
    }
  }

  /**
   * Helper: Transform database QuizAttempt row to QuizAttemptDto
   */
  public toQuizAttemptDto(
    row: QuizAttempt,
    quizRow?: Quiz | null,
    studentRow?: { name: string; nimNidn: string | null } | null
  ): QuizAttemptDto {
    const now = Date.now()
    const startedMs = row.startedAt.getTime()

    // Hitung deadline spesifik: min(quiz.endTime, startedAt + durationMinutes) atau gunakan expiresAt
    let deadlineMs = startedMs + 60 * 60 * 1000 // default fallback
    if (row.expiresAt) {
      deadlineMs = row.expiresAt.getTime()
    } else if (quizRow) {
      const quizDurationMs = quizRow.durationMinutes * 60 * 1000
      const timerEndMs = startedMs + quizDurationMs
      const quizEndMs = quizRow.endTime.getTime()
      deadlineMs = Math.min(timerEndMs, quizEndMs)
    }

    const remainingSeconds = Math.max(0, Math.floor((deadlineMs - now) / 1000))

    let durationSpentSeconds: number | null = null
    if (row.submittedAt) {
      durationSpentSeconds = Math.max(0, Math.floor((row.submittedAt.getTime() - startedMs) / 1000))
    }

    const questionOrder = (row.questionOrderJsonb as string[]) || []
    const answers = (row.answersJsonb as QuizAttemptAnswer[]) || []

    return {
      id: row.id,
      quizId: row.quizId,
      quizTitle: quizRow?.title,
      studentId: row.studentId,
      studentName: studentRow?.name,
      studentNim: studentRow?.nimNidn || undefined,
      attemptNumber: row.attemptNumber,
      startedAt: row.startedAt.toISOString(),
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : new Date(deadlineMs).toISOString(),
      submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
      durationSpentSeconds,
      remainingSeconds,
      deadlineAt: new Date(deadlineMs).toISOString(),
      score: row.score !== null ? String(row.score) : null,
      autoScore: row.autoScore !== null ? String(row.autoScore) : null,
      manualScore: row.manualScore !== null ? String(row.manualScore) : null,
      status: row.status as any,
      feedback: row.feedback,
      questionOrder,
      answers,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  public async findById(id: string, includeQuestions = true): Promise<QuizDto | null> {
    const [row] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1)

    if (!row) return null

    let sessionRow: { sessionNumber: number; title: string } | null = null
    if (row.sessionId) {
      const [s] = await db
        .select({ sessionNumber: classSessions.sessionNumber, title: classSessions.title })
        .from(classSessions)
        .where(eq(classSessions.id, row.sessionId))
        .limit(1)
      sessionRow = s || null
    }

    return this.toQuizDto(row, sessionRow, includeQuestions)
  }

  public async findByClassId(classId: string, studentId?: string): Promise<QuizDto[]> {
    const rows = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.classId, classId))
      .orderBy(asc(quizzes.startTime))

    if (rows.length === 0) return []

    // Fetch session details
    const sessionIds = rows.map(r => r.sessionId).filter((s): s is string => !!s)
    const sessionMap = new Map<string, { sessionNumber: number; title: string }>()

    if (sessionIds.length > 0) {
      const sRows = await db
        .select({ id: classSessions.id, sessionNumber: classSessions.sessionNumber, title: classSessions.title })
        .from(classSessions)
        .where(inArray(classSessions.id, sessionIds))
      for (const s of sRows) {
        sessionMap.set(s.id, { sessionNumber: s.sessionNumber, title: s.title })
      }
    }

    const results: QuizDto[] = []
    for (const row of rows) {
      const sessionRow = row.sessionId ? sessionMap.get(row.sessionId) || null : null
      let myAttemptsCount = 0
      let myLatestAttempt: QuizAttemptDto | null = null

      if (studentId) {
        myAttemptsCount = await this.countStudentAttempts(row.id, studentId)
        const studentAttempts = await this.findStudentAttempts(row.id, studentId)
        myLatestAttempt = studentAttempts.length > 0 ? studentAttempts[0] : null
      }

      // Hide questions from class list overview
      results.push(this.toQuizDto(row, sessionRow, false, myAttemptsCount, myLatestAttempt))
    }

    return results
  }

  public async findBySessionId(sessionId: string, studentId?: string): Promise<QuizDto[]> {
    const rows = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.sessionId, sessionId))
      .orderBy(asc(quizzes.startTime))

    if (rows.length === 0) return []

    const [sRow] = await db
      .select({ sessionNumber: classSessions.sessionNumber, title: classSessions.title })
      .from(classSessions)
      .where(eq(classSessions.id, sessionId))
      .limit(1)

    const sessionRow = sRow || null
    const results: QuizDto[] = []

    for (const row of rows) {
      let myAttemptsCount = 0
      let myLatestAttempt: QuizAttemptDto | null = null

      if (studentId) {
        myAttemptsCount = await this.countStudentAttempts(row.id, studentId)
        const studentAttempts = await this.findStudentAttempts(row.id, studentId)
        myLatestAttempt = studentAttempts.length > 0 ? studentAttempts[0] : null
      }

      results.push(this.toQuizDto(row, sessionRow, false, myAttemptsCount, myLatestAttempt))
    }

    return results
  }

  public async create(dto: CreateQuizDto, createdBy?: string): Promise<QuizDto> {
    const [inserted] = await db
      .insert(quizzes)
      .values({
        classId: dto.classId,
        sessionId: dto.sessionId || null,
        title: dto.title,
        description: dto.description || null,
        quizType: dto.quizType || 'QUIZ',
        durationMinutes: dto.durationMinutes ?? 60,
        maxScore: String(dto.maxScore ?? 100),
        passingScore: String(dto.passingScore ?? 70),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        shuffleQuestions: dto.shuffleQuestions ?? true,
        maxAttempts: dto.maxAttempts ?? 1,
        questionsJsonb: dto.questions,
        isPublished: dto.isPublished ?? true,
        createdBy: createdBy || null
      })
      .returning()

    let sessionRow: { sessionNumber: number; title: string } | null = null
    if (inserted.sessionId) {
      const [s] = await db
        .select({ sessionNumber: classSessions.sessionNumber, title: classSessions.title })
        .from(classSessions)
        .where(eq(classSessions.id, inserted.sessionId))
        .limit(1)
      sessionRow = s || null
    }

    return this.toQuizDto(inserted, sessionRow, true)
  }

  public async update(id: string, dto: UpdateQuizDto): Promise<QuizDto | null> {
    const updateValues: Partial<NewQuiz> = {
      updatedAt: new Date()
    }

    if (dto.title !== undefined) updateValues.title = dto.title
    if (dto.description !== undefined) updateValues.description = dto.description
    if (dto.quizType !== undefined) updateValues.quizType = dto.quizType
    if (dto.sessionId !== undefined) updateValues.sessionId = dto.sessionId
    if (dto.durationMinutes !== undefined) updateValues.durationMinutes = dto.durationMinutes
    if (dto.maxScore !== undefined) updateValues.maxScore = String(dto.maxScore)
    if (dto.passingScore !== undefined) updateValues.passingScore = String(dto.passingScore)
    if (dto.startTime !== undefined) updateValues.startTime = new Date(dto.startTime)
    if (dto.endTime !== undefined) updateValues.endTime = new Date(dto.endTime)
    if (dto.shuffleQuestions !== undefined) updateValues.shuffleQuestions = dto.shuffleQuestions
    if (dto.maxAttempts !== undefined) updateValues.maxAttempts = dto.maxAttempts
    if (dto.isPublished !== undefined) updateValues.isPublished = dto.isPublished
    if (dto.questions !== undefined) updateValues.questionsJsonb = dto.questions

    const [updated] = await db
      .update(quizzes)
      .set(updateValues)
      .where(eq(quizzes.id, id))
      .returning()

    if (!updated) return null

    let sessionRow: { sessionNumber: number; title: string } | null = null
    if (updated.sessionId) {
      const [s] = await db
        .select({ sessionNumber: classSessions.sessionNumber, title: classSessions.title })
        .from(classSessions)
        .where(eq(classSessions.id, updated.sessionId))
        .limit(1)
      sessionRow = s || null
    }

    return this.toQuizDto(updated, sessionRow, true)
  }

  public async delete(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(quizzes)
      .where(eq(quizzes.id, id))
      .returning({ id: quizzes.id })

    return !!deleted
  }

  // --- Attempts Management ---

  public async findAttemptById(id: string): Promise<QuizAttemptDto | null> {
    const [row] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, id))
      .limit(1)

    if (!row) return null

    const [quizRow] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, row.quizId))
      .limit(1)

    const [studentRow] = await db
      .select({ name: users.name, nimNidn: users.nimNidn })
      .from(users)
      .where(eq(users.id, row.studentId))
      .limit(1)

    return this.toQuizAttemptDto(row, quizRow || null, studentRow || null)
  }

  public async findActiveAttempt(quizId: string, studentId: string): Promise<QuizAttemptDto | null> {
    const [row] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.studentId, studentId),
          eq(quizAttempts.status, 'IN_PROGRESS')
        )
      )
      .orderBy(desc(quizAttempts.createdAt))
      .limit(1)

    if (!row) return null

    const [quizRow] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, row.quizId))
      .limit(1)

    const [studentRow] = await db
      .select({ name: users.name, nimNidn: users.nimNidn })
      .from(users)
      .where(eq(users.id, row.studentId))
      .limit(1)

    return this.toQuizAttemptDto(row, quizRow || null, studentRow || null)
  }

  public async findAttemptsByQuizId(quizId: string): Promise<QuizAttemptDto[]> {
    const rows = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .orderBy(desc(quizAttempts.startedAt))

    if (rows.length === 0) return []

    const [quizRow] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1)

    const studentIds = [...new Set(rows.map(r => r.studentId))]
    const studentMap = new Map<string, { name: string; nimNidn: string | null }>()

    if (studentIds.length > 0) {
      const sRows = await db
        .select({ id: users.id, name: users.name, nimNidn: users.nimNidn })
        .from(users)
        .where(inArray(users.id, studentIds))
      for (const s of sRows) {
        studentMap.set(s.id, { name: s.name, nimNidn: s.nimNidn })
      }
    }

    return rows.map(r => this.toQuizAttemptDto(r, quizRow || null, studentMap.get(r.studentId) || null))
  }

  public async findStudentAttempts(quizId: string, studentId: string): Promise<QuizAttemptDto[]> {
    const rows = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.studentId, studentId)
        )
      )
      .orderBy(desc(quizAttempts.attemptNumber))

    if (rows.length === 0) return []

    const [quizRow] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1)

    const [studentRow] = await db
      .select({ name: users.name, nimNidn: users.nimNidn })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1)

    return rows.map(r => this.toQuizAttemptDto(r, quizRow || null, studentRow || null))
  }

  public async countStudentAttempts(quizId: string, studentId: string): Promise<number> {
    const [res] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.studentId, studentId)
        )
      )

    return res?.count ?? 0
  }

  public async createAttempt(
    quizId: string,
    studentId: string,
    attemptNumber: number,
    questionOrder: string[],
    expiresAt?: Date
  ): Promise<QuizAttemptDto> {
    const [inserted] = await db
      .insert(quizAttempts)
      .values({
        quizId,
        studentId,
        attemptNumber,
        status: 'IN_PROGRESS',
        questionOrderJsonb: questionOrder,
        answersJsonb: [],
        startedAt: new Date(),
        expiresAt: expiresAt || null
      })
      .returning()

    const [quizRow] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1)

    const [studentRow] = await db
      .select({ name: users.name, nimNidn: users.nimNidn })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1)

    return this.toQuizAttemptDto(inserted, quizRow || null, studentRow || null)
  }

  public async updateProgressAnswers(
    attemptId: string,
    answers: QuizAttemptAnswer[]
  ): Promise<QuizAttemptDto | null> {
    const [updated] = await db
      .update(quizAttempts)
      .set({
        answersJsonb: answers,
        updatedAt: new Date()
      })
      .where(eq(quizAttempts.id, attemptId))
      .returning()

    if (!updated) return null

    // Optimasi performa: langsung return DTO tanpa round-trip tambahan quizzes & users
    return this.toQuizAttemptDto(updated, null, null)
  }

  public async saveAttemptAnswers(
    attemptId: string,
    answers: QuizAttemptAnswer[],
    autoScore: number,
    totalScore: number | null,
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'TIMED_OUT',
    submittedAt?: Date
  ): Promise<QuizAttemptDto | null> {
    const updateValues: Partial<NewQuizAttempt> = {
      answersJsonb: answers,
      autoScore: String(autoScore),
      score: totalScore !== null ? String(totalScore) : null,
      status,
      updatedAt: new Date()
    }

    if (submittedAt) {
      updateValues.submittedAt = submittedAt
    }

    const [updated] = await db
      .update(quizAttempts)
      .set(updateValues)
      .where(eq(quizAttempts.id, attemptId))
      .returning()

    if (!updated) return null

    const [quizRow] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, updated.quizId))
      .limit(1)

    const [studentRow] = await db
      .select({ name: users.name, nimNidn: users.nimNidn })
      .from(users)
      .where(eq(users.id, updated.studentId))
      .limit(1)

    return this.toQuizAttemptDto(updated, quizRow || null, studentRow || null)
  }

  public async gradeAttempt(
    attemptId: string,
    manualScore: number,
    totalScore: number,
    answers: QuizAttemptAnswer[],
    feedback?: string | null,
    gradedBy?: string
  ): Promise<QuizAttemptDto | null> {
    const [updated] = await db
      .update(quizAttempts)
      .set({
        manualScore: String(manualScore),
        score: String(totalScore),
        answersJsonb: answers,
        status: 'GRADED',
        feedback: feedback || null,
        gradedBy: gradedBy || null,
        gradedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(quizAttempts.id, attemptId))
      .returning()

    if (!updated) return null

    const [quizRow] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, updated.quizId))
      .limit(1)

    const [studentRow] = await db
      .select({ name: users.name, nimNidn: users.nimNidn })
      .from(users)
      .where(eq(users.id, updated.studentId))
      .limit(1)

    return this.toQuizAttemptDto(updated, quizRow || null, studentRow || null)
  }
}
