import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type {
  StorageDriver,
  PresignedUploadRequestDto,
  PresignedUploadResponseDto,
  SignedReadUrlRequestDto,
  SignedReadUrlResponseDto
} from '~/types'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors'

export interface IStorageService {
  getDriver(): StorageDriver
  createPresignedUpload(
    dto: PresignedUploadRequestDto,
    origin?: string
  ): Promise<PresignedUploadResponseDto>
  createSignedReadUrl(
    dto: SignedReadUrlRequestDto,
    origin?: string
  ): Promise<SignedReadUrlResponseDto>
  deleteFile(fileKey: string): Promise<boolean>
  checkFileExists(fileKey: string): Promise<boolean>
  // Local Fallback Helpers
  verifyLocalToken(fileKey: string, expires: string, token: string): boolean
  saveLocalFile(fileKey: string, buffer: Buffer): Promise<void>
  getLocalFilePath(fileKey: string): string
}

export class StorageService implements IStorageService {
  private readonly s3Client: S3Client | null = null
  private readonly driver: StorageDriver
  private readonly bucketName: string
  private readonly publicUrl: string
  private readonly localStorageDir: string
  private readonly sessionSecret: string

  constructor() {
    this.sessionSecret =
      process.env.SESSION_SECRET || 'wakanda-super-secure-session-secret-key-32chars-min-2026!'
    this.localStorageDir = path.resolve(process.cwd(), 'storage/uploads')

    // R2 Credentials from environment
    const accountId = process.env.R2_ACCOUNT_ID?.trim()
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
    this.bucketName = process.env.R2_BUCKET_NAME?.trim() || 'lms-wakanda-bucket'
    this.publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, '') || ''

    const explicitDriver = process.env.STORAGE_DRIVER?.trim().toLowerCase()

