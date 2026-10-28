import { z } from 'zod'

export const userRoleSchema = z.enum(['admin', 'lecturer', 'student'])

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().trim().email('Format email tidak valid'),
  role: userRoleSchema,
  nimNidn: z.string().trim().max(50).optional()
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  role: userRoleSchema.optional(),
  nimNidn: z.string().trim().max(50).optional(),
  isActive: z.boolean().optional()
})

export const userQuerySchema = z.object({
  role: userRoleSchema.optional(),
  search: z.string().trim().optional()
})

export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi')
})

// --- Academic Terms Schemas ---
export const termSemesterSchema = z.enum(['ODD', 'EVEN', 'SHORT'])

export const createAcademicTermSchema = z.object({
  code: z.string().trim().min(1, 'Kode semester wajib diisi').max(50),
  name: z.string().trim().min(3, 'Nama semester minimal 3 karakter').max(150),
  year: z.string().trim().min(4, 'Tahun akademik wajib diisi').max(20),
  semester: termSemesterSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  isActive: z.boolean().optional().default(false)
})

export const updateAcademicTermSchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(3).max(150).optional(),
  year: z.string().trim().min(4).max(20).optional(),
  semester: termSemesterSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isActive: z.boolean().optional()
})

// --- Courses Schemas ---
export const createCourseSchema = z.object({
  programId: z.string().uuid('Program ID harus berupa UUID valid'),
  code: z.string().trim().min(2, 'Kode mata kuliah minimal 2 karakter').max(50),
  name: z.string().trim().min(2, 'Nama mata kuliah minimal 2 karakter').max(255),
  credits: z.coerce.number().int().min(1, 'SKS minimal 1').max(6, 'SKS maksimal 6'),
  semester: z.coerce.number().int().min(1, 'Semester kurikulum minimal 1').max(8, 'Semester kurikulum maksimal 8'),
  description: z.string().trim().optional(),
  syllabusUrl: z.string().trim().optional()
})

export const updateCourseSchema = z.object({
  programId: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(50).optional(),
  name: z.string().trim().min(2).max(255).optional(),
  credits: z.coerce.number().int().min(1).max(6).optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  description: z.string().trim().optional(),
  syllabusUrl: z.string().trim().optional(),
  isActive: z.boolean().optional()
})

// --- Course Classes Schemas ---
export const createCourseClassSchema = z.object({
  courseId: z.string().uuid('Course ID harus berupa UUID valid'),
  academicTermId: z.string().uuid('Academic Term ID harus berupa UUID valid'),
  code: z.string().trim().min(1, 'Kode/Nama rombongan belajar wajib diisi (mis. A, B, TI-3A)').max(50),
  capacity: z.coerce.number().int().min(1, 'Kapasitas minimal 1 mahasiswa').max(200).optional().default(40),
  room: z.string().trim().max(100).optional(),
  scheduleDay: z.string().trim().max(20).optional(),
  scheduleStart: z.string().trim().optional(), // e.g. "08:00"
  scheduleEnd: z.string().trim().optional(), // e.g. "10:30"
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
  lecturerId: z.string().uuid('Lecturer ID harus berupa UUID valid').optional()
})

export const updateCourseClassSchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  capacity: z.coerce.number().int().min(1).max(200).optional(),
  room: z.string().trim().max(100).optional(),
  scheduleDay: z.string().trim().max(20).optional(),
  scheduleStart: z.string().trim().optional(),
  scheduleEnd: z.string().trim().optional(),
  isActive: z.boolean().optional()
})

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserQueryInput = z.infer<typeof userQuerySchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateAcademicTermInput = z.infer<typeof createAcademicTermSchema>
export type UpdateAcademicTermInput = z.infer<typeof updateAcademicTermSchema>
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>
export type CreateCourseClassInput = z.infer<typeof createCourseClassSchema>
export type UpdateCourseClassInput = z.infer<typeof updateCourseClassSchema>

// ============================================================================
// 6. Object Storage Validation Schemas (Cloudflare R2 & Local Fallback)
// ============================================================================

export const ALLOWED_STORAGE_MIME_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'multipart/x-zip'
] as const

export const MAX_STORAGE_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

export const storageCategorySchema = z.enum([
  'assignments',
  'submissions',
  'materials',
  'syllabi',
  'general'
])

