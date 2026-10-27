import type {
  SessionMaterialDto,
  CreateSessionMaterialDto,
  UpdateSessionMaterialDto,
  MaterialProgressDto,
  SessionProgressSummaryDto
} from '~/types'
import {
  materialRepository,
  type IMaterialRepository,
  classRepository
} from '../repositories'
import { storageService } from './storage.service'
import { NotFoundError, BadRequestError } from '../utils/errors'

export class MaterialService {
  constructor(private readonly repo: IMaterialRepository = materialRepository) {}

  /**
   * Mengambil seluruh materi perkuliahan untuk sesi pertemuan tertentu.
   * Secara otomatis menghasilkan Signed Read URL aktif (15 menit) untuk berkas privat
   * agar dapat langsung dipratinjau (preview PDF) atau diunduh oleh Mahasiswa/Dosen.
   */
  public async getMaterialsBySession(
    sessionId: string,
    studentId?: string,
    origin = ''
  ): Promise<SessionMaterialDto[]> {
    if (!sessionId) {
      throw new BadRequestError('ID sesi perkuliahan wajib disertakan')
    }

    const materials = await this.repo.findBySessionId(sessionId, studentId)

    // Perkaya setiap materi yang memiliki fileKey dengan Signed Read URL segar
    const enriched = await Promise.all(
      materials.map(async (m) => {
        if (m.fileKey) {
          try {
            const signed = await storageService.createSignedReadUrl(
              { fileKey: m.fileKey, expiresInSeconds: 900 },
              origin
            )
            return {
              ...m,
              fileUrl: signed.signedUrl
            }
          } catch (err) {
            console.warn(`[MaterialService] Gagal membuat signed URL untuk berkas '${m.fileKey}':`, err)
          }
        }
        return m
      })
    )

    return enriched
  }

  /**
   * Mengambil detail satu materi perkuliahan berdasarkan ID.
   */
  public async getMaterialById(id: string, studentId?: string, origin = ''): Promise<SessionMaterialDto> {
    if (!id) {
      throw new BadRequestError('ID materi wajib disertakan')
    }

    const material = await this.repo.findById(id, studentId)
    if (!material) {
      throw new NotFoundError(`Materi perkuliahan dengan ID '${id}' tidak ditemukan`)
    }

    if (material.fileKey) {
      try {
        const signed = await storageService.createSignedReadUrl(
          { fileKey: material.fileKey, expiresInSeconds: 900 },
          origin
        )
        return {
          ...material,
          fileUrl: signed.signedUrl
        }
      } catch (err) {
        console.warn(`[MaterialService] Gagal membuat signed URL untuk '${material.fileKey}':`, err)
      }
    }

    return material
  }

  /**
   * Membuat materi perkuliahan baru untuk sesi pertemuan tertentu (Khusus Dosen / Admin).
   */
  public async createMaterial(
    sessionId: string,
    dto: Omit<CreateSessionMaterialDto, 'sessionId'>
  ): Promise<SessionMaterialDto> {
    if (!sessionId) {
      throw new BadRequestError('ID sesi perkuliahan wajib disertakan')
    }

    // Buat data materi baru
    const created = await this.repo.create({
      ...dto,
      sessionId
    })

    return created
  }

  /**
   * Memperbarui materi perkuliahan yang sudah ada.
   */
  public async updateMaterial(id: string, dto: UpdateSessionMaterialDto): Promise<SessionMaterialDto> {
    const existing = await this.getMaterialById(id)

    const updated = await this.repo.update(id, dto)
    if (!updated) {
      throw new NotFoundError(`Gagal memperbarui materi perkuliahan dengan ID '${id}'`)
    }

    return updated
  }

  /**
   * Menghapus materi perkuliahan beserta berkasnya di Cloudflare R2 / penyimpanan lokal.
   */
  public async deleteMaterial(id: string): Promise<{ id: string; deleted: boolean }> {
    const material = await this.getMaterialById(id)

    // Hapus berkas fisik jika tersimpan
    if (material.fileKey) {
      try {
        await storageService.deleteFile(material.fileKey)
      } catch (err) {
        console.warn(`[MaterialService] Warning: Gagal menghapus berkas '${material.fileKey}':`, err)
      }
    }

    const deleted = await this.repo.delete(id)
    return { id, deleted }
  }

  /**
   * Menandai atau membatalkan status bacaan materi untuk Mahasiswa.
   */
  public async toggleReadStatus(
    materialId: string,
    studentId: string,
    isCompleted = true
  ): Promise<MaterialProgressDto> {
    if (!materialId || !studentId) {
      throw new BadRequestError('ID materi dan ID mahasiswa wajib disertakan')
    }

    await this.getMaterialById(materialId)
    return this.repo.setReadStatus(materialId, studentId, isCompleted)
  }

  /**
   * Mengambil ringkasan progres bacaan materi per sesi untuk Mahasiswa.
   */
  public async getStudentProgress(sessionId: string, studentId: string): Promise<SessionProgressSummaryDto> {
    if (!sessionId || !studentId) {
      throw new BadRequestError('ID sesi dan ID mahasiswa wajib disertakan')
    }
    return this.repo.getStudentProgress(sessionId, studentId)
  }
}

export const materialService = new MaterialService()
