import { eq, and, or, ilike, desc, asc } from 'drizzle-orm'
import type {
  CourseClassDto,
  CourseClassDetailDto,
  CreateCourseClassDto,
  UpdateCourseClassDto,
  ClassSessionDto,
  GradeWeightDto
} from '~/types'
import {
  db,
  courseClasses,
  courses,
  academicTerms,
  classLecturers,
  classSessions,
  gradeWeights,
  users,
  type CourseClass as DrizzleClass,
  type ClassSession as DrizzleSession,
  type GradeWeight as DrizzleWeight
} from '../database'

export interface IClassRepository {
  findById(id: string): Promise<CourseClassDto | null>
  findDetailById(id: string): Promise<CourseClassDetailDto | null>
  findByTermAndCourse(academicTermId: string, courseId: string, code: string): Promise<CourseClassDto | null>
  findAll(filter?: { academicTermId?: string; courseId?: string; search?: string }): Promise<CourseClassDto[]>
  createWithSessionsAndWeights(dto: CreateCourseClassDto, baseDate: string): Promise<CourseClassDetailDto>
  update(id: string, dto: UpdateCourseClassDto): Promise<CourseClassDto | null>
  delete(id: string): Promise<boolean>
  getSessions(classId: string): Promise<ClassSessionDto[]>
  getGradeWeights(classId: string): Promise<GradeWeightDto[]>
}

