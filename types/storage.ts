export type StorageDriver = 'r2' | 'local'

export type StorageCategory = 'assignments' | 'submissions' | 'materials' | 'syllabi' | 'general'

export interface PresignedUploadRequestDto {
  fileName: string
  fileType: string
  fileSize: number
  category?: StorageCategory
  isPublic?: boolean
}

export interface PresignedUploadResponseDto {
  uploadUrl: string
  fileKey: string
  signedReadUrl: string
  expiresInSeconds: number
  driver: StorageDriver
  headers: Record<string, string>
}

export interface SignedReadUrlRequestDto {
  fileKey: string
  expiresInSeconds?: number
}

export interface SignedReadUrlResponseDto {
  fileKey: string
  signedUrl: string
  expiresInSeconds: number
  driver: StorageDriver
}
