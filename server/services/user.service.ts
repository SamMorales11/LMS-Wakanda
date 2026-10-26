import type { User, CreateUserDto, UpdateUserDto, UserRole } from '~/types'
import { userRepository, type IUserRepository } from '../repositories'
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors'

export class UserService {
  constructor(private readonly repo: IUserRepository = userRepository) {}

  public async getAllUsers(filter?: { role?: UserRole; search?: string }): Promise<User[]> {
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

    return this.repo.create(dto)
  }

  public async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    await this.getUserById(id)

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
    await this.getUserById(id)
    const deleted = await this.repo.delete(id)
    return { id, deleted }
  }
}

export const userService = new UserService()
