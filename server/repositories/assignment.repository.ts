import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm'
import type {
  AssignmentDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmissionDto,
  CreateSubmissionDto,
  SubmissionTimingStatus
} from '~/types'
import {
  db,
  assignments,
  submissions,
  users,
  classSessions,
  classEnrollments,
  type Assignment,
  type Submission,
  type NewAssignment,
  type NewSubmission
} from '../database'

export interface IAssignmentRepository {
  findById(id: string, studentId?: string): Promise<AssignmentDto | null>
  findBySessionId(sessionId: string, studentId?: string): Promise<AssignmentDto[]>
  findByClassId(classId: string, studentId?: string): Promise<AssignmentDto[]>
  create(dto: CreateAssignmentDto, createdBy?: string): Promise<AssignmentDto>
  update(id: string, dto: UpdateAssignmentDto): Promise<AssignmentDto | null>
  delete(id: string): Promise<boolean>

  // Submissions
  findSubmission(assignmentId: string, studentId: string): Promise<SubmissionDto | null>
  findSubmissionById(id: string): Promise<SubmissionDto | null>
  findSubmissionsByAssignmentId(assignmentId: string): Promise<SubmissionDto[]>
  createOrUpdateSubmission(dto: CreateSubmissionDto, studentId: string, isLate: boolean): Promise<SubmissionDto>
  gradeSubmission(submissionId: string, score: number, feedback?: string | null, gradedBy?: string): Promise<SubmissionDto | null>

  // Helper
  isStudentEnrolledInClass(classId: string, studentId: string): Promise<boolean>
  countEnrolledStudents(classId: string): Promise<number>
  countSubmissionsByAssignmentId(assignmentId: string): Promise<number>
}

