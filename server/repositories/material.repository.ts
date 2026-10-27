import { eq, and, sql, asc } from 'drizzle-orm'
import type {
  SessionMaterialDto,
  CreateSessionMaterialDto,
  UpdateSessionMaterialDto,
  MaterialProgressDto,
  SessionProgressSummaryDto
} from '~/types'
import {
  db,
  sessionMaterials,
  materialReadProgress,
  classSessions,
  type SessionMaterial,
  type MaterialReadProgress
} from '../database'

export interface IMaterialRepository {
  findBySessionId(sessionId: string, studentId?: string): Promise<SessionMaterialDto[]>
  findById(id: string, studentId?: string): Promise<SessionMaterialDto | null>
  create(dto: CreateSessionMaterialDto): Promise<SessionMaterialDto>
  update(id: string, dto: UpdateSessionMaterialDto): Promise<SessionMaterialDto | null>
  delete(id: string): Promise<boolean>
  setReadStatus(materialId: string, studentId: string, isCompleted: boolean): Promise<MaterialProgressDto>
  getStudentProgress(sessionId: string, studentId: string): Promise<SessionProgressSummaryDto>
}

export class MaterialRepository implements IMaterialRepository {
  private toDto(row: SessionMaterial, progress?: { isCompleted: boolean; completedAt: Date } | null): SessionMaterialDto {
    return {
      id: row.id,
      sessionId: row.sessionId,
      title: row.title,
      description: row.description,
      materialType: row.materialType,
      fileKey: row.fileKey,
      fileUrl: row.fileUrl,
      fileName: row.fileName,
      fileSize: row.fileSize,
      externalUrl: row.externalUrl,
      orderIndex: row.orderIndex,
      isPublished: row.isPublished,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      isCompleted: progress ? progress.isCompleted : false,
      completedAt: progress?.completedAt ? progress.completedAt.toISOString() : null
    }
  }

  public async findBySessionId(sessionId: string, studentId?: string): Promise<SessionMaterialDto[]> {
    if (studentId) {
      // Query dengan JOIN ke material_read_progress untuk menandai status bacaan mahasiswa
      const rows = await db
        .select({
          material: sessionMaterials,
          progress: materialReadProgress
        })
        .from(sessionMaterials)
        .leftJoin(
          materialReadProgress,
          and(
            eq(materialReadProgress.materialId, sessionMaterials.id),
            eq(materialReadProgress.studentId, studentId)
          )
        )
        .where(eq(sessionMaterials.sessionId, sessionId))
        .orderBy(asc(sessionMaterials.orderIndex), asc(sessionMaterials.createdAt))

      return rows.map((r) => this.toDto(r.material, r.progress))
    }

    // Query umum tanpa data progress spesifik
    const rows = await db
      .select()
      .from(sessionMaterials)
      .where(eq(sessionMaterials.sessionId, sessionId))
      .orderBy(asc(sessionMaterials.orderIndex), asc(sessionMaterials.createdAt))

    return rows.map((r) => this.toDto(r))
  }

  public async findById(id: string, studentId?: string): Promise<SessionMaterialDto | null> {
    if (studentId) {
      const rows = await db
        .select({
          material: sessionMaterials,
          progress: materialReadProgress
        })
        .from(sessionMaterials)
        .leftJoin(
          materialReadProgress,
          and(
            eq(materialReadProgress.materialId, sessionMaterials.id),
            eq(materialReadProgress.studentId, studentId)
          )
        )
        .where(eq(sessionMaterials.id, id))
        .limit(1)

      return rows[0] ? this.toDto(rows[0].material, rows[0].progress) : null
    }

    const rows = await db.select().from(sessionMaterials).where(eq(sessionMaterials.id, id)).limit(1)
    return rows[0] ? this.toDto(rows[0]) : null
  }

  public async create(dto: CreateSessionMaterialDto): Promise<SessionMaterialDto> {
    const inserted = await db
      .insert(sessionMaterials)
      .values({
        sessionId: dto.sessionId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        materialType: dto.materialType || 'SLIDE',
        fileKey: dto.fileKey?.trim() || null,
        fileUrl: dto.fileUrl?.trim() || null,
        fileName: dto.fileName?.trim() || null,
        fileSize: dto.fileSize || null,
        externalUrl: dto.externalUrl?.trim() || null,
        orderIndex: dto.orderIndex ?? 0,
        isPublished: dto.isPublished ?? true
      })
      .returning()

    return this.toDto(inserted[0])
  }

  public async update(id: string, dto: UpdateSessionMaterialDto): Promise<SessionMaterialDto | null> {
    const updateData: Partial<typeof sessionMaterials.$inferInsert> = {
      updatedAt: new Date()
    }

    if (dto.title !== undefined) updateData.title = dto.title.trim()
    if (dto.description !== undefined) updateData.description = dto.description?.trim() || null
    if (dto.materialType !== undefined) updateData.materialType = dto.materialType
    if (dto.fileKey !== undefined) updateData.fileKey = dto.fileKey?.trim() || null
    if (dto.fileUrl !== undefined) updateData.fileUrl = dto.fileUrl?.trim() || null
    if (dto.fileName !== undefined) updateData.fileName = dto.fileName?.trim() || null
    if (dto.fileSize !== undefined) updateData.fileSize = dto.fileSize || null
    if (dto.externalUrl !== undefined) updateData.externalUrl = dto.externalUrl?.trim() || null
    if (dto.orderIndex !== undefined) updateData.orderIndex = dto.orderIndex
    if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished

    const updated = await db
      .update(sessionMaterials)
      .set(updateData)
      .where(eq(sessionMaterials.id, id))
      .returning()

    return updated[0] ? this.toDto(updated[0]) : null
  }

  public async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(sessionMaterials).where(eq(sessionMaterials.id, id)).returning({ id: sessionMaterials.id })
    return deleted.length > 0
  }

  public async setReadStatus(
    materialId: string,
    studentId: string,
    isCompleted: boolean
  ): Promise<MaterialProgressDto> {
    const result = await db
      .insert(materialReadProgress)
      .values({
        materialId,
        studentId,
        isCompleted,
        completedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [materialReadProgress.materialId, materialReadProgress.studentId],
        set: {
          isCompleted,
          completedAt: new Date()
        }
      })
      .returning()

    const row = result[0]
    return {
      materialId: row.materialId,
      studentId: row.studentId,
      isCompleted: row.isCompleted,
      completedAt: row.completedAt.toISOString()
    }
  }

  public async getStudentProgress(sessionId: string, studentId: string): Promise<SessionProgressSummaryDto> {
    const materials = await this.findBySessionId(sessionId, studentId)
    const publishedMaterials = materials.filter((m) => m.isPublished)
    const totalMaterials = publishedMaterials.length
    const completedMaterials = publishedMaterials.filter((m) => m.isCompleted).length
    const progressPercentage = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0

    return {
      sessionId,
      totalMaterials,
      completedMaterials,
      progressPercentage
    }
  }
}

export const materialRepository = new MaterialRepository()
