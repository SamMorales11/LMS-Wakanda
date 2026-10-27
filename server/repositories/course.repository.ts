import { eq, and, or, ilike, desc } from 'drizzle-orm'
import type { CourseDto, CreateCourseDto, UpdateCourseDto } from '~/types'
import { db, courses, programs, type Course as DrizzleCourse } from '../database'

export interface ICourseRepository {
  findById(id: string): Promise<CourseDto | null>
  findByProgramAndCode(programId: string, code: string): Promise<CourseDto | null>
  findAll(filter?: { programId?: string; search?: string }): Promise<CourseDto[]>
  create(dto: CreateCourseDto): Promise<CourseDto>
  update(id: string, dto: UpdateCourseDto): Promise<CourseDto | null>
  delete(id: string): Promise<boolean>
}

export class CourseRepository implements ICourseRepository {
  private toDto(row: DrizzleCourse, programName?: string, programCode?: string): CourseDto {
    return {
      id: row.id,
      programId: row.programId,
      code: row.code,
      name: row.name,
      credits: row.credits,
      semester: row.semester,
      description: row.description,
      syllabusUrl: row.syllabusUrl,
      isActive: row.isActive,
      programName,
      programCode,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)
    }
  }

  public async findById(id: string): Promise<CourseDto | null> {
    const rows = await db
      .select({
        course: courses,
        programName: programs.name,
        programCode: programs.code
      })
      .from(courses)
      .leftJoin(programs, eq(courses.programId, programs.id))
      .where(eq(courses.id, id))
      .limit(1)

    return rows[0] ? this.toDto(rows[0].course, rows[0].programName || undefined, rows[0].programCode || undefined) : null
  }

  public async findByProgramAndCode(programId: string, code: string): Promise<CourseDto | null> {
    const normalized = code.trim().toUpperCase()
    const rows = await db
      .select({
        course: courses,
        programName: programs.name,
        programCode: programs.code
      })
      .from(courses)
      .leftJoin(programs, eq(courses.programId, programs.id))
      .where(and(eq(courses.programId, programId), eq(courses.code, normalized)))
      .limit(1)

    return rows[0] ? this.toDto(rows[0].course, rows[0].programName || undefined, rows[0].programCode || undefined) : null
  }

  public async findAll(filter?: { programId?: string; search?: string }): Promise<CourseDto[]> {
    const conditions = []

    if (filter?.programId) {
      conditions.push(eq(courses.programId, filter.programId))
    }

    if (filter?.search) {
      const q = `%${filter.search.trim()}%`
      conditions.push(or(ilike(courses.code, q), ilike(courses.name, q)))
    }

    const rows = await db
      .select({
        course: courses,
        programName: programs.name,
        programCode: programs.code
      })
      .from(courses)
      .leftJoin(programs, eq(courses.programId, programs.id))
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
      .orderBy(courses.semester, courses.code)

    return rows.map(r => this.toDto(r.course, r.programName || undefined, r.programCode || undefined))
  }

  public async create(dto: CreateCourseDto): Promise<CourseDto> {
    const rows = await db.insert(courses).values({
      programId: dto.programId,
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      credits: dto.credits,
      semester: dto.semester,
      description: dto.description?.trim() || null,
      syllabusUrl: dto.syllabusUrl?.trim() || null,
      isActive: true
    }).returning()

    return this.findById(rows[0].id) as Promise<CourseDto>
  }

  public async update(id: string, dto: UpdateCourseDto): Promise<CourseDto | null> {
    const rows = await db.update(courses).set({
      ...(dto.programId !== undefined && { programId: dto.programId }),
      ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.credits !== undefined && { credits: dto.credits }),
      ...(dto.semester !== undefined && { semester: dto.semester }),
      ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      ...(dto.syllabusUrl !== undefined && { syllabusUrl: dto.syllabusUrl?.trim() || null }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date()
    }).where(eq(courses.id, id)).returning()

    return rows[0] ? this.findById(rows[0].id) : null
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await db.delete(courses).where(eq(courses.id, id)).returning({ id: courses.id })
    return rows.length > 0
  }
}

export const courseRepository = new CourseRepository()