export const presignedUploadSchema = z.object({
  fileName: z
    .string({ required_error: 'Nama berkas (fileName) wajib disertakan' })
    .min(1, 'Nama berkas tidak boleh kosong')
    .max(255, 'Nama berkas maksimal 255 karakter')
    .refine(
      (name) => !name.includes('..') && !name.includes('/') && !name.includes('\\'),
      'Nama berkas tidak boleh mengandung karakter path traversal'
    )
    .refine(
      (name) => /\.(pdf|zip)$/i.test(name),
      'Ekstensi berkas hanya diperbolehkan format .pdf atau .zip'
    ),
  fileType: z
    .string({ required_error: 'Tipe MIME berkas (fileType) wajib disertakan' })
    .refine(
      (type) => (ALLOWED_STORAGE_MIME_TYPES as readonly string[]).includes(type),
      'Tipe berkas tidak didukung. Hanya berkas PDF (application/pdf) dan ZIP (application/zip) yang diizinkan'
    ),
  fileSize: z
    .number({ required_error: 'Ukuran berkas (fileSize) wajib disertakan' })
    .positive('Ukuran berkas harus lebih besar dari 0 byte')
    .max(
      MAX_STORAGE_FILE_SIZE,
      `Ukuran berkas melebihi batas maksimum (${MAX_STORAGE_FILE_SIZE / (1024 * 1024)} MB)`
    ),
  category: storageCategorySchema.default('general'),
  isPublic: z.boolean().default(false)
})

export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>

export const signedReadUrlSchema = z.object({
  fileKey: z
    .string({ required_error: 'Kunci berkas (fileKey) wajib disertakan' })
    .min(1, 'Kunci berkas tidak boleh kosong')
    .max(500, 'Kunci berkas terlalu panjang')
    .refine(
      (key) => !key.includes('..'),
      'Kunci berkas tidak boleh mengandung path traversal (..)'
    ),
  expiresInSeconds: z
    .number()
    .int()
    .min(60, 'Masa berlaku minimal 60 detik (1 menit)')
    .max(86400, 'Masa berlaku maksimal 86400 detik (24 jam)')
    .default(900) // 15 menit
})

export type SignedReadUrlInput = z.infer<typeof signedReadUrlSchema>

// ============================================================================
// 7. Course Session Materials Schemas (Distribusi Materi & Status Bacaan)
// ============================================================================

export const sessionMaterialTypeSchema = z.enum(['SLIDE', 'CODE', 'VIDEO', 'DOCUMENT'], {
  errorMap: () => ({ message: 'Tipe materi harus salah satu dari: SLIDE, CODE, VIDEO, DOCUMENT' })
})

export const createSessionMaterialSchema = z.object({
  title: z
    .string({ required_error: 'Judul materi wajib diisi' })
    .min(2, 'Judul materi minimal 2 karakter')
    .max(255, 'Judul materi maksimal 255 karakter'),
  materialType: sessionMaterialTypeSchema.default('SLIDE'),
  description: z.string().max(2000, 'Deskripsi maksimal 2000 karakter').optional(),
  fileKey: z.string().max(500).optional(),
  fileUrl: z.string().url('Format URL berkas tidak valid').optional().or(z.literal('')),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
  externalUrl: z.string().url('Format URL eksternal tidak valid').optional().or(z.literal('')),
  orderIndex: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true)
})

export type CreateSessionMaterialInput = z.infer<typeof createSessionMaterialSchema>

export const updateSessionMaterialSchema = createSessionMaterialSchema.partial()

export type UpdateSessionMaterialInput = z.infer<typeof updateSessionMaterialSchema>

export const toggleMaterialReadSchema = z.object({
  isCompleted: z.boolean().default(true)
})

export type ToggleMaterialReadInput = z.infer<typeof toggleMaterialReadSchema>

// ============================================================================
// 8. Attendance Engine Schemas (Presensi Token PIN 6-Digit & Dynamic QR Code)
// ============================================================================

export const attendanceStatusSchema = z.enum(
  ['PRESENT', 'LATE', 'PERMIT', 'SICK', 'ABSENT'],
  {
    errorMap: () => ({
      message: 'Status presensi harus salah satu dari: PRESENT, LATE, PERMIT, SICK, ABSENT'
    })
  }
)

export const openAttendanceSchema = z.object({
  sessionId: z.string({ required_error: 'ID Sesi wajib disertakan' }).uuid('Format ID sesi harus UUID valid'),
  durationMinutes: z.number().int().min(1, 'Durasi minimal 1 menit').max(180, 'Durasi maksimal 180 menit').default(15)
})

export type OpenAttendanceInput = z.infer<typeof openAttendanceSchema>

export const checkInSchema = z.object({
  token: z
    .string({ required_error: 'Token PIN 6-digit atau payload QR presensi wajib diisi' })
    .min(6, 'Token presensi minimal 6 karakter')
    .max(500, 'Token presensi melebihi panjang maksimal'),
  sessionId: z.string().uuid('Format ID sesi harus UUID valid').optional(),
  deviceInfo: z.string().max(255).optional()
})

export type CheckInInput = z.infer<typeof checkInSchema>

