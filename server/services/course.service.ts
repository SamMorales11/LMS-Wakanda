import type { CourseDto, CreateCourseDto, UpdateCourseDto } from '~/types'
import { courseRepository, type ICourseRepository } from '../repositories'
import { db, programs } from '../database'
import { eq } from 'drizzle-orm'
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors'

export class CourseService {
  constructor(private readonly repo: ICourseRepository = courseRepository) {}

  public async getAllCourses(filter?: { programId?: string; search?: string }): Promise<CourseDto[]> {
    return this.repo.findAll(filter)
  }

  public async getCourseById(id: string): Promise<CourseDto> {
    if (!id) {
      throw new BadRequestError('ID mata kuliah wajib disertakan')
    }
    const course = await this.repo.findById(id)
    if (!course) {
      throw new NotFoundError(`Mata kuliah dengan ID '${id}' tidak ditemukan`)
    }
    return course
  }

  public async createCourse(dto: CreateCourseDto): Promise<CourseDto> {
    // Validasi program studi
    const prog = await db.select().from(programs).where(eq(programs.id, dto.programId)).limit(1)
    if (!prog[0]) {
      throw new NotFoundError(`Program Studi dengan ID '${dto.programId}' tidak ditemukan`)
    }

    // Validasi keunikan kode di prodi yang sama
    const existing = await this.repo.findByProgramAndCode(dto.programId, dto.code)
    if (existing) {
      throw new ConflictError(`Mata kuliah dengan kode '${dto.code}' sudah terdaftar pada program studi ini`)
    }

    return this.repo.create(dto)
  }

  public async updateCourse(id: string, dto: UpdateCourseDto): Promise<CourseDto> {
    const existing = await this.getCourseById(id)

    const targetProgramId = dto.programId || existing.programId
    const targetCode = dto.code || existing.code

    if (dto.programId || dto.code) {
      const duplicate = await this.repo.findByProgramAndCode(targetProgramId, targetCode)
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Mata kuliah dengan kode '${targetCode}' sudah terdaftar pada program studi ini`)
      }
    }

    const updated = await this.repo.update(id, dto)
    if (!updated) {
      throw new NotFoundError(`Gagal memperbarui mata kuliah dengan ID '${id}'`)
    }

    return updated
  }

  public async deleteCourse(id: string): Promise<{ id: string; deleted: boolean }> {
    await this.getCourseById(id)
    const deleted = await this.repo.delete(id)
    return { id, deleted }
  }
}

export const courseService = new CourseService()
