/**
 * Generic Clean Architecture Repository Contract
 */
export interface IBaseRepository<T, ID = string, TCreateInput = unknown> {
  findById(id: ID): Promise<T | null>
  findAll(filter?: Record<string, unknown>): Promise<T[]>
  create(entity: TCreateInput): Promise<T>
  update(id: ID, entity: Partial<T>): Promise<T | null>
  delete(id: ID): Promise<boolean>
}
