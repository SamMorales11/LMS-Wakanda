import { pgTable, uuid, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { enrollmentStatusEnum } from './enums'
import { courseClasses } from './academics'
import { users } from './users'

// 7. Class Enrollments (Pendaftaran Mahasiswa di Kelas)
export const classEnrollments = pgTable(
  'class_enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => courseClasses.id, { onDelete: 'cascade' }).notNull(),
    studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: enrollmentStatusEnum('status').default('ENROLLED').notNull(),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('class_enrollments_class_student_idx').on(table.classId, table.studentId),
    index('class_enrollments_class_id_idx').on(table.classId),
    index('class_enrollments_student_id_idx').on(table.studentId),
    index('class_enrollments_status_idx').on(table.status)
  ]
)
