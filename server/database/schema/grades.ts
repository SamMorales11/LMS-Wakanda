import { pgTable, uuid, varchar, text, numeric, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { gradeStatusEnum } from './enums'
import { courseClasses } from './academics'
import { users } from './users'

// 14. Grade Weights (Bobot Penilaian Komponen Kelas)
export const gradeWeights = pgTable(
  'grade_weights',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => courseClasses.id, { onDelete: 'cascade' }).notNull(),
    componentName: varchar('component_name', { length: 100 }).notNull(), // e.g. 'ATTENDANCE', 'ASSIGNMENT', 'QUIZ', 'MIDTERM_EXAM', 'FINAL_EXAM'
    weightPercentage: numeric('weight_percentage', { precision: 5, scale: 2 }).notNull(), // e.g. 10.00, 20.00, 30.00 (Total = 100.00)
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('grade_weights_class_component_idx').on(table.classId, table.componentName),
    index('grade_weights_class_id_idx').on(table.classId)
  ]
)

// 15. Final Grades (Nilai Akhir Mahasiswa)
export const finalGrades = pgTable(
  'final_grades',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => courseClasses.id, { onDelete: 'cascade' }).notNull(),
    studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    attendanceScore: numeric('attendance_score', { precision: 5, scale: 2 }).default('0.00'),
    assignmentScore: numeric('assignment_score', { precision: 5, scale: 2 }).default('0.00'),
    quizScore: numeric('quiz_score', { precision: 5, scale: 2 }).default('0.00'),
    midtermScore: numeric('midterm_score', { precision: 5, scale: 2 }).default('0.00'),
    finalExamScore: numeric('final_exam_score', { precision: 5, scale: 2 }).default('0.00'),
    totalScore: numeric('total_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    letterGrade: varchar('letter_grade', { length: 5 }).default('E').notNull(), // A, A-, B+, B, B-, C+, C, D, E
    gradePoint: numeric('grade_point', { precision: 3, scale: 2 }).default('0.00').notNull(), // 4.00, 3.70, etc.
    status: gradeStatusEnum('status').default('DRAFT').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('final_grades_class_student_idx').on(table.classId, table.studentId),
    index('final_grades_class_id_idx').on(table.classId),
    index('final_grades_student_id_idx').on(table.studentId),
    index('final_grades_status_idx').on(table.status)
  ]
)

// 16. Grade Audit Logs (Audit Trail Perubahan Nilai)
export const gradeAuditLogs = pgTable(
  'grade_audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    finalGradeId: uuid('final_grade_id').references(() => finalGrades.id, { onDelete: 'cascade' }).notNull(),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }).notNull(),
    previousScore: numeric('previous_score', { precision: 5, scale: 2 }),
    newScore: numeric('new_score', { precision: 5, scale: 2 }).notNull(),
    previousLetter: varchar('previous_letter', { length: 5 }),
    newLetter: varchar('new_letter', { length: 5 }).notNull(),
    reason: text('reason').notNull(),
    ipAddress: varchar('ip_address', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('grade_audit_logs_final_grade_id_idx').on(table.finalGradeId),
    index('grade_audit_logs_changed_by_idx').on(table.changedBy),
    index('grade_audit_logs_created_at_idx').on(table.createdAt)
  ]
)
