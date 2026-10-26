export type UserRole = 'admin' | 'lecturer' | 'student'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  nimNidn?: string | null
  phoneNumber?: string | null
  avatarUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  name: string
  email: string
  role: UserRole
  nimNidn?: string
  passwordHash?: string
  phoneNumber?: string
}

export interface UpdateUserDto {
  name?: string
  email?: string
  role?: UserRole
  nimNidn?: string
  phoneNumber?: string
  avatarUrl?: string
  isActive?: boolean
}
