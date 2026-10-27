import { createError } from 'h3'

export class DomainError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    if (typeof (Error as unknown as { captureStackTrace?: (target: object, constructorOpt?: unknown) => void }).captureStackTrace === 'function') {
      (Error as unknown as { captureStackTrace: (target: object, constructorOpt?: unknown) => void }).captureStackTrace(this, this.constructor)
    }
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details)
  }
}

export class BadRequestError extends DomainError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details)
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details)
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Resource already exists', details?: unknown) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required to access this resource', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details)
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to perform this action', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details)
  }
}

/**
 * Maps a DomainError to an H3 Nitro error.
 */
export const handleServerError = (error: unknown) => {
  if (error instanceof DomainError) {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
      data: {
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Fallback for standard or unknown errors
  const message = error instanceof Error ? error.message : 'Internal Server Error'
  throw createError({
    statusCode: 500,
    statusMessage: message,
    data: {
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }
  })
}
