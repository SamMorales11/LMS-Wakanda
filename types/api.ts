export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: ApiErrorPayload
  meta?: ApiMeta
}

export interface ApiErrorPayload {
  code: string
  details?: Record<string, unknown> | Array<unknown> | string
  timestamp: string
}

export interface ApiMeta {
  page?: number
  limit?: number
  total?: number
  timestamp: string
  requestId?: string
  [key: string]: unknown
}