export const manualAttendanceSchema = z.object({
  sessionId: z.string({ required_error: 'ID Sesi wajib disertakan' }).uuid('Format ID sesi harus UUID valid'),
  studentId: z.string({ required_error: 'ID Mahasiswa wajib disertakan' }).uuid('Format ID mahasiswa harus UUID valid'),
  status: attendanceStatusSchema,
  notes: z.string().max(500).optional()
})

export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>

// ============================================================================
// 9. Assignment & Submission Schemas (Tugas & Pengumpulan Berkas PDF/ZIP)
// ============================================================================

export const createAssignmentSchema = z
  .object({
    classId: z.string({ required_error: 'ID Kelas wajib disertakan' }).uuid('Format ID kelas harus UUID valid'),
    sessionId: z.string().uuid('Format ID sesi harus UUID valid').optional().nullable(),
    title: z
      .string({ required_error: 'Judul tugas wajib diisi' })
      .min(3, 'Judul tugas minimal 3 karakter')
      .max(255, 'Judul tugas maksimal 255 karakter'),
    description: z.string().max(5000, 'Deskripsi maksimal 5000 karakter').optional().nullable(),
    instructions: z.string().max(5000, 'Petunjuk pengerjaan maksimal 5000 karakter').optional().nullable(),
    maxScore: z.number().min(1, 'Nilai maksimal minimal 1').max(1000, 'Nilai maksimal 1000').default(100),
    dueDate: z
      .string({ required_error: 'Batas waktu normal (due_date) wajib diisi' })
      .refine(val => !isNaN(Date.parse(val)), { message: 'Format due_date harus tanggal/waktu ISO valid' }),
    cutoffDate: z
      .string()
      .refine(val => !val || !isNaN(Date.parse(val)), { message: 'Format cutoff_date harus tanggal/waktu ISO valid' })
      .optional()
      .nullable(),
    allowLateSubmission: z.boolean().default(true),
    latePenaltyPercentage: z.number().min(0).max(100).default(0),
    allowedFileTypes: z.string().default('pdf,zip'),
    maxFileSizeMb: z.number().int().min(1).max(100).default(10),
    isPublished: z.boolean().default(true)
  })
  .refine(
    data => {
      if (!data.cutoffDate) return true
      return new Date(data.cutoffDate).getTime() >= new Date(data.dueDate).getTime()
    },
    {
      message: 'Batas akhir penutupan (cutoff_date) tidak boleh lebih awal dari batas waktu normal (due_date)',
      path: ['cutoffDate']
    }
  )

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>

export const updateAssignmentSchema = z
  .object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().max(5000).optional().nullable(),
    instructions: z.string().max(5000).optional().nullable(),
    maxScore: z.number().min(1).max(1000).optional(),
    dueDate: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), { message: 'Format due_date harus tanggal/waktu ISO valid' })
      .optional(),
    cutoffDate: z
      .string()
      .refine(val => !val || !isNaN(Date.parse(val)), { message: 'Format cutoff_date harus tanggal/waktu ISO valid' })
      .optional()
      .nullable(),
    allowLateSubmission: z.boolean().optional(),
    latePenaltyPercentage: z.number().min(0).max(100).optional(),
    allowedFileTypes: z.string().optional(),
    maxFileSizeMb: z.number().int().min(1).max(100).optional(),
    isPublished: z.boolean().optional()
  })
  .refine(
    data => {
      if (!data.dueDate || !data.cutoffDate) return true
      return new Date(data.cutoffDate).getTime() >= new Date(data.dueDate).getTime()
    },
    {
      message: 'Batas akhir penutupan (cutoff_date) tidak boleh lebih awal dari batas waktu normal (due_date)',
      path: ['cutoffDate']
    }
  )

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>

export const createSubmissionSchema = z
  .object({
    assignmentId: z
      .string({ required_error: 'ID Tugas wajib disertakan' })
      .uuid('Format ID tugas harus UUID valid'),
    fileKey: z.string().max(500).optional().nullable(),
    fileUrl: z.string().optional().nullable(),
    fileName: z.string().max(255).optional().nullable(),
    fileSize: z.number().int().positive().optional().nullable(),
    fileType: z.string().max(100).optional().nullable(),
    contentText: z.string().max(10000).optional().nullable()
  })
  .refine(
    data => !!(data.fileKey || data.fileUrl || data.contentText),
    {
      message: 'Pengumpulan tugas wajib menyertakan berkas unggahan atau teks jawaban',
      path: ['fileKey']
    }
  )

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>

export const gradeSubmissionSchema = z.object({
  score: z.number({ required_error: 'Nilai tugas wajib diisi' }).min(0, 'Nilai tidak boleh negatif').max(1000, 'Nilai melebihi batas'),
  feedback: z.string().max(2000, 'Catatan umpan balik maksimal 2000 karakter').optional().nullable()
})

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>




