import { eq, and, sql, desc, gte, lte } from 'drizzle-orm'
import type {
  AttendanceStatus,
  AttendanceMethod,
  AttendanceTokenDto,
  AttendanceLogDto
} from '~/types'
import {
  db,
  attendanceTokens,
  attendanceLogs,
  classSessions,
  classEnrollments,
  users,
  type AttendanceToken,
  type AttendanceLog
} from '../database'

export interface IAttendanceRepository {
  // Token Operations
  findActiveTokenBySessionId(sessionId: string, now?: Date): Promise<AttendanceToken | null>
  findTokenByValue(token: string): Promise<AttendanceToken | null>
  deactivateTokensBySessionId(sessionId: string): Promise<void>
  createToken(data: {
    sessionId: string
    token: string
    qrCodePayload: string
    validFrom: Date
    validUntil: Date
    createdBy?: string
  }): Promise<AttendanceToken>

  // Log Operations
  findLog(sessionId: string, studentId: string): Promise<AttendanceLog | null>
  findLogsBySessionId(sessionId: string): Promise<AttendanceLogDto[]>
  createOrUpdateLog(data: {
    sessionId: string
    studentId: string
    status: AttendanceStatus
    checkInMethod: AttendanceMethod
    deviceInfo?: string
    notes?: string
  }): Promise<AttendanceLog>

  // Class & Student Operations
  findClassSessions(classId: string): Promise<{ id: string; sessionNumber: number; title: string }[]>
  findStudentLogsByClassId(classId: string, studentId: string): Promise<AttendanceLogDto[]>
  findEnrolledStudents(classId: string): Promise<{ id: string; name: string; nimNidn: string | null; email: string }[]>
  isStudentEnrolledInClass(classId: string, studentId: string): Promise<boolean>
  countEnrolledStudents(classId: string): Promise<number>
  getSessionById(sessionId: string): Promise<{ id: string; classId: string; sessionNumber: number; title: string } | null>
}

export class AttendanceRepository implements IAttendanceRepository {
  public async findActiveTokenBySessionId(sessionId: string, now = new Date()): Promise<AttendanceToken | null> {
    const rows = await db
      .select()
      .from(attendanceTokens)
      .where(
        and(
          eq(attendanceTokens.sessionId, sessionId),
          eq(attendanceTokens.isActive, true),
          gte(attendanceTokens.validUntil, now)
        )
      )
      .orderBy(desc(attendanceTokens.createdAt))
      .limit(1)

    return rows[0] || null
  }

  public async findTokenByValue(token: string): Promise<AttendanceToken | null> {
    const cleanToken = token.replace(/[^0-9A-Za-z]/g, '')
    const rows = await db
      .select()
      .from(attendanceTokens)
      .where(and(eq(attendanceTokens.token, cleanToken), eq(attendanceTokens.isActive, true)))
      .orderBy(desc(attendanceTokens.createdAt))
      .limit(1)

    return rows[0] || null
  }

  public async deactivateTokensBySessionId(sessionId: string): Promise<void> {
    await db
      .update(attendanceTokens)
      .set({ isActive: false })
      .where(and(eq(attendanceTokens.sessionId, sessionId), eq(attendanceTokens.isActive, true)))
  }

  public async createToken(data: {
    sessionId: string
    token: string
    qrCodePayload: string
    validFrom: Date
    validUntil: Date
    createdBy?: string
  }): Promise<AttendanceToken> {
    const inserted = await db
      .insert(attendanceTokens)
      .values({
        sessionId: data.sessionId,
        token: data.token,
        qrCodePayload: data.qrCodePayload,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        isActive: true,
        createdBy: data.createdBy || null
      })
      .returning()

    return inserted[0]
  }