export class AssignmentRepository implements IAssignmentRepository {
  /**
   * Helper: Transform database Assignment row to AssignmentDto
   */
  private toAssignmentDto(
    row: Assignment,
    sessionRow?: { sessionNumber: number; title: string } | null,
    creatorName?: string | null,
    submissionCount?: number,
    mySubmission?: SubmissionDto | null
  ): AssignmentDto {
    const now = Date.now()
    const dueTime = row.dueDate.getTime()
    const cutoffTime = row.cutoffDate ? row.cutoffDate.getTime() : null

    const isExpired = now > dueTime
    const isClosed = cutoffTime !== null ? now > cutoffTime : false

    return {
      id: row.id,
      classId: row.classId,
      sessionId: row.sessionId,
      sessionNumber: sessionRow?.sessionNumber ?? null,
      sessionTitle: sessionRow?.title ?? null,
      title: row.title,
      description: row.description,
      instructions: row.instructions,
      maxScore: String(row.maxScore),
      dueDate: row.dueDate.toISOString(),
      cutoffDate: row.cutoffDate ? row.cutoffDate.toISOString() : null,
      allowLateSubmission: row.allowLateSubmission,
      latePenaltyPercentage: String(row.latePenaltyPercentage),
      allowedFileTypes: row.allowedFileTypes || 'pdf,zip',
      maxFileSizeMb: row.maxFileSizeMb ?? 10,
      isPublished: row.isPublished,
      isExpired,
      isClosed,
      createdBy: row.createdBy,
      creatorName: creatorName ?? null,
      submissionCount: submissionCount ?? 0,
      mySubmission: mySubmission ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  /**
   * Helper: Transform database Submission row to SubmissionDto
   */
  public toSubmissionDto(
    row: Submission,
    studentRow?: { name: string; nimNidn: string | null; email: string } | null,
    graderName?: string | null
  ): SubmissionDto {
    const timingStatus: SubmissionTimingStatus = row.isLate ? 'LATE' : 'ON_TIME'
    const timingLabel = row.isLate ? 'Terlambat' : 'Tepat Waktu'
    const timingColor = row.isLate ? '#DC2626' : '#16A34A' // Semantic Danger / Semantic Success

    return {
      id: row.id,
      assignmentId: row.assignmentId,
      studentId: row.studentId,
      studentName: studentRow?.name,
      studentNim: studentRow?.nimNidn,
      studentEmail: studentRow?.email,
      fileKey: row.fileKey,
      fileUrl: row.fileUrl,
      fileName: row.fileName,
      fileSize: row.fileSize,
      fileType: row.fileType,
      contentText: row.contentText,
      submittedAt: row.submittedAt.toISOString(),
      isLate: row.isLate,
      timingStatus,
      timingLabel,
      timingColor,
      score: row.score ? String(row.score) : null,
      feedback: row.feedback,
      gradedBy: row.gradedBy,
      graderName: graderName || undefined,
      gradedAt: row.gradedAt ? row.gradedAt.toISOString() : null,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  public async findById(id: string, studentId?: string): Promise<AssignmentDto | null> {
    const [row] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
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

    let creatorName: string | null = null
    if (row.createdBy) {
      const [u] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, row.createdBy))
        .limit(1)
      creatorName = u?.name || null
    }

    let mySubmission: SubmissionDto | null = null
    if (studentId) {
      mySubmission = await this.findSubmission(id, studentId)
    }

    const submissionCount = await this.countSubmissionsByAssignmentId(id)

    return this.toAssignmentDto(
      row,
      sessionRow,
      creatorName,
      submissionCount,
      mySubmission
    )
  }

  public async findBySessionId(sessionId: string, studentId?: string): Promise<AssignmentDto[]> {
    const rows = await db
      .select()
      .from(assignments)
      .where(eq(assignments.sessionId, sessionId))
      .orderBy(desc(assignments.dueDate))

    if (rows.length === 0) return []

    // Ambil info sesi
    const [session] = await db
      .select({ sessionNumber: classSessions.sessionNumber, title: classSessions.title })
      .from(classSessions)
      .where(eq(classSessions.id, sessionId))
      .limit(1)

    const assignmentIds = rows.map(r => r.id)

    // Ambil submission student jika studentId disediakan
    let studentSubmissionsMap = new Map<string, SubmissionDto>()
    if (studentId && assignmentIds.length > 0) {
      const subs = await db
        .select()
        .from(submissions)
        .where(
          and(
            inArray(submissions.assignmentId, assignmentIds),
            eq(submissions.studentId, studentId)
          )
        )

      subs.forEach(s => {
        studentSubmissionsMap.set(s.assignmentId, this.toSubmissionDto(s))
      })
    }

    return Promise.all(
      rows.map(async (r) => {
        const subCount = await this.countSubmissionsByAssignmentId(r.id)
        const mySub = studentSubmissionsMap.get(r.id) || null
        return this.toAssignmentDto(
          r,
          session || null,
          null,
          subCount,
          mySub
        )
      })
    )
  }

  public async findByClassId(classId: string, studentId?: string): Promise<AssignmentDto[]> {
    const rows = await db
      .select()
      .from(assignments)
      .where(eq(assignments.classId, classId))
      .orderBy(asc(assignments.dueDate))

    if (rows.length === 0) return []

    const assignmentIds = rows.map(r => r.id)

    let studentSubmissionsMap = new Map<string, SubmissionDto>()
    if (studentId && assignmentIds.length > 0) {
      const subs = await db
        .select()
        .from(submissions)
        .where(
          and(
            inArray(submissions.assignmentId, assignmentIds),
            eq(submissions.studentId, studentId)
          )
        )

      subs.forEach(s => {
        studentSubmissionsMap.set(s.assignmentId, this.toSubmissionDto(s))
      })
    }

    return Promise.all(
      rows.map(async (r) => {
        const subCount = await this.countSubmissionsByAssignmentId(r.id)
        const mySub = studentSubmissionsMap.get(r.id) || null
        return this.toAssignmentDto(
          r,
          null,
          null,
          subCount,
          mySub
        )
      })
    )
  }

  public async create(dto: CreateAssignmentDto, createdBy?: string): Promise<AssignmentDto> {
    const [inserted] = await db
      .insert(assignments)
      .values({
        classId: dto.classId,
        sessionId: dto.sessionId || null,
        title: dto.title,
        description: dto.description || null,
        instructions: dto.instructions || null,
        maxScore: dto.maxScore ? dto.maxScore.toFixed(2) : '100.00',
        dueDate: new Date(dto.dueDate),
        cutoffDate: dto.cutoffDate ? new Date(dto.cutoffDate) : null,
        allowLateSubmission: dto.allowLateSubmission ?? true,
        latePenaltyPercentage: dto.latePenaltyPercentage ? dto.latePenaltyPercentage.toFixed(2) : '0.00',
        allowedFileTypes: dto.allowedFileTypes || 'pdf,zip',
        maxFileSizeMb: dto.maxFileSizeMb ?? 10,
        isPublished: dto.isPublished ?? true,
        createdBy: createdBy || null
      })
      .returning()

    return this.toAssignmentDto(inserted)
  }

  public async update(id: string, dto: UpdateAssignmentDto): Promise<AssignmentDto | null> {
    const updateValues: Partial<NewAssignment> = {
      updatedAt: new Date()
    }

    if (dto.title !== undefined) updateValues.title = dto.title
    if (dto.description !== undefined) updateValues.description = dto.description
    if (dto.instructions !== undefined) updateValues.instructions = dto.instructions
    if (dto.maxScore !== undefined) updateValues.maxScore = dto.maxScore.toFixed(2)
    if (dto.dueDate !== undefined) updateValues.dueDate = new Date(dto.dueDate)
    if (dto.cutoffDate !== undefined) updateValues.cutoffDate = dto.cutoffDate ? new Date(dto.cutoffDate) : null
    if (dto.allowLateSubmission !== undefined) updateValues.allowLateSubmission = dto.allowLateSubmission
    if (dto.latePenaltyPercentage !== undefined) updateValues.latePenaltyPercentage = dto.latePenaltyPercentage.toFixed(2)
    if (dto.allowedFileTypes !== undefined) updateValues.allowedFileTypes = dto.allowedFileTypes
    if (dto.maxFileSizeMb !== undefined) updateValues.maxFileSizeMb = dto.maxFileSizeMb
    if (dto.isPublished !== undefined) updateValues.isPublished = dto.isPublished

    const [updated] = await db
      .update(assignments)
      .set(updateValues)
      .where(eq(assignments.id, id))
      .returning()

    if (!updated) return null
    return this.findById(id)
  }

  public async delete(id: string): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id)).returning({ id: assignments.id })
    return result.length > 0
  }

  // ==========================================================================
  // SUBMISSIONS REPOSITORY
  // ==========================================================================

  public async findSubmission(assignmentId: string, studentId: string): Promise<SubmissionDto | null> {
    const [sub] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId)))
      .limit(1)

    if (!sub) return null

    const [student] = await db
      .select({ name: users.name, nimNidn: users.nimNidn, email: users.email })
      .from(users)
      .where(eq(users.id, sub.studentId))
      .limit(1)

    return this.toSubmissionDto(sub, student || null)
  }

  public async findSubmissionById(id: string): Promise<SubmissionDto | null> {
    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1)

    if (!sub) return null

    const [student] = await db
      .select({ name: users.name, nimNidn: users.nimNidn, email: users.email })
      .from(users)
      .where(eq(users.id, sub.studentId))
      .limit(1)

    return this.toSubmissionDto(sub, student || null)
  }

  public async findSubmissionsByAssignmentId(assignmentId: string): Promise<SubmissionDto[]> {
    const rows = await db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt))

    if (rows.length === 0) return []

    const studentIds = [...new Set(rows.map(r => r.studentId))]
    const studentUsers = await db
      .select({ id: users.id, name: users.name, nimNidn: users.nimNidn, email: users.email })
      .from(users)
      .where(inArray(users.id, studentIds))

    const studentMap = new Map(studentUsers.map(u => [u.id, u]))

    return rows.map(r => this.toSubmissionDto(r, studentMap.get(r.studentId) || null))
  }

  public async createOrUpdateSubmission(
    dto: CreateSubmissionDto,
    studentId: string,
    isLate: boolean
  ): Promise<SubmissionDto> {
    const serverNow = new Date()

    const [saved] = await db
      .insert(submissions)
      .values({
        assignmentId: dto.assignmentId,
        studentId,
        fileKey: dto.fileKey || null,
        fileUrl: dto.fileUrl || null,
        fileName: dto.fileName || null,
        fileSize: dto.fileSize || null,
        fileType: dto.fileType || null,
        contentText: dto.contentText || null,
        submittedAt: serverNow,
        isLate,
        status: 'SUBMITTED',
        updatedAt: serverNow
      })
      .onConflictDoUpdate({
        target: [submissions.assignmentId, submissions.studentId],
        set: {
          fileKey: dto.fileKey || sql`${submissions.fileKey}`,
          fileUrl: dto.fileUrl || sql`${submissions.fileUrl}`,
          fileName: dto.fileName || sql`${submissions.fileName}`,
          fileSize: dto.fileSize || sql`${submissions.fileSize}`,
          fileType: dto.fileType || sql`${submissions.fileType}`,
          contentText: dto.contentText || sql`${submissions.contentText}`,
          submittedAt: serverNow,
          isLate,
          status: 'SUBMITTED',
          updatedAt: serverNow
        }
      })
      .returning()

    const studentRows = await db
      .select({
        name: users.name,
        nimNidn: users.nimNidn,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1)

    return this.toSubmissionDto(saved, studentRows[0] || null)
  }

  public async gradeSubmission(
    submissionId: string,
    score: number,
    feedback?: string | null,
    gradedBy?: string
  ): Promise<SubmissionDto | null> {
    const [updated] = await db
      .update(submissions)
      .set({
        score: score.toFixed(2),
        feedback: feedback || null,
        gradedBy: gradedBy || null,
        gradedAt: new Date(),
        status: 'GRADED',
        updatedAt: new Date()
      })
      .where(eq(submissions.id, submissionId))
      .returning()

    if (!updated) return null
    return this.findSubmissionById(submissionId)
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  public async isStudentEnrolledInClass(classId: string, studentId: string): Promise<boolean> {
    const rows = await db
      .select({ id: classEnrollments.id })
      .from(classEnrollments)
      .where(
        and(
          eq(classEnrollments.classId, classId),
          eq(classEnrollments.studentId, studentId),
          eq(classEnrollments.status, 'ENROLLED')
        )
      )
      .limit(1)

    return rows.length > 0
  }

  public async countEnrolledStudents(classId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(classEnrollments)
      .where(
        and(
          eq(classEnrollments.classId, classId),
          eq(classEnrollments.status, 'ENROLLED')
        )
      )

    return result[0]?.count ?? 0
  }

  public async countSubmissionsByAssignmentId(assignmentId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))

    return result[0]?.count ?? 0
  }
}

export const assignmentRepository = new AssignmentRepository()
