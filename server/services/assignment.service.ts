import path from 'node:path'
import type {
  AssignmentDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmissionDto,
  CreateSubmissionDto,
  GradeSubmissionDto,
  AssignmentSubmissionOverviewDto,
  PresignedUploadResponseDto
} from '~/types'
import {
  assignmentRepository,
  type IAssignmentRepository,
  classRepository
} from '../repositories'
import { storageService, type IStorageService } from './storage.service'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError
} from '../utils/errors'

export class AssignmentService {
  constructor(
    private readonly repo: IAssignmentRepository = assignmentRepository,
    private readonly storage: IStorageService = storageService
  ) {}

  /**
   * Helper: Validasi ekstensi dan MIME type file (PDF / ZIP)
   */
  private validateFileType(fileName: string, mimeType: string, allowedTypesStr: string = 'pdf,zip') {
    const ext = path.extname(fileName).toLowerCase().replace('.', '')
    const allowed = allowedTypesStr.toLowerCase().split(',').map(s => s.trim())

    const validMimes: Record<string, string[]> = {
      pdf: ['application/pdf'],
      zip: ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip', 'application/x-compressed']
    }

    if (!allowed.includes(ext)) {
      throw new BadRequestError(
        `Format berkas '${ext}' tidak didukung. Tipe berkas yang diizinkan: ${allowed.join(', ').toUpperCase()}`
      )
    }

    // Periksa kesesuaian MIME type jika dikirimkan
    if (mimeType && validMimes[ext]) {
      const matched = validMimes[ext].some(m => mimeType.toLowerCase().includes(m))
      if (!matched && mimeType !== 'application/octet-stream') {
        throw new BadRequestError(
          `MIME type '${mimeType}' tidak sesuai untuk berkas .${ext}. Diperlukan format PDF atau ZIP valid.`
        )
      }
    }
  }

  /**
   * Dosen/Admin membuat tugas baru untuk sebuah pertemuan perkuliahan
   */
  public async createAssignment(
    dto: CreateAssignmentDto,
    lecturerId?: string
  ): Promise<AssignmentDto> {
    // 1. Validasi tanggal batas waktu normal (due_date) dan penutupan (cutoff_date)
    const dueDate = new Date(dto.dueDate)
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestError('Format due_date tidak valid')
    }

    if (dto.cutoffDate) {
      const cutoffDate = new Date(dto.cutoffDate)
      if (isNaN(cutoffDate.getTime())) {
        throw new BadRequestError('Format cutoff_date tidak valid')
      }
      if (cutoffDate.getTime() < dueDate.getTime()) {
        throw new BadRequestError('Batas penutupan akses (cutoff_date) tidak boleh lebih awal dari batas normal (due_date)')
      }
    }

