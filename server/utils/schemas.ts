import { z } from 'zod'

export const userRoleSchema = z.enum(['admin', 'lecturer', 'student'])

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address format'),
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

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserQueryInput = z.infer<typeof userQuerySchema>
