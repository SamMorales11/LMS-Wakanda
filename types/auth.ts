import type { UserRole } from './user'

export interface AuthSessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  nimNidn?: string | null
  phoneNumber?: string | null
  avatarUrl?: string | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: AuthSessionUser
  authenticated: boolean
  sessionCreatedAt: string
}
