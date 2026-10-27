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
