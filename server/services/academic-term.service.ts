import type { AcademicTermDto, CreateAcademicTermDto, UpdateAcademicTermDto } from '~/types'
import { academicTermRepository, type IAcademicTermRepository } from '../repositories'
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors'

export class AcademicTermService {
  constructor(private readonly repo: IAcademicTermRepository = academicTermRepository) {}

  public async getAllTerms(): Promise<AcademicTermDto[]> {
    return this.repo.findAll()
  }

  public async getTermById(id: string): Promise<AcademicTermDto> {
    if (!id) {
      throw new BadRequestError('ID semester wajib disertakan')
    }
    const term = await this.repo.findById(id)
    if (!term) {
      throw new NotFoundError(`Semester dengan ID '${id}' tidak ditemukan`)
    }
    return term
  }

  public async getActiveTerm(): Promise<AcademicTermDto | null> {
    return this.repo.findActive()
  }

  public async createTerm(dto: CreateAcademicTermDto): Promise<AcademicTermDto> {
    // Validasi keunikan kode semester
    const existing = await this.repo.findByCode(dto.code)
    if (existing) {
      throw new ConflictError(`Semester dengan kode '${dto.code}' sudah terdaftar`)
    }

    // Validasi rentang tanggal
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestError('Tanggal mulai semester harus lebih awal daripada tanggal selesai')
    }

    const created = await this.repo.create(dto)

    // Jika diset sebagai aktif, nonaktifkan semester lainnya
    if (dto.isActive) {
      await this.repo.setActive(created.id)
      return (await this.repo.findById(created.id))!
    }

    return created
  }

  public async updateTerm(id: string, dto: UpdateAcademicTermDto): Promise<AcademicTermDto> {
    await this.getTermById(id)

    if (dto.code) {
      const existing = await this.repo.findByCode(dto.code)
      if (existing && existing.id !== id) {
        throw new ConflictError(`Semester dengan kode '${dto.code}' sudah digunakan`)
      }
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestError('Tanggal mulai semester harus lebih awal daripada tanggal selesai')
      }
    }

    const updated = await this.repo.update(id, dto)
    if (!updated) {
      throw new NotFoundError(`Gagal memperbarui semester dengan ID '${id}'`)
    }

    if (dto.isActive) {
      await this.repo.setActive(id)
      return (await this.repo.findById(id))!
    }

    return updated
  }

  public async activateTerm(id: string): Promise<AcademicTermDto> {
    await this.getTermById(id)
    const activated = await this.repo.setActive(id)
    if (!activated) {
      throw new NotFoundError(`Gagal mengaktifkan semester dengan ID '${id}'`)
    }
    return activated
  }

  public async deleteTerm(id: string): Promise<{ id: string; deleted: boolean }> {
    await this.getTermById(id)
    const deleted = await this.repo.delete(id)
    return { id, deleted }
  }
}

export const academicTermService = new AcademicTermService()