    // Determine driver: R2 if all credentials provided and not explicitly set to local
    if (explicitDriver === 'local') {
      this.driver = 'local'
    } else if (accountId && accessKeyId && secretAccessKey && this.bucketName) {
      this.driver = 'r2'
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey
        }
      })
    } else {
      // Automatic fallback to local storage
      this.driver = 'local'
    }

    // Ensure local storage folder exists if using local driver
    if (this.driver === 'local') {
      if (!fs.existsSync(this.localStorageDir)) {
        fs.mkdirSync(this.localStorageDir, { recursive: true })
      }
    }
  }

  public getDriver(): StorageDriver {
    return this.driver
  }

  /**
   * Sanitizes file name and creates a unique, chronological file key.
   */
  private generateFileKey(fileName: string, category = 'general'): string {
    const ext = path.extname(fileName).toLowerCase()
    const base = path
      .basename(fileName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50)
    const uniqueId = crypto.randomUUID()
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    return `${category}/${year}/${month}/${uniqueId}-${base}${ext}`
  }

  /**
   * Generates HMAC signature for local fallback URLs.
   */
  private generateLocalHmac(fileKey: string, expires: number): string {
    return crypto
      .createHmac('sha256', this.sessionSecret)
      .update(`${fileKey}:${expires}`)
      .digest('hex')
  }

  /**
   * Verifies an HMAC signature for local fallback requests.
   */
  public verifyLocalToken(fileKey: string, expires: string, token: string): boolean {
    const expiresNum = parseInt(expires, 10)
    if (isNaN(expiresNum) || Date.now() > expiresNum) {
      return false
    }

    const expected = this.generateLocalHmac(fileKey, expiresNum)
    const expectedBuf = Buffer.from(expected)
    const tokenBuf = Buffer.from(token)
    if (expectedBuf.length !== tokenBuf.length) {
      return false
    }
    return crypto.timingSafeEqual(expectedBuf, tokenBuf)
  }

  /**
   * Generates a 15-minute Presigned Upload URL and Signed Read URL.
   */
  public async createPresignedUpload(
    dto: PresignedUploadRequestDto,
    origin = ''
  ): Promise<PresignedUploadResponseDto> {
    const fileKey = this.generateFileKey(dto.fileName, dto.category)
    const expiresInSeconds = 900 // 15 menit

    if (this.driver === 'r2' && this.s3Client) {
      // 1. R2 Cloudflare S3 PutObject Command
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: dto.fileType,
        ContentLength: dto.fileSize
      })

      const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
        expiresIn: expiresInSeconds
      })

      // 2. R2 Signed Read URL (15 menit untuk berkas privat)
      let signedReadUrl: string
      if (dto.isPublic && this.publicUrl) {
        signedReadUrl = `${this.publicUrl}/${fileKey}`
      } else {
        const getCommand = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey
        })
        signedReadUrl = await getSignedUrl(this.s3Client, getCommand, {
          expiresIn: expiresInSeconds
        })
      }

      return {
        uploadUrl,
        fileKey,
        signedReadUrl,
        expiresInSeconds,
        driver: 'r2',
        headers: {
          'Content-Type': dto.fileType
        }
      }
    }

    // =========================================================================
    // LOCAL STORAGE FALLBACK MECHANISM
    // =========================================================================
    const expiresAt = Date.now() + expiresInSeconds * 1000
    const token = this.generateLocalHmac(fileKey, expiresAt)

    const baseOrigin = origin.replace(/\/$/, '')
    const uploadUrl = `${baseOrigin}/api/storage/local/upload?key=${encodeURIComponent(
      fileKey
    )}&expires=${expiresAt}&token=${token}`
    const signedReadUrl = `${baseOrigin}/api/storage/local/read?key=${encodeURIComponent(
      fileKey
    )}&expires=${expiresAt}&token=${token}`

    return {
      uploadUrl,
      fileKey,
      signedReadUrl,
      expiresInSeconds,
      driver: 'local',
      headers: {
        'Content-Type': dto.fileType
      }
    }
  }

  /**
   * Generates a Signed Read URL for an existing file (15 menit default).
   */
  public async createSignedReadUrl(
    dto: SignedReadUrlRequestDto,
    origin = ''
  ): Promise<SignedReadUrlResponseDto> {
    const expiresInSeconds = dto.expiresInSeconds || 900 // 15 menit

    if (this.driver === 'r2' && this.s3Client) {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: dto.fileKey
      })

      const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: expiresInSeconds
      })

      return {
        fileKey: dto.fileKey,
        signedUrl,
        expiresInSeconds,
        driver: 'r2'
      }
    }

    // Local Storage Fallback
    const expiresAt = Date.now() + expiresInSeconds * 1000
    const token = this.generateLocalHmac(dto.fileKey, expiresAt)
    const baseOrigin = origin.replace(/\/$/, '')
    const signedUrl = `${baseOrigin}/api/storage/local/read?key=${encodeURIComponent(
      dto.fileKey
    )}&expires=${expiresAt}&token=${token}`

    return {
      fileKey: dto.fileKey,
      signedUrl,
      expiresInSeconds,
      driver: 'local'
    }
  }

  /**
   * Saves buffer to local storage directory.
   */
  public async saveLocalFile(fileKey: string, buffer: Buffer): Promise<void> {
    const targetPath = this.getLocalFilePath(fileKey)
    const dir = path.dirname(targetPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    await fs.promises.writeFile(targetPath, buffer)
  }

  /**
   * Resolves safe local file path.
   */
  public getLocalFilePath(fileKey: string): string {
    // Prevent directory traversal
    const safeKey = path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, '')
    return path.join(this.localStorageDir, safeKey)
  }

  /**
   * Deletes a file from storage (R2 or local).
   */
  public async deleteFile(fileKey: string): Promise<boolean> {
    if (this.driver === 'r2' && this.s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey
      })
      await this.s3Client.send(command)
      return true
    }

    const localPath = this.getLocalFilePath(fileKey)
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath)
      return true
    }
    return false
  }

  /**
   * Checks whether a file exists in storage.
   */
  public async checkFileExists(fileKey: string): Promise<boolean> {
    if (this.driver === 'r2' && this.s3Client) {
      try {
        const command = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey
        })
        await this.s3Client.send(command)
        return true
      } catch {
        return false
      }
    }

    const localPath = this.getLocalFilePath(fileKey)
    return fs.existsSync(localPath)
  }
}

export const storageService = new StorageService()
