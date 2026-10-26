import { pgTable, uuid, varchar, text, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { userRoleEnum } from './enums'

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash'),
    role: userRoleEnum('role').default('student').notNull(),
    nimNidn: varchar('nim_nidn', { length: 50 }),
    phoneNumber: varchar('phone_number', { length: 30 }),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
    index('users_nim_nidn_idx').on(table.nimNidn),
    index('users_role_idx').on(table.role)
  ]
)