  public async findLog(sessionId: string, studentId: string): Promise<AttendanceLog | null> {
    const rows = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.sessionId, sessionId), eq(attendanceLogs.studentId, studentId)))
      .limit(1)

    return rows[0] || null
  }

  public async findLogsBySessionId(sessionId: string): Promise<AttendanceLogDto[]> {
    const rows = await db
      .select({
        log: attendanceLogs,
        student: users
      })
      .from(attendanceLogs)
      .innerJoin(users, eq(attendanceLogs.studentId, users.id))
      .where(eq(attendanceLogs.sessionId, sessionId))
      .orderBy(desc(attendanceLogs.checkInTime))

    return rows.map((r) => ({
      id: r.log.id,
      sessionId: r.log.sessionId,
      studentId: r.log.studentId,
      studentName: r.student.name,
      studentNim: r.student.nimNidn,
      studentEmail: r.student.email,
      status: r.log.status,
      checkInTime: r.log.checkInTime instanceof Date ? r.log.checkInTime.toISOString() : String(r.log.checkInTime),
      checkInMethod: r.log.checkInMethod,
      deviceInfo: r.log.deviceInfo,
      notes: r.log.notes,
      createdAt: r.log.createdAt instanceof Date ? r.log.createdAt.toISOString() : String(r.log.createdAt),
      updatedAt: r.log.updatedAt instanceof Date ? r.log.updatedAt.toISOString() : String(r.log.updatedAt)
    }))
  }

  public async createOrUpdateLog(data: {
    sessionId: string
    studentId: string
    status: AttendanceStatus
    checkInMethod: AttendanceMethod
    deviceInfo?: string
    notes?: string
  }): Promise<AttendanceLog> {
    const result = await db
      .insert(attendanceLogs)
      .values({
        sessionId: data.sessionId,
        studentId: data.studentId,
        status: data.status,
        checkInTime: new Date(),
        checkInMethod: data.checkInMethod,
        deviceInfo: data.deviceInfo || null,
        notes: data.notes || null
      })
      .onConflictDoUpdate({
        target: [attendanceLogs.sessionId, attendanceLogs.studentId],
        set: {
          status: data.status,
          checkInMethod: data.checkInMethod,
          deviceInfo: data.deviceInfo || null,
          notes: data.notes || null,
          updatedAt: new Date()
        }
      })
      .returning()

    return result[0]
  }

  public async getSessionById(sessionId: string): Promise<{ id: string; classId: string; sessionNumber: number; title: string } | null> {
    const rows = await db
      .select({
        id: classSessions.id,
        classId: classSessions.classId,
        sessionNumber: classSessions.sessionNumber,
        title: classSessions.title
      })
      .from(classSessions)
      .where(eq(classSessions.id, sessionId))
      .limit(1)

    return rows[0] || null
  }

  public async findClassSessions(classId: string): Promise<{ id: string; sessionNumber: number; title: string }[]> {
    return db
      .select({
        id: classSessions.id,
        sessionNumber: classSessions.sessionNumber,
        title: classSessions.title
      })
      .from(classSessions)
      .where(eq(classSessions.classId, classId))
      .orderBy(classSessions.sessionNumber)
  }

  public async findStudentLogsByClassId(classId: string, studentId: string): Promise<AttendanceLogDto[]> {
    const rows = await db
      .select({
        log: attendanceLogs,
        student: users
      })
      .from(attendanceLogs)
      .innerJoin(classSessions, eq(attendanceLogs.sessionId, classSessions.id))
      .innerJoin(users, eq(attendanceLogs.studentId, users.id))
      .where(and(eq(classSessions.classId, classId), eq(attendanceLogs.studentId, studentId)))
      .orderBy(classSessions.sessionNumber)

    return rows.map((r) => ({
      id: r.log.id,
      sessionId: r.log.sessionId,
      studentId: r.log.studentId,
      studentName: r.student.name,
      studentNim: r.student.nimNidn,
      studentEmail: r.student.email,
      status: r.log.status,
      checkInTime: r.log.checkInTime instanceof Date ? r.log.checkInTime.toISOString() : String(r.log.checkInTime),
      checkInMethod: r.log.checkInMethod,
      deviceInfo: r.log.deviceInfo,
      notes: r.log.notes,
      createdAt: r.log.createdAt instanceof Date ? r.log.createdAt.toISOString() : String(r.log.createdAt),
      updatedAt: r.log.updatedAt instanceof Date ? r.log.updatedAt.toISOString() : String(r.log.updatedAt)
    }))
  }

  public async findEnrolledStudents(
    classId: string
  ): Promise<{ id: string; name: string; nimNidn: string | null; email: string }[]> {
    return db
      .select({
        id: users.id,
        name: users.name,
        nimNidn: users.nimNidn,
        email: users.email
      })
      .from(classEnrollments)
      .innerJoin(users, eq(classEnrollments.studentId, users.id))
      .where(and(eq(classEnrollments.classId, classId), eq(classEnrollments.status, 'ENROLLED')))
      .orderBy(users.name)
  }

  public async isStudentEnrolledInClass(classId: string, studentId: string): Promise<boolean> {
    const rows = await db
      .select({ id: classEnrollments.id })
      .from(classEnrollments)
      .where(and(eq(classEnrollments.classId, classId), eq(classEnrollments.studentId, studentId)))
      .limit(1)

    return rows.length > 0
  }

  public async countEnrolledStudents(classId: string): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(classEnrollments)
      .where(eq(classEnrollments.classId, classId))

    return Number(rows[0]?.count || 0)
  }
}

export const attendanceRepository = new AttendanceRepository()