    return this.repo.create(dto, lecturerId)
  }

  /**
   * Dosen/Admin memperbarui tugas
   */
  public async updateAssignment(
    id: string,
    dto: UpdateAssignmentDto
  ): Promise<AssignmentDto> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new NotFoundError(`Tugas dengan ID '${id}' tidak ditemukan`)
    }

    // Validasi perbandingan tanggal jika diubah
    const newDueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(existing.dueDate)
    const newCutoffDate = dto.cutoffDate !== undefined
      ? (dto.cutoffDate ? new Date(dto.cutoffDate) : null)
      : (existing.cutoffDate ? new Date(existing.cutoffDate) : null)

    if (newCutoffDate && newCutoffDate.getTime() < newDueDate.getTime()) {
      throw new BadRequestError('Batas penutupan akses (cutoff_date) tidak boleh lebih awal dari batas normal (due_date)')
    }

    const updated = await this.repo.update(id, dto)
    if (!updated) {
      throw new NotFoundError(`Gagal memperbarui tugas dengan ID '${id}'`)
    }

    return updated
  }

  /**
   * Dosen/Admin menghapus tugas
   */
  public async deleteAssignment(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new NotFoundError(`Tugas dengan ID '${id}' tidak ditemukan`)
    }

    return this.repo.delete(id)
  }

  /**
   * Mengambil detail tugas berdasarkan ID
   */
  public async getAssignmentById(id: string, studentId?: string): Promise<AssignmentDto> {
    const assignment = await this.repo.findById(id, studentId)
    if (!assignment) {
      throw new NotFoundError(`Tugas dengan ID '${id}' tidak ditemukan`)
    }

    return assignment
  }

  /**
   * Mengambil daftar tugas per pertemuan sesi (Pertemuan 1 - 16)
   */
  public async getAssignmentsBySession(
    sessionId: string,
    studentId?: string
  ): Promise<AssignmentDto[]> {
    return this.repo.findBySessionId(sessionId, studentId)
  }

  /**
   * Mengambil seluruh tugas dalam sebuah kelas paralel
   */
  public async getAssignmentsByClass(
    classId: string,
    studentId?: string
  ): Promise<AssignmentDto[]> {
    return this.repo.findByClassId(classId, studentId)
  }

  /**
   * Request Presigned URL untuk pengunggahan berkas tugas (PDF/ZIP)
   * Dilengkapi validasi ketat batas penutupan tugas (Cutoff Date) & ukuran berkas
   */
  public async requestPresignedUpload(
    assignmentId: string,
    studentId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    origin = ''
  ): Promise<PresignedUploadResponseDto> {
    const serverNow = new Date()

    // 1. Validasi Keberadaan Tugas
    const assignment = await this.repo.findById(assignmentId)
    if (!assignment) {
      throw new NotFoundError(`Tugas dengan ID '${assignmentId}' tidak ditemukan`)
    }

    // 2. STRICT SERVER-SIDE TIMESTAMP VALIDATION: Cutoff Date Check
    if (assignment.cutoffDate) {
      const cutoffTime = new Date(assignment.cutoffDate).getTime()
      if (serverNow.getTime() > cutoffTime) {
        throw new ForbiddenError(
          `Pengunggahan berkas ditolak! Akses pengumpulan tugas telah ditutup secara permanen pada batas cutoff (${new Date(assignment.cutoffDate).toLocaleString('id-ID')} WIB).`
        )
      }
    }

    // 3. Validasi Mahasiswa Terdaftar di Kelas Ini
    const isEnrolled = await this.repo.isStudentEnrolledInClass(assignment.classId, studentId)
    if (!isEnrolled) {
      throw new ForbiddenError('Anda tidak terdaftar sebagai mahasiswa aktif pada kelas perkuliahan ini')
    }

    // 4. Validasi Format Berkas (PDF / ZIP)
    this.validateFileType(fileName, fileType, assignment.allowedFileTypes)

    // 5. Validasi Ukuran Berkas Maksimal
    const maxSizeBytes = (assignment.maxFileSizeMb || 10) * 1024 * 1024
    if (fileSize > maxSizeBytes) {
      throw new BadRequestError(
        `Ukuran berkas (${(fileSize / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal yang diizinkan (${assignment.maxFileSizeMb} MB)`
      )
    }

    // 6. Generate Presigned URL via Storage Service
    return this.storage.createPresignedUpload(
      {
        fileName,
        fileType,
        fileSize,
        category: 'assignments',
        isPublic: false
      },
      origin
    )
  }

  /**
   * Mahasiswa mengumpulkan tugas (Submission)
   * Validasi Strict Server-Side Timestamp:
   * - Menolak jika now > cutoff_date
   * - Menandai status Tepat Waktu (#16A34A) jika now <= due_date
   * - Menandai status Terlambat (#DC2626) jika due_date < now <= cutoff_date
   */
  public async submitAssignment(
    studentId: string,
    dto: CreateSubmissionDto,
    origin = ''
  ): Promise<{ submission: SubmissionDto; message: string }> {
    const serverNow = new Date()
    const nowTime = serverNow.getTime()

    // 1. Ambil Data Tugas
    const assignment = await this.repo.findById(dto.assignmentId)
    if (!assignment) {
      throw new NotFoundError(`Tugas dengan ID '${dto.assignmentId}' tidak ditemukan`)
    }

    if (!assignment.isPublished) {
      throw new ForbiddenError('Tugas ini belum dipublikasikan oleh Dosen')
    }

    // 2. Validasi Keanggotaan Kelas
    const isEnrolled = await this.repo.isStudentEnrolledInClass(assignment.classId, studentId)
    if (!isEnrolled) {
      throw new ForbiddenError('Anda tidak terdaftar sebagai peserta kelas ini')
    }

    // 3. STRICT SERVER-SIDE TIMESTAMP VALIDATION: CUTOFF DATE ENFORCEMENT
    if (assignment.cutoffDate) {
      const cutoffTime = new Date(assignment.cutoffDate).getTime()
      if (nowTime > cutoffTime) {
        throw new ForbiddenError(
          `Pengumpulan tugas ditolak! Batas akhir penutupan pengumpulan (cutoff date) pada ${new Date(assignment.cutoffDate).toLocaleString('id-ID')} WIB telah berakhir.`
        )
      }
    }

    // 4. PENENTUAN STATUS KETEPATAN WAKTU (TEPAT WAKTU vs TERLAMBAT)
    const dueTime = new Date(assignment.dueDate).getTime()
    let isLate = false

    if (nowTime > dueTime) {
      if (!assignment.allowLateSubmission) {
        throw new ForbiddenError(
          `Batas waktu normal (due date) pada ${new Date(assignment.dueDate).toLocaleString('id-ID')} WIB telah terlewat dan tugas ini tidak menerima pengumpulan susulan/terlambat.`
        )
      }
      isLate = true
    }

    // 5. Validasi Tipe Berkas jika menyertakan nama file
    if (dto.fileName) {
      this.validateFileType(dto.fileName, dto.fileType || '', assignment.allowedFileTypes)
    }

    // 6. Dapatkan Signed Read URL jika berkas disimpan di storage privat
    let fileUrl = dto.fileUrl
    if (dto.fileKey && !fileUrl) {
      try {
        const readResult = await this.storage.createSignedReadUrl(
          {
            fileKey: dto.fileKey,
            expiresInSeconds: 86400 * 7 // 7 hari untuk pratinjau tugas
          },
          origin
        )
        fileUrl = readResult.signedUrl
      } catch (err) {
        console.warn('[AssignmentService] Gagal menghasilkan signed read URL otomatis:', err)
      }
    }

    // 7. Simpan Pengumpulan Tugas (Idempotent Upsert)
    const submission = await this.repo.createOrUpdateSubmission(
      {
        ...dto,
        fileUrl: fileUrl || dto.fileUrl
      },
      studentId,
      isLate
    )

    const statusLabel = isLate ? 'Terlambat' : 'Tepat Waktu'
    const message = isLate
      ? `Tugas berhasil dikumpulkan dengan status TERLAMBAT (Tercatat pada ${serverNow.toLocaleTimeString('id-ID')} WIB)`
      : `Tugas berhasil dikumpulkan TEPAT WAKTU! (Tercatat pada ${serverNow.toLocaleTimeString('id-ID')} WIB)`

    return {
      submission,
      message
    }
  }

  /**
   * Mengambil pengumpulan tugas milik mahasiswa saat ini
   */
  public async getMySubmission(
    assignmentId: string,
    studentId: string
  ): Promise<SubmissionDto | null> {
    return this.repo.findSubmission(assignmentId, studentId)
  }

  /**
   * Dosen melihat seluruh pengumpulan tugas mahasiswa
   */
  public async getAssignmentSubmissions(
    assignmentId: string
  ): Promise<SubmissionDto[]> {
    const assignment = await this.repo.findById(assignmentId)
    if (!assignment) {
      throw new NotFoundError(`Tugas dengan ID '${assignmentId}' tidak ditemukan`)
    }

    return this.repo.findSubmissionsByAssignmentId(assignmentId)
  }

  /**
   * Dosen/Admin menilai pengumpulan tugas (Grading)
   */
  public async gradeSubmission(
    submissionId: string,
    dto: GradeSubmissionDto,
    lecturerId?: string
  ): Promise<SubmissionDto> {
    const submission = await this.repo.findSubmissionById(submissionId)
    if (!submission) {
      throw new NotFoundError(`Data pengumpulan tugas dengan ID '${submissionId}' tidak ditemukan`)
    }

    const assignment = await this.repo.findById(submission.assignmentId)
    if (!assignment) {
      throw new NotFoundError('Tugas terkait tidak ditemukan')
    }

    const maxScoreNum = parseFloat(assignment.maxScore) || 100
    if (dto.score < 0 || dto.score > maxScoreNum) {
      throw new BadRequestError(`Nilai tugas harus berada di rentang 0 hingga ${maxScoreNum}`)
    }

    const updated = await this.repo.gradeSubmission(submissionId, dto.score, dto.feedback, lecturerId)
    if (!updated) {
      throw new NotFoundError('Gagal memperbarui nilai tugas')
    }

    return updated
  }

  /**
   * Ikhtisar pengumpulan tugas untuk antarmuka Dosen
   */
  public async getAssignmentOverview(
    assignmentId: string
  ): Promise<AssignmentSubmissionOverviewDto> {
    const assignment = await this.repo.findById(assignmentId)
    if (!assignment) {
      throw new NotFoundError(`Tugas dengan ID '${assignmentId}' tidak ditemukan`)
    }

    const [totalEnrolled, submissionsList] = await Promise.all([
      this.repo.countEnrolledStudents(assignment.classId),
      this.repo.findSubmissionsByAssignmentId(assignmentId)
    ])

    let onTimeCount = 0
    let lateCount = 0
    let gradedCount = 0

    submissionsList.forEach(s => {
      if (s.isLate) lateCount++
      else onTimeCount++

      if (s.status === 'GRADED') gradedCount++
    })

    return {
      assignment,
      totalEnrolled,
      submittedCount: submissionsList.length,
      onTimeCount,
      lateCount,
      gradedCount,
      submissions: submissionsList
    }
  }
}

export const assignmentService = new AssignmentService()