export class ClassRepository implements IClassRepository {
  private toDto(row: DrizzleClass, courseName?: string, courseCode?: string, termName?: string, termCode?: string): CourseClassDto {
    return {
      id: row.id,
      courseId: row.courseId,
      academicTermId: row.academicTermId,
      code: row.code,
      capacity: row.capacity,
      room: row.room,
      scheduleDay: row.scheduleDay,
      scheduleStart: row.scheduleStart,
      scheduleEnd: row.scheduleEnd,
      isActive: row.isActive,
      courseName,
      courseCode,
      termName,
      termCode,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)
    }
  }

  private toSessionDto(row: DrizzleSession): ClassSessionDto {
    return {
      id: row.id,
      classId: row.classId,
      sessionNumber: row.sessionNumber,
      title: row.title,
      topicDescription: row.topicDescription,
      sessionDate: row.sessionDate,
      startTime: row.startTime,
      endTime: row.endTime,
      sessionType: row.sessionType,
      status: row.status,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)
    }
  }

  private toWeightDto(row: DrizzleWeight): GradeWeightDto {
    return {
      id: row.id,
      classId: row.classId,
      componentName: row.componentName,
      weightPercentage: String(row.weightPercentage),
      description: row.description,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)
    }
  }

  public async findById(id: string): Promise<CourseClassDto | null> {
    const rows = await db
      .select({
        courseClass: courseClasses,
        courseName: courses.name,
        courseCode: courses.code,
        termName: academicTerms.name,
        termCode: academicTerms.code
      })
      .from(courseClasses)
      .leftJoin(courses, eq(courseClasses.courseId, courses.id))
      .leftJoin(academicTerms, eq(courseClasses.academicTermId, academicTerms.id))
      .where(eq(courseClasses.id, id))
      .limit(1)

    return rows[0]
      ? this.toDto(rows[0].courseClass, rows[0].courseName || undefined, rows[0].courseCode || undefined, rows[0].termName || undefined, rows[0].termCode || undefined)
      : null
  }

  public async findByTermAndCourse(academicTermId: string, courseId: string, code: string): Promise<CourseClassDto | null> {
    const normalized = code.trim().toUpperCase()
    const rows = await db
      .select({
        courseClass: courseClasses,
        courseName: courses.name,
        courseCode: courses.code,
        termName: academicTerms.name,
        termCode: academicTerms.code
      })
      .from(courseClasses)
      .leftJoin(courses, eq(courseClasses.courseId, courses.id))
      .leftJoin(academicTerms, eq(courseClasses.academicTermId, academicTerms.id))
      .where(
        and(
          eq(courseClasses.academicTermId, academicTermId),
          eq(courseClasses.courseId, courseId),
          eq(courseClasses.code, normalized)
        )
      )
      .limit(1)

    return rows[0]
      ? this.toDto(rows[0].courseClass, rows[0].courseName || undefined, rows[0].courseCode || undefined, rows[0].termName || undefined, rows[0].termCode || undefined)
      : null
  }

  public async findAll(filter?: { academicTermId?: string; courseId?: string; search?: string }): Promise<CourseClassDto[]> {
    const conditions = []

    if (filter?.academicTermId) {
      conditions.push(eq(courseClasses.academicTermId, filter.academicTermId))
    }

    if (filter?.courseId) {
      conditions.push(eq(courseClasses.courseId, filter.courseId))
    }

    if (filter?.search) {
      const q = `%${filter.search.trim()}%`
      conditions.push(or(ilike(courseClasses.code, q), ilike(courses.name, q), ilike(courses.code, q)))
    }

    const rows = await db
      .select({
        courseClass: courseClasses,
        courseName: courses.name,
        courseCode: courses.code,
        termName: academicTerms.name,
        termCode: academicTerms.code
      })
      .from(courseClasses)
      .leftJoin(courses, eq(courseClasses.courseId, courses.id))
      .leftJoin(academicTerms, eq(courseClasses.academicTermId, academicTerms.id))
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
      .orderBy(courses.code, courseClasses.code)

    return rows.map(r => this.toDto(r.courseClass, r.courseName || undefined, r.courseCode || undefined, r.termName || undefined, r.termCode || undefined))
  }

  public async getSessions(classId: string): Promise<ClassSessionDto[]> {
    const rows = await db
      .select()
      .from(classSessions)
      .where(eq(classSessions.classId, classId))
      .orderBy(asc(classSessions.sessionNumber))

    return rows.map(r => this.toSessionDto(r))
  }

  public async getGradeWeights(classId: string): Promise<GradeWeightDto[]> {
    const rows = await db
      .select()
      .from(gradeWeights)
      .where(eq(gradeWeights.classId, classId))
      .orderBy(desc(gradeWeights.weightPercentage))

    return rows.map(r => this.toWeightDto(r))
  }

  public async findDetailById(id: string): Promise<CourseClassDetailDto | null> {
    const baseClass = await this.findById(id)
    if (!baseClass) {
      return null
    }

    const [sessions, weights, lecturersRows] = await Promise.all([
      this.getSessions(id),
      this.getGradeWeights(id),
      db
        .select({
          lecturer: users,
          isPrimary: classLecturers.isPrimary
        })
        .from(classLecturers)
        .innerJoin(users, eq(classLecturers.lecturerId, users.id))
        .where(eq(classLecturers.classId, id))
    ])

    return {
      ...baseClass,
      sessions,
      gradeWeights: weights,
      lecturers: lecturersRows.map(l => ({
        id: l.lecturer.id,
        name: l.lecturer.name,
        email: l.lecturer.email,
        nimNidn: l.lecturer.nimNidn,
        isPrimary: l.isPrimary
      }))
    }
  }

  /**
   * DATABASE TRANSACTION ATOMIK:
   * 1. Simpan data Kelas Paralel (Rombongan Belajar)
   * 2. Hubungkan Dosen Pengampu jika disediakan
   * 3. Generate otomatis 16 Pertemuan (1-7 Tatap Muka, 8 UTS, 9-15 Tatap Muka, 16 UAS)
   * 4. Inisialisasi otomatis bobot nilai default (Total 100%)
   */
  public async createWithSessionsAndWeights(dto: CreateCourseClassDto, baseDate: string): Promise<CourseClassDetailDto> {
    return await db.transaction(async (tx) => {
      // 1. Simpan kelas baru
      const [newClass] = await tx
        .insert(courseClasses)
        .values({
          courseId: dto.courseId,
          academicTermId: dto.academicTermId,
          code: dto.code.trim().toUpperCase(),
          capacity: dto.capacity ?? 40,
          room: dto.room?.trim() || 'Ruang Kuliah ITW',
          scheduleDay: dto.scheduleDay?.trim().toUpperCase() || 'SENIN',
          scheduleStart: dto.scheduleStart || '08:00:00',
          scheduleEnd: dto.scheduleEnd || '10:30:00',
          isActive: true
        })
        .returning()

      // 2. Hubungkan Dosen Pengampu jika ada
      if (dto.lecturerId) {
        await tx.insert(classLecturers).values({
          classId: newClass.id,
          lecturerId: dto.lecturerId,
          isPrimary: true
        })
      }

      // 3. Generate 16 sesi pertemuan
      const startTime = dto.scheduleStart || '08:00:00'
      const endTime = dto.scheduleEnd || '10:30:00'
      const sessionsToInsert = []

      for (let sessionNum = 1; sessionNum <= 16; sessionNum++) {
        // Hitung tanggal per minggu berturut-turut (sessionNum - 1 minggu setelah baseDate)
        const d = new Date(baseDate)
        d.setDate(d.getDate() + (sessionNum - 1) * 7)
        const sessionDate = d.toISOString().split('T')[0]

        let title = `Pertemuan ${sessionNum}: Perkuliahan Tatap Muka`
        let topicDescription = `Materi perkuliahan teori, praktikum, dan diskusi interaktif sesi ke-${sessionNum}`
        let sessionType: 'REGULAR' | 'MIDTERM_EXAM' | 'FINAL_EXAM' = 'REGULAR'

        if (sessionNum === 8) {
          title = 'Pertemuan 8: Ujian Tengah Semester (UTS)'
          topicDescription = 'Evaluasi capaian pembelajaran materi perkuliahan pertemuan 1 sampai dengan pertemuan 7'
          sessionType = 'MIDTERM_EXAM'
        } else if (sessionNum === 16) {
          title = 'Pertemuan 16: Ujian Akhir Semester (UAS)'
          topicDescription = 'Evaluasi komprehensif capaian pembelajaran materi seluruh perkuliahan semester ini'
          sessionType = 'FINAL_EXAM'
        }

        sessionsToInsert.push({
          classId: newClass.id,
          sessionNumber: sessionNum,
          title,
          topicDescription,
          sessionDate,
          startTime,
          endTime,
          sessionType,
          status: 'SCHEDULED' as const
        })
      }

      await tx.insert(classSessions).values(sessionsToInsert)

      // 4. Inisialisasi bobot nilai default (Total 100.00%)
      const defaultWeights = [
        {
          classId: newClass.id,
          componentName: 'ATTENDANCE',
          weightPercentage: '10.00',
          description: 'Presensi dan kedisiplinan kehadiran di kelas (Bobot: 10%)'
        },
        {
          classId: newClass.id,
          componentName: 'ASSIGNMENT',
          weightPercentage: '20.00',
          description: 'Tugas mandiri, terstruktur, dan praktikum (Bobot: 20%)'
        },
        {
          classId: newClass.id,
          componentName: 'QUIZ',
          weightPercentage: '15.00',
          description: 'Kuis mingguan dan pemahaman konsep (Bobot: 15%)'
        },
        {
          classId: newClass.id,
          componentName: 'MIDTERM_EXAM',
          weightPercentage: '25.00',
          description: 'Ujian Tengah Semester (UTS) Pertemuan 8 (Bobot: 25%)'
        },
        {
          classId: newClass.id,
          componentName: 'FINAL_EXAM',
          weightPercentage: '30.00',
          description: 'Ujian Akhir Semester (UAS) Pertemuan 16 (Bobot: 30%)'
        }
      ]

      await tx.insert(gradeWeights).values(defaultWeights)

      return newClass
    }).then(async (newClass) => {
      // Return detail lengkap setelah commit
      const detail = await this.findDetailById(newClass.id)
      return detail!
    })
  }

  public async update(id: string, dto: UpdateCourseClassDto): Promise<CourseClassDto | null> {
    const rows = await db.update(courseClasses).set({
      ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
      ...(dto.capacity !== undefined && { capacity: dto.capacity }),
      ...(dto.room !== undefined && { room: dto.room?.trim() || null }),
      ...(dto.scheduleDay !== undefined && { scheduleDay: dto.scheduleDay?.trim().toUpperCase() || null }),
      ...(dto.scheduleStart !== undefined && { scheduleStart: dto.scheduleStart }),
      ...(dto.scheduleEnd !== undefined && { scheduleEnd: dto.scheduleEnd }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date()
    }).where(eq(courseClasses.id, id)).returning()

    return rows[0] ? this.findById(rows[0].id) : null
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await db.delete(courseClasses).where(eq(courseClasses.id, id)).returning({ id: courseClasses.id })
    return rows.length > 0
  }
}

export const classRepository = new ClassRepository()
