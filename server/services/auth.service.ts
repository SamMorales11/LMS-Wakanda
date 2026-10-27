import bcrypt from 'bcryptjs'
import type { AuthSessionUser, AuthResponse, UserRole } from '~/types'
import { userRepository, type IUserRepository } from '../repositories'
import { getUserSession } from '../utils/session'
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../utils/errors'
import type { LoginInput } from '../utils/schemas'

export class AuthService {
  constructor(private readonly userRepo: IUserRepository = userRepository) {}

  /**
   * Autentikasi pengguna berdasarkan email dan password, lalu inisialisasi sesi H3 aman.
   */
  public async login(input: LoginInput, event: H3Event): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase()
    const password = input.password

    if (!email || !password) {
      throw new BadRequestError('Email dan password wajib diisi')
    }

    // Ambil data user lengkap beserta hash password
    const user = await this.userRepo.findByEmailWithPassword(email)
    if (!user) {
      // Menghindari email enumeration timing attack
      throw new UnauthorizedError('Email atau password tidak sesuai')
    }

    if (!user.isActive) {
      throw new ForbiddenError('Akun Anda dinonaktifkan. Silakan hubungi Administrator ITW.')
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('Akun belum memiliki kredensial password terdaftar')
    }

    // Verifikasi kecocokan password bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email atau password tidak sesuai')
    }

    const sessionUser: AuthSessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      nimNidn: user.nimNidn,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl
    }

    const sessionCreatedAt = new Date().toISOString()

    // Simpan ke H3 sealed session cookie
    const session = await getUserSession(event)
    await session.update({
      user: sessionUser,
      createdAt: sessionCreatedAt
    })

    // Lampirkan ke event context untuk request lifecycle berjalan
    event.context.user = sessionUser

    return {
      user: sessionUser,
      authenticated: true,
      sessionCreatedAt
    }
  }

  /**
   * Menghapus sesi login pengguna dan membersihkan cookie sesi.
   */
  public async logout(event: H3Event): Promise<void> {
    const session = await getUserSession(event)
    await session.clear()
    event.context.user = undefined
  }

  /**
   * Mengambil data profil pengguna yang sedang login berdasarkan sesi aktif.
   */
  public async getCurrentUser(event: H3Event): Promise<AuthSessionUser> {
    const session = await getUserSession(event)
    const sessionUser = session.data.user

    if (!sessionUser?.id) {
      throw new UnauthorizedError('Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.')
    }

    // Pastikan user masih valid dan aktif di database
    const freshUser = await this.userRepo.findById(sessionUser.id)
    if (!freshUser) {
      await session.clear()
      throw new UnauthorizedError('Data pengguna tidak ditemukan di sistem')
    }

    if (!freshUser.isActive) {
      await session.clear()
      throw new ForbiddenError('Akun pengguna telah dinonaktifkan')
    }

    const updatedProfile: AuthSessionUser = {
      id: freshUser.id,
      name: freshUser.name,
      email: freshUser.email,
      role: freshUser.role,
      nimNidn: freshUser.nimNidn,
      phoneNumber: freshUser.phoneNumber,
      avatarUrl: freshUser.avatarUrl
    }

    // Perbarui data sesi jika ada perubahan profil
    if (
      sessionUser.role !== updatedProfile.role ||
      sessionUser.name !== updatedProfile.name ||
      sessionUser.nimNidn !== updatedProfile.nimNidn
    ) {
      await session.update({
        user: updatedProfile
      })
    }

    event.context.user = updatedProfile
    return updatedProfile
  }
}

export const authService = new AuthService()
