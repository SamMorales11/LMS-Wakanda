import type {
  CourseClassDto,
  CourseClassDetailDto,
  CreateCourseClassDto,
  UpdateCourseClassDto,
  ClassSessionDto,
  GradeWeightDto
} from '~/types'
import {
  classRepository,
  type IClassRepository,
  courseRepository,
  academicTermRepository,
  userRepository
} from '../repositories'
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors'

export class ClassService {
  constructor(private readonly repo: IClassRepository = classRepository) {}

  public async getAllClasses(filter?: {
    academicTermId?: string
    courseId?: string
    search?: string
  }): Promise<CourseClassDto[]> {
    return this.repo.findAll(filter)
  }

  public async getClassById(id: string): Promise<CourseClassDto> {
    if (!id) {
      throw new BadRequestError('ID kelas wajib disertakan')
    }
    const cls = await this.repo.findById(id)
    if (!cls) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${id}' tidak ditemukan`)
    }
    return cls
  }

  public async getClassDetail(id: string): Promise<CourseClassDetailDto> {
    if (!id) {
      throw new BadRequestError('ID kelas wajib disertakan')
    }
    const detail = await this.repo.findDetailById(id)
    if (!detail) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${id}' tidak ditemukan`)
    }
    return detail
  }

  /**
   * Membuat Kelas Paralel (Rombongan Belajar) baru:
   * Melakukan validasi relasi, lalu mengeksekusi DATABASE TRANSACTION ATOMIK
   * untuk men-generate 16 sesi pertemuan dan inisialisasi bobot nilai 100%.
   */
  public async createClass(dto: CreateCourseClassDto): Promise<CourseClassDetailDto> {
    // 1. Pastikan Mata Kuliah terdaftar
    const course = await courseRepository.findById(dto.courseId)
    if (!course) {
      throw new NotFoundError(`Mata Kuliah dengan ID '${dto.courseId}' tidak ditemukan`)
    }

    // 2. Pastikan Semester / Tahun Akademik terdaftar
    const term = await academicTermRepository.findById(dto.academicTermId)
    if (!term) {
      throw new NotFoundError(`Tahun Akademik dengan ID '${dto.academicTermId}' tidak ditemukan`)
    }

    // 3. Validasi keunikan kelas paralel untuk mata kuliah dan semester yang sama
    const existing = await this.repo.findByTermAndCourse(dto.academicTermId, dto.courseId, dto.code)
    if (existing) {
      throw new ConflictError(
        `Rombongan Belajar Kelas '${dto.code}' sudah terdaftar untuk mata kuliah ${course.name} pada semester ${term.name}`
      )
    }

    // 4. Validasi Dosen Pengampu jika disertakan
    if (dto.lecturerId) {
      const lecturer = await userRepository.findById(dto.lecturerId)
      if (!lecturer) {
        throw new NotFoundError(`Dosen dengan ID '${dto.lecturerId}' tidak ditemukan`)
      }
      if (lecturer.role !== 'lecturer' && lecturer.role !== 'admin') {
        throw new BadRequestError(`Pengguna '${lecturer.name}' bukan merupakan Dosen atau Admin`)
      }
    }

    // 5. Tentukan tanggal acuan mulai sesi 1 (default ke tanggal mulai semester)
    const baseDate = dto.startDate || term.startDate

    // 6. Jalankan Database Transaction Atomik
    return this.repo.createWithSessionsAndWeights(dto, baseDate)
  }

  public async updateClass(id: string, dto: UpdateCourseClassDto): Promise<CourseClassDto> {
    const existing = await this.getClassById(id)

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const duplicate = await this.repo.findByTermAndCourse(existing.academicTermId, existing.courseId, dto.code)
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Kode kelas '${dto.code}' sudah digunakan untuk mata kuliah ini pada semester yang sama`)
      }
    }

    const updated = await this.repo.update(id, dto)
    if (!updated) {
      throw new NotFoundError(`Gagal memperbarui kelas dengan ID '${id}'`)
    }

    return updated
  }

  public async deleteClass(id: string): Promise<{ id: string; deleted: boolean }> {
    await this.getClassById(id)
    const deleted = await this.repo.delete(id)
    return { id, deleted }
  }

  public async getClassSessions(classId: string): Promise<ClassSessionDto[]> {
    await this.getClassById(classId)
    return this.repo.getSessions(classId)
  }

  public async getClassGradeWeights(classId: string): Promise<GradeWeightDto[]> {
    await this.getClassById(classId)
    return this.repo.getGradeWeights(classId)
  }
}

export const classService = new ClassService()
