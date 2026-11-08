import bcrypt from 'bcryptjs'
import type { User, CreateUserDto, UpdateUserDto, UserRole } from '~/types'
import { userRepository, type IUserRepository } from '../repositories'
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors'
import { assertNotProtectedDemoAccount } from '../utils/demo-guard'

export class UserService {
  constructor(private readonly repo: IUserRepository = userRepository) {}

  public async getAllUsers(filter?: { role?: UserRole; search?: string; limit?: number; offset?: number }): Promise<User[]> {
    return this.repo.findAll(filter)
  }

  public async getUserById(id: string): Promise<User> {
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('A valid user ID must be provided')
    }

    const user = await this.repo.findById(id)
    if (!user) {
      throw new NotFoundError(`User with ID '${id}' was not found`)
    }

    return user
  }

  public async createUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.repo.findByEmail(dto.email)
    if (existing) {
      throw new ConflictError(`User with email '${dto.email}' already exists`)
    }

    let passwordHash = dto.passwordHash
    if (!passwordHash) {
      const rawPassword = dto.password || 'Password123!'
      passwordHash = await bcrypt.hash(rawPassword, 10)
    }

    return this.repo.create({
      ...dto,
      passwordHash
    })
  }

  public async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id)

    if (dto.isActive === false || (dto.email && dto.email.trim().toLowerCase() !== user.email.toLowerCase())) {
      assertNotProtectedDemoAccount(user.email, 'Penonaktifan atau modifikasi email')
    }

    if (dto.email) {
      const existingWithEmail = await this.repo.findByEmail(dto.email)
      if (existingWithEmail && existingWithEmail.id !== id) {
        throw new ConflictError(`Email '${dto.email}' is already in use by another account`)
      }
    }

    const updated = await this.repo.update(id, dto)
    if (!updated) {
      throw new NotFoundError(`Failed to update user with ID '${id}'`)
    }

    return updated
  }

  public async deleteUser(id: string): Promise<{ id: string; deleted: boolean }> {
    const user = await this.getUserById(id)
    assertNotProtectedDemoAccount(user.email, 'Penghapusan akun')
    const deleted = await this.repo.delete(id)
    return { id, deleted }
  }

  public async resetPassword(
    id: string,
    newPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.getUserById(id)
    assertNotProtectedDemoAccount(user.email, 'Reset kata sandi')

    const rawPassword = newPassword || 'Password123!'
    const passwordHash = await bcrypt.hash(rawPassword, 10)
    await this.repo.updatePassword(id, passwordHash)

    return {
      success: true,
      message: `Kata sandi untuk pengguna '${user.name}' berhasil direset`
    }
  }
}

export const userService = new UserService()
