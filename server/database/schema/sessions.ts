import { pgTable, uuid, varchar, text, integer, timestamp, date, time, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { sessionTypeEnum, sessionStatusEnum } from './enums'
import { courseClasses } from './academics'

// 6. Class Sessions (Struktur 16 Pertemuan Perkuliahan)
export const classSessions = pgTable(
  'class_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => courseClasses.id, { onDelete: 'cascade' }).notNull(),
    sessionNumber: integer('session_number').notNull(), // Pertemuan 1 s.d. 16 (pertemuan 8 UTS, 16 UAS dsb)
    title: varchar('title', { length: 255 }).notNull(),
    topicDescription: text('topic_description'),
    sessionDate: date('session_date').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    sessionType: sessionTypeEnum('session_type').default('REGULAR').notNull(),
    status: sessionStatusEnum('status').default('SCHEDULED').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('class_sessions_class_session_num_idx').on(table.classId, table.sessionNumber),
    index('class_sessions_class_id_idx').on(table.classId),
    index('class_sessions_date_idx').on(table.sessionDate),
    index('class_sessions_status_idx').on(table.status)
  ]
)
