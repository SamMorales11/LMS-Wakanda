import { pgTable, uuid, varchar, text, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { attendanceStatusEnum, attendanceMethodEnum } from './enums'
import { classSessions } from './sessions'
import { users } from './users'

// 8. Attendance Tokens (Token / QR Dinamis Presensi per Sesi)
export const attendanceTokens = pgTable(
  'attendance_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'cascade' }).notNull(),
    token: varchar('token', { length: 64 }).notNull(),
    qrCodePayload: text('qr_code_payload'),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('attendance_tokens_token_idx').on(table.token),
    index('attendance_tokens_session_id_idx').on(table.sessionId),
    index('attendance_tokens_valid_range_idx').on(table.validFrom, table.validUntil),
    index('attendance_tokens_active_lookup_idx').on(table.token, table.isActive, table.validUntil)
  ]
)

// 9. Attendance Logs (Log Kehadiran Mahasiswa)
export const attendanceLogs = pgTable(
  'attendance_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'cascade' }).notNull(),
    studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: attendanceStatusEnum('status').default('PRESENT').notNull(),
    checkInTime: timestamp('check_in_time', { withTimezone: true }).defaultNow().notNull(),
    checkInMethod: attendanceMethodEnum('check_in_method').default('TOKEN').notNull(),
    deviceInfo: text('device_info'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('attendance_logs_session_student_idx').on(table.sessionId, table.studentId),
    index('attendance_logs_session_id_idx').on(table.sessionId),
    index('attendance_logs_student_id_idx').on(table.studentId),
    index('attendance_logs_status_idx').on(table.status),
    index('attendance_logs_student_session_status_idx').on(table.studentId, table.sessionId, table.status)
  ]
)
