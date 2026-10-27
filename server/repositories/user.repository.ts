import { eq, or, ilike, desc } from 'drizzle-orm'
import type { User as DomainUser, CreateUserDto, UpdateUserDto, UserRole } from '~/types'
import type { IBaseRepository } from './base.repository'
import { db, users, type User as DrizzleUser } from '../database'

export interface IUserRepository extends IBaseRepository<DomainUser, string, CreateUserDto> {
  findByEmail(email: string): Promise<DomainUser | null>
  findByEmailWithPassword(email: string): Promise<DrizzleUser | null>
  findByRole(role: UserRole): Promise<DomainUser[]>
}

export class UserRepository implements IUserRepository {
  private toDomain(row: DrizzleUser): DomainUser {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      nimNidn: row.nimNidn,
      phoneNumber: row.phoneNumber,
      avatarUrl: row.avatarUrl,
      isActive: row.isActive,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)
    }
  }

  public async findById(id: string): Promise<DomainUser | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return rows[0] ? this.toDomain(rows[0]) : null
  }

  public async findByEmail(email: string): Promise<DomainUser | null> {
    const normalized = email.trim().toLowerCase()
    const rows = await db.select().from(users).where(eq(users.email, normalized)).limit(1)
    return rows[0] ? this.toDomain(rows[0]) : null
  }

  public async findByEmailWithPassword(email: string): Promise<DrizzleUser | null> {
    const normalized = email.trim().toLowerCase()
    const rows = await db.select().from(users).where(eq(users.email, normalized)).limit(1)
    return rows[0] || null
  }

  public async findByRole(role: UserRole): Promise<DomainUser[]> {
    const rows = await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt))
    return rows.map(r => this.toDomain(r))
  }

  public async findAll(filter?: { role?: UserRole; search?: string }): Promise<DomainUser[]> {
    const conditions = []

    if (filter?.role) {
      conditions.push(eq(users.role, filter.role))
    }

    if (filter?.search) {
      const q = `%${filter.search.trim()}%`
      conditions.push(or(ilike(users.name, q), ilike(users.email, q)))
    }

    const rows = await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : or(...conditions)) : undefined)
      .orderBy(desc(users.createdAt))

    return rows.map(r => this.toDomain(r))
  }

  public async create(dto: CreateUserDto): Promise<DomainUser> {
    const rows = await db.insert(users).values({
      name: dto.name,
      email: dto.email.trim().toLowerCase(),
      role: dto.role,
      nimNidn: dto.nimNidn || null,
      passwordHash: dto.passwordHash || null,
      phoneNumber: dto.phoneNumber || null,
      isActive: true
    }).returning()

    return this.toDomain(rows[0])
  }

  public async update(id: string, dto: UpdateUserDto): Promise<DomainUser | null> {
    const rows = await db.update(users).set({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.nimNidn !== undefined && { nimNidn: dto.nimNidn }),
      ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date()
    }).where(eq(users.id, id)).returning()

    return rows[0] ? this.toDomain(rows[0]) : null
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
    return rows.length > 0
  }
}

export const userRepository = new UserRepository()
