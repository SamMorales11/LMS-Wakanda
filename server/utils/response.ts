import type { ApiResponse, ApiMeta } from '~/types'

/**
 * Creates a standardized API success response envelope.
 */
export const createApiResponse = <T>(
  data: T,
  message = 'Operation successful',
  meta?: Partial<ApiMeta>
): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  }
}

/**
 * Creates a paginated success response envelope.
 */
export const createPaginatedResponse = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  message = 'Data retrieved successfully'
): ApiResponse<T[]> => {
  return {
    success: true,
    message,
    data: items,
    meta: {
      page,
      limit,
      total,
      timestamp: new Date().toISOString()
    }
  }
}
