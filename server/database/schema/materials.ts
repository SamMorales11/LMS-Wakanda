import { pgTable, uuid, varchar, text, integer, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { sessionMaterialTypeEnum } from './enums'
import { classSessions } from './sessions'
import { users } from './users'

// 18. Session Materials (Distribusi Materi Mingguan 16 Pertemuan)
export const sessionMaterials = pgTable(
  'session_materials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'cascade' }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    materialType: sessionMaterialTypeEnum('material_type').default('SLIDE').notNull(),
    fileKey: varchar('file_key', { length: 500 }),
    fileUrl: text('file_url'),
    fileName: varchar('file_name', { length: 255 }),
    fileSize: integer('file_size'),
    externalUrl: text('external_url'),
    orderIndex: integer('order_index').default(0).notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('session_materials_session_id_idx').on(table.sessionId),
    index('session_materials_type_idx').on(table.materialType),
    index('session_materials_order_idx').on(table.sessionId, table.orderIndex)
  ]
)

// 19. Material Read Progress (Pelacakan Status Bacaan Mahasiswa)
export const materialReadProgress = pgTable(
  'material_read_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    materialId: uuid('material_id').references(() => sessionMaterials.id, { onDelete: 'cascade' }).notNull(),
    studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    isCompleted: boolean('is_completed').default(true).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('material_read_student_unique_idx').on(table.materialId, table.studentId),
    index('material_read_student_idx').on(table.studentId),
    index('material_read_material_idx').on(table.materialId)
  ]
)
