import { pgTable, uuid, varchar, text, boolean, integer, numeric, timestamp, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core'
import { submissionStatusEnum, quizAttemptStatusEnum } from './enums'
import { courseClasses } from './academics'
import { classSessions } from './sessions'
import { users } from './users'

// 10. Assignments (Tugas Perkuliahan)
export const assignments = pgTable(
  'assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => courseClasses.id, { onDelete: 'cascade' }).notNull(),
    sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    instructions: text('instructions'),
    maxScore: numeric('max_score', { precision: 5, scale: 2 }).default('100.00').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    cutoffDate: timestamp('cutoff_date', { withTimezone: true }),
    allowLateSubmission: boolean('allow_late_submission').default(true).notNull(),
    latePenaltyPercentage: numeric('late_penalty_percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
    allowedFileTypes: varchar('allowed_file_types', { length: 100 }).default('pdf,zip'),
    maxFileSizeMb: integer('max_file_size_mb').default(10),
    isPublished: boolean('is_published').default(true).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('assignments_class_id_idx').on(table.classId),
    index('assignments_session_id_idx').on(table.sessionId),
    index('assignments_due_date_idx').on(table.dueDate),
    index('assignments_cutoff_date_idx').on(table.cutoffDate)
  ]
)

// 11. Submissions (Pengumpulan Tugas Mahasiswa)
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'cascade' }).notNull(),
    studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    fileKey: text('file_key'),
    fileUrl: text('file_url'),
    fileName: varchar('file_name', { length: 255 }),
    fileSize: integer('file_size'),
    fileType: varchar('file_type', { length: 100 }),
    contentText: text('content_text'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    isLate: boolean('is_late').default(false).notNull(),
    score: numeric('score', { precision: 5, scale: 2 }),
    feedback: text('feedback'),
    gradedBy: uuid('graded_by').references(() => users.id, { onDelete: 'set null' }),
    gradedAt: timestamp('graded_at', { withTimezone: true }),
    status: submissionStatusEnum('status').default('SUBMITTED').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('submissions_assignment_student_idx').on(table.assignmentId, table.studentId),
    index('submissions_assignment_id_idx').on(table.assignmentId),
    index('submissions_student_id_idx').on(table.studentId),
    index('submissions_status_idx').on(table.status)
  ]
)

// 12. Quizzes (Kuis / Ujian Perkuliahan: Kuis Mingguan, UTS Sesi 8, UAS Sesi 16)
export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => courseClasses.id, { onDelete: 'cascade' }).notNull(),
    sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    quizType: varchar('quiz_type', { length: 50 }).default('QUIZ').notNull(), // 'QUIZ' | 'MIDTERM_EXAM' | 'FINAL_EXAM'
    durationMinutes: integer('duration_minutes').default(60).notNull(),
    maxScore: numeric('max_score', { precision: 5, scale: 2 }).default('100.00').notNull(),
    passingScore: numeric('passing_score', { precision: 5, scale: 2 }).default('70.00').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    shuffleQuestions: boolean('shuffle_questions').default(true).notNull(),
    maxAttempts: integer('max_attempts').default(1).notNull(),
    questionsJsonb: jsonb('questions_jsonb').default([]).notNull(),
    isPublished: boolean('is_published').default(false).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('quizzes_class_id_idx').on(table.classId),
    index('quizzes_session_id_idx').on(table.sessionId),
    index('quizzes_start_end_time_idx').on(table.startTime, table.endTime),
    index('quizzes_quiz_type_idx').on(table.quizType)
  ]
)

// 13. Quiz Attempts (Percobaan Pengerjaan Kuis Mahasiswa)
export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
    studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    attemptNumber: integer('attempt_number').default(1).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    score: numeric('score', { precision: 5, scale: 2 }),
    autoScore: numeric('auto_score', { precision: 5, scale: 2 }),
    manualScore: numeric('manual_score', { precision: 5, scale: 2 }),
    status: quizAttemptStatusEnum('status').default('IN_PROGRESS').notNull(),
    questionOrderJsonb: jsonb('question_order_jsonb'),
    answersJsonb: jsonb('answers_jsonb'),
    feedback: text('feedback'),
    gradedBy: uuid('graded_by').references(() => users.id, { onDelete: 'set null' }),
    gradedAt: timestamp('graded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('quiz_attempts_quiz_student_idx').on(table.quizId, table.studentId),
    index('quiz_attempts_quiz_id_idx').on(table.quizId),
    index('quiz_attempts_student_id_idx').on(table.studentId),
    index('quiz_attempts_status_idx').on(table.status),
    index('quiz_attempts_id_student_status_idx').on(table.id, table.studentId, table.status),
    index('quiz_attempts_status_expires_idx').on(table.status, table.expiresAt)
  ]
)
