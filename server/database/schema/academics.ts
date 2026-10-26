import { pgTable, uuid, varchar, text, boolean, integer, timestamp, date, time, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { termSemesterEnum } from './enums'
import { users } from './users'

// 1. Programs (Program Studi)
export const programs = pgTable(
  'programs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 30 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    degree: varchar('degree', { length: 50 }).notNull().default('S1'), // e.g. S1, D3, S2
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('programs_code_idx').on(table.code),
    index('programs_is_active_idx').on(table.isActive)
  ]
)

// 2. Academic Terms (Semester & Tahun Akademik)
export const academicTerms = pgTable(
  'academic_terms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 50 }).notNull(), // e.g. 2025/2026-GANJIL
    name: varchar('name', { length: 150 }).notNull(), // e.g. Semester Ganjil 2025/2026
    year: varchar('year', { length: 20 }).notNull(), // e.g. 2025/2026
    semester: termSemesterEnum('semester').default('ODD').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    isActive: boolean('is_active').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('academic_terms_code_idx').on(table.code),
    index('academic_terms_is_active_idx').on(table.isActive)
  ]
)

// 3. Courses (Mata Kuliah)
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id').references(() => programs.id, { onDelete: 'cascade' }).notNull(),
    code: varchar('code', { length: 50 }).notNull(), // e.g. CS101, IF202
    name: varchar('name', { length: 255 }).notNull(),
    credits: integer('credits').default(3).notNull(), // SKS
    semester: integer('semester').default(1).notNull(), // Semester kurikulum (1-8)
    description: text('description'),
    syllabusUrl: text('syllabus_url'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('courses_program_code_idx').on(table.programId, table.code),
    index('courses_program_id_idx').on(table.programId),
    index('courses_code_idx').on(table.code)
  ]
)

// 4. Course Classes (Kelas Perkuliahan)
export const courseClasses = pgTable(
  'course_classes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
    academicTermId: uuid('academic_term_id').references(() => academicTerms.id, { onDelete: 'cascade' }).notNull(),
    code: varchar('code', { length: 50 }).notNull(), // e.g. 'A', 'TI-3A'
    capacity: integer('capacity').default(40).notNull(),
    room: varchar('room', { length: 100 }),
    scheduleDay: varchar('schedule_day', { length: 20 }), // e.g. 'MONDAY', 'SENIN'
    scheduleStart: time('schedule_start'),
    scheduleEnd: time('schedule_end'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('course_classes_term_course_code_idx').on(table.academicTermId, table.courseId, table.code),
    index('course_classes_course_id_idx').on(table.courseId),
    index('course_classes_term_id_idx').on(table.academicTermId)
  ]
)

// 5. Class Lecturers (Dosen Pengampu Kelas)
export const classLecturers = pgTable(
  'class_lecturers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => courseClasses.id, { onDelete: 'cascade' }).notNull(),
    lecturerId: uuid('lecturer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(), // Dosen koordinator / pengampu utama
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('class_lecturers_class_lecturer_idx').on(table.classId, table.lecturerId),
    index('class_lecturers_class_id_idx').on(table.classId),
    index('class_lecturers_lecturer_id_idx').on(table.lecturerId)
  ]
)
