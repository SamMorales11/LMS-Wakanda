import { eq, desc, not } from 'drizzle-orm'
import type { AcademicTermDto, CreateAcademicTermDto, UpdateAcademicTermDto } from '~/types'
import { db, academicTerms, type AcademicTerm as DrizzleTerm } from '../database'

export interface IAcademicTermRepository {
  findById(id: string): Promise<AcademicTermDto | null>
  findByCode(code: string): Promise<AcademicTermDto | null>
  findActive(): Promise<AcademicTermDto | null>
  findAll(): Promise<AcademicTermDto[]>
  create(dto: CreateAcademicTermDto): Promise<AcademicTermDto>
  update(id: string, dto: UpdateAcademicTermDto): Promise<AcademicTermDto | null>
  setActive(id: string): Promise<AcademicTermDto | null>
  delete(id: string): Promise<boolean>
}

export class AcademicTermRepository implements IAcademicTermRepository {
  private toDto(row: DrizzleTerm): AcademicTermDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      year: row.year,
      semester: row.semester,
      startDate: row.startDate,
      endDate: row.endDate,
      isActive: row.isActive,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)
    }
  }

  public async findById(id: string): Promise<AcademicTermDto | null> {
    const rows = await db.select().from(academicTerms).where(eq(academicTerms.id, id)).limit(1)
    return rows[0] ? this.toDto(rows[0]) : null
  }

  public async findByCode(code: string): Promise<AcademicTermDto | null> {
    const rows = await db.select().from(academicTerms).where(eq(academicTerms.code, code.trim())).limit(1)
    return rows[0] ? this.toDto(rows[0]) : null
  }

  public async findActive(): Promise<AcademicTermDto | null> {
    const rows = await db.select().from(academicTerms).where(eq(academicTerms.isActive, true)).limit(1)
    return rows[0] ? this.toDto(rows[0]) : null
  }

  public async findAll(): Promise<AcademicTermDto[]> {
    const rows = await db.select().from(academicTerms).orderBy(desc(academicTerms.startDate))
    return rows.map(r => this.toDto(r))
  }

  public async create(dto: CreateAcademicTermDto): Promise<AcademicTermDto> {
    const rows = await db.insert(academicTerms).values({
      code: dto.code.trim(),
      name: dto.name.trim(),
      year: dto.year.trim(),
      semester: dto.semester,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isActive: dto.isActive ?? false
    }).returning()

    return this.toDto(rows[0])
  }

  public async update(id: string, dto: UpdateAcademicTermDto): Promise<AcademicTermDto | null> {
    const rows = await db.update(academicTerms).set({
      ...(dto.code !== undefined && { code: dto.code.trim() }),
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.year !== undefined && { year: dto.year.trim() }),
      ...(dto.semester !== undefined && { semester: dto.semester }),
      ...(dto.startDate !== undefined && { startDate: dto.startDate }),
      ...(dto.endDate !== undefined && { endDate: dto.endDate }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date()
    }).where(eq(academicTerms.id, id)).returning()

    return rows[0] ? this.toDto(rows[0]) : null
  }

  public async setActive(id: string): Promise<AcademicTermDto | null> {
    // Nonaktifkan semester lain
    await db.update(academicTerms).set({ isActive: false, updatedAt: new Date() }).where(not(eq(academicTerms.id, id)))

    // Aktifkan semester terpilih
    const rows = await db.update(academicTerms).set({ isActive: true, updatedAt: new Date() }).where(eq(academicTerms.id, id)).returning()
    return rows[0] ? this.toDto(rows[0]) : null
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await db.delete(academicTerms).where(eq(academicTerms.id, id)).returning({ id: academicTerms.id })
    return rows.length > 0
  }
}

export const academicTermRepository = new AcademicTermRepository()
