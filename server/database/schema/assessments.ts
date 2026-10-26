import { pgTable, uuid, varchar, text, boolean, integer, numeric, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
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
    allowLateSubmission: boolean('allow_late_submission').default(false).notNull(),
    latePenaltyPercentage: numeric('late_penalty_percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
    isPublished: boolean('is_published').default(false).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('assignments_class_id_idx').on(table.classId),
    index('assignments_session_id_idx').on(table.sessionId),
    index('assignments_due_date_idx').on(table.dueDate)
  ]
)

// 11. Submissions (Pengumpulan Tugas Mahasiswa)
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'cascade' }).notNull(),
    studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    fileUrl: text('file_url'),
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

// 12. Quizzes (Kuis / Ujian Perkuliahan)
export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => courseClasses.id, { onDelete: 'cascade' }).notNull(),
    sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    durationMinutes: integer('duration_minutes').default(60).notNull(),
    maxScore: numeric('max_score', { precision: 5, scale: 2 }).default('100.00').notNull(),
    passingScore: numeric('passing_score', { precision: 5, scale: 2 }).default('70.00').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    shuffleQuestions: boolean('shuffle_questions').default(true).notNull(),
    maxAttempts: integer('max_attempts').default(1).notNull(),
    isPublished: boolean('is_published').default(false).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('quizzes_class_id_idx').on(table.classId),
    index('quizzes_session_id_idx').on(table.sessionId),
    index('quizzes_start_end_time_idx').on(table.startTime, table.endTime)
  ]
)

// 13. Quiz Attempts (Percobaan Pengerjaan Kuis)
export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
    studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    attemptNumber: integer('attempt_number').default(1).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    score: numeric('score', { precision: 5, scale: 2 }),
    status: quizAttemptStatusEnum('status').default('IN_PROGRESS').notNull(),
    feedback: text('feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('quiz_attempts_quiz_student_idx').on(table.quizId, table.studentId),
    index('quiz_attempts_quiz_id_idx').on(table.quizId),
    index('quiz_attempts_student_id_idx').on(table.studentId),
    index('quiz_attempts_status_idx').on(table.status)
  ]
)
