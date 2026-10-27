export type SessionMaterialType = 'SLIDE' | 'CODE' | 'VIDEO' | 'DOCUMENT'

export interface SessionMaterialDto {
  id: string
  sessionId: string
  title: string
  description?: string | null
  materialType: SessionMaterialType
  fileKey?: string | null
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  externalUrl?: string | null
  orderIndex: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  isCompleted?: boolean
  completedAt?: string | null
}

export interface CreateSessionMaterialDto {
  sessionId: string
  title: string
  description?: string
  materialType?: SessionMaterialType
  fileKey?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  externalUrl?: string
  orderIndex?: number
  isPublished?: boolean
}

export interface UpdateSessionMaterialDto {
  title?: string
  description?: string
  materialType?: SessionMaterialType
  fileKey?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  externalUrl?: string
  orderIndex?: number
  isPublished?: boolean
}

export interface MaterialProgressDto {
  materialId: string
  studentId: string
  isCompleted: boolean
  completedAt: string
}

export interface SessionProgressSummaryDto {
  sessionId: string
  totalMaterials: number
  completedMaterials: number
  progressPercentage: number
}
