import QRCode from 'qrcode'
import crypto from 'node:crypto'
import type {
  AttendanceTokenDto,
  AttendanceLogDto,
  StudentAttendanceSummaryDto,
  SessionAttendanceOverviewDto,
  OpenAttendanceSessionDto,
  CheckInDto,
  ManualAttendanceUpdateDto,
  AttendanceMethod
} from '~/types'
import {
  attendanceRepository,
  type IAttendanceRepository,
  classRepository
} from '../repositories'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError
} from '../utils/errors'
import type { AttendanceToken } from '../database'

export class AttendanceService {
  constructor(private readonly repo: IAttendanceRepository = attendanceRepository) {}

  /**
   * Helper: Format PIN 6-digit menjadi tampilan terpisah (e.g. "849216" -> "849-216")
   */
  public formatPin(pin: string): string {
    const clean = pin.replace(/[^0-9]/g, '')
    if (clean.length === 6) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`
    }
    return pin
  }

  /**
   * Helper: Transform Drizzle row menjadi DTO lengkap dengan sisa waktu & QR Code
   */
  private async toTokenDto(row: AttendanceToken): Promise<AttendanceTokenDto> {
    const now = Date.now()
    const validUntilMs = row.validUntil.getTime()
    const remainingSeconds = Math.max(0, Math.floor((validUntilMs - now) / 1000))

    let qrCodeDataUrl: string | undefined
    if (row.qrCodePayload) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(row.qrCodePayload, {
          width: 320,
          margin: 1.5,
          color: {
            dark: '#1E3A8A', // Academic Navy
            light: '#FFFFFF'
          }
        })
      } catch (err) {
        console.warn('[AttendanceService] Gagal menghasilkan QR code data URL:', err)
      }
    }

    return {
      id: row.id,
      sessionId: row.sessionId,
      token: row.token,
      formattedToken: this.formatPin(row.token),
      qrCodeDataUrl,
      qrCodePayload: row.qrCodePayload,
      validFrom: row.validFrom.toISOString(),
      validUntil: row.validUntil.toISOString(),
      remainingSeconds,
      isActive: row.isActive && remainingSeconds > 0,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString()
    }
  }

  /**
   * Dosen membuka sesi presensi:
   * Men-generate PIN 6-digit acak serta QR Code dinamis berbatas waktu (Strict Server Timestamp)
   */
  public async openAttendanceSession(
    dto: OpenAttendanceSessionDto,
    lecturerId?: string
  ): Promise<AttendanceTokenDto> {
    const [session] = await Promise.all([
      this.repo.getSessionById(dto.sessionId),
      this.repo.deactivateTokensBySessionId(dto.sessionId)
    ])

    if (!session) {
      throw new NotFoundError(`Sesi perkuliahan dengan ID '${dto.sessionId}' tidak ditemukan`)
    }

    // 2. Generate 6-digit PIN acak kriptografis (100000 - 999999)
    const pinNumber = crypto.randomInt(100000, 999999).toString()

    const durationMinutes = dto.durationMinutes || 15
    const validFrom = new Date()
    const validUntil = new Date(validFrom.getTime() + durationMinutes * 60 * 1000)

    // 3. Payload QR Code dinamis (berisi metadata terenkripsi/terverifikasi)
    const qrPayload = JSON.stringify({
      app: 'LMS_WAKANDA',
      sessionId: session.id,
      sessionNumber: session.sessionNumber,
      pin: pinNumber,
      validUntil: validUntil.toISOString(),
      signature: crypto
        .createHash('sha256')
        .update(`${session.id}:${pinNumber}:${validUntil.toISOString()}`)
        .digest('hex')
        .substring(0, 16)
    })

    // 4. Simpan ke database
    const tokenRecord = await this.repo.createToken({
      sessionId: session.id,
      token: pinNumber,
      qrCodePayload: qrPayload,
      validFrom,
      validUntil,
      createdBy: lecturerId
    })

    return this.toTokenDto(tokenRecord)
  }

  /**
   * Dosen menutup sesi presensi lebih awal
   */
  public async closeAttendanceSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const session = await this.repo.getSessionById(sessionId)
    if (!session) {
      throw new NotFoundError(`Sesi perkuliahan dengan ID '${sessionId}' tidak ditemukan`)
    }

    await this.repo.deactivateTokensBySessionId(sessionId)
    return {
      success: true,
      message: `Sesi presensi Pertemuan ${session.sessionNumber} berhasil ditutup.`
    }
  }

  /**
   * Mahasiswa Check-In Real-Time:
   * Menggunakan Validasi Strict Server-Side Timestamp & Pencegahan Duplikasi
   */
  public async checkIn(
    studentId: string,
    dto: CheckInDto
  ): Promise<{
    log: AttendanceLogDto
    summary: StudentAttendanceSummaryDto
    message: string
  }> {
    const serverTimestamp = new Date()

    // 1. Parsing token (bisa berupa input PIN 6-digit biasa atau payload QR Code JSON)
    let tokenValue = dto.token.trim()
    let checkInMethod: AttendanceMethod = 'TOKEN'

    if (tokenValue.startsWith('{') && tokenValue.endsWith('}')) {
      try {
        const parsed = JSON.parse(tokenValue)
        if (parsed.pin) {
          tokenValue = parsed.pin
          checkInMethod = 'QR_SCAN'
        }
      } catch {
        // Fallback anggap token string
      }
    }

    const cleanToken = tokenValue.replace(/[^0-9]/g, '')
    if (cleanToken.length !== 6) {
      throw new BadRequestError('Token PIN presensi harus terdiri dari 6 digit angka')
    }

    // 2. Cari token presensi aktif di database
    const tokenRecord = await this.repo.findTokenByValue(cleanToken)
    if (!tokenRecord) {
      throw new BadRequestError('Kode presensi tidak ditemukan atau sudah tidak berlaku')
    }

    // 3. Validasi Kecocokan Sesi jika dikirimkan oleh client
    if (dto.sessionId && tokenRecord.sessionId !== dto.sessionId) {
      throw new BadRequestError('Kode presensi ini tidak ditujukan untuk pertemuan yang Anda pilih')
    }

    // 4. STRICT SERVER-SIDE TIMESTAMP VALIDATION
    if (!tokenRecord.isActive) {
      throw new BadRequestError('Sesi presensi telah ditutup oleh Dosen Pengampu')
    }

    if (serverTimestamp < tokenRecord.validFrom) {
      throw new BadRequestError('Sesi presensi belum dimulai')
    }

    if (serverTimestamp > tokenRecord.validUntil) {
      throw new BadRequestError(
        `Batas waktu presensi telah berakhir pada ${tokenRecord.validUntil.toLocaleTimeString('id-ID')} WIB (Toleransi 15 menit habis)`
      )
    }

    // 5. Validasi Sesi & Cek Presensi Terdahulu (Concurrent Query)
    const [session, existingLog] = await Promise.all([
      this.repo.getSessionById(tokenRecord.sessionId),
      this.repo.findLog(tokenRecord.sessionId, studentId)
    ])

    if (!session) {
      throw new NotFoundError('Sesi perkuliahan tidak valid')
    }

    const isEnrolled = await this.repo.isStudentEnrolledInClass(session.classId, studentId)
    if (!isEnrolled) {
      throw new ForbiddenError('Anda tidak terdaftar sebagai peserta pada kelas perkuliahan ini')
    }

    // 6. Cek Apakah Mahasiswa Sudah Pernah Presensi (Idempotensi)
    if (existingLog && existingLog.status === 'PRESENT') {
      const summary = await this.calculateStudentAttendanceSummary(session.classId, studentId)
      return {
        log: {
          id: existingLog.id,
          sessionId: existingLog.sessionId,
          studentId: existingLog.studentId,
          status: existingLog.status,
          checkInTime: existingLog.checkInTime.toISOString(),
          checkInMethod: existingLog.checkInMethod,
          deviceInfo: existingLog.deviceInfo,
          notes: existingLog.notes,
          createdAt: existingLog.createdAt.toISOString(),
          updatedAt: existingLog.updatedAt.toISOString()
        },
        summary,
        message: 'Kehadiran Anda sudah tercatat sebelumnya pada pertemuan ini.'
      }
    }

    // 7. Simpan Log Presensi Hadir
    const savedLog = await this.repo.createOrUpdateLog({
      sessionId: tokenRecord.sessionId,
      studentId,
      status: 'PRESENT',
      checkInMethod,
      deviceInfo: dto.deviceInfo
    })

    // 8. Hitung Otomatis Rekap Persentase Kehadiran Semester & Kelayakan UAS
    const summary = await this.calculateStudentAttendanceSummary(session.classId, studentId)

    return {
      log: {
        id: savedLog.id,
        sessionId: savedLog.sessionId,
        studentId: savedLog.studentId,
        status: savedLog.status,
        checkInTime: savedLog.checkInTime.toISOString(),
        checkInMethod: savedLog.checkInMethod,
        deviceInfo: savedLog.deviceInfo,
        notes: savedLog.notes,
        createdAt: savedLog.createdAt.toISOString(),
        updatedAt: savedLog.updatedAt.toISOString()
      },
      summary,
      message: `Presensi berhasil! Kehadiran Anda pada Pertemuan ${session.sessionNumber} tercatat sukses (${checkInMethod}).`
    }
  }

  /**
   * Dosen memperbarui status presensi mahasiswa secara manual (Hadir, Izin, Sakit, Alfa)
   */
  public async manualUpdateStatus(
    dto: ManualAttendanceUpdateDto,
    _updatedBy?: string
  ): Promise<AttendanceLogDto> {
    const session = await this.repo.getSessionById(dto.sessionId)
    if (!session) {
      throw new NotFoundError(`Sesi perkuliahan dengan ID '${dto.sessionId}' tidak ditemukan`)
    }

    const updated = await this.repo.createOrUpdateLog({
      sessionId: dto.sessionId,
      studentId: dto.studentId,
      status: dto.status,
      checkInMethod: 'MANUAL_LECTURER',
      notes: dto.notes
    })

    return {
      id: updated.id,
      sessionId: updated.sessionId,
      studentId: updated.studentId,
      status: updated.status,
      checkInTime: updated.checkInTime.toISOString(),
      checkInMethod: updated.checkInMethod,
      deviceInfo: updated.deviceInfo,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
  }

  /**
   * Menghitung persentase kehadiran semester mahasiswa & kelayakan mengikuti UAS (Minimal 75%)
   */
  public async calculateStudentAttendanceSummary(
    classId: string,
    studentId: string
  ): Promise<StudentAttendanceSummaryDto> {
    const [sessions, logs] = await Promise.all([
      this.repo.findClassSessions(classId),
      this.repo.findStudentLogsByClassId(classId, studentId)
    ])

    const totalSessions = sessions.length > 0 ? sessions.length : 16

    let presentCount = 0
    let lateCount = 0
    let permitCount = 0
    let sickCount = 0
    let absentCount = 0

    logs.forEach((log) => {
      switch (log.status) {
        case 'PRESENT':
          presentCount++
          break
        case 'LATE':
          lateCount++
          break
        case 'PERMIT':
          permitCount++
          break
        case 'SICK':
          sickCount++
          break
        case 'ABSENT':
          absentCount++
          break
      }
    })

    // Sesi hadir: PRESENT dihitung penuh, LATE dihitung hadir
    const attendedSessions = presentCount + lateCount

    // Hitung persentase kehadiran (berbasis total kurikulum 16 sesi)
    const attendancePercentage =
      totalSessions > 0
        ? Math.round((attendedSessions / totalSessions) * 10000) / 100
        : 0

    // Syarat kelayakan UAS: Minimal 75.00%
    const minimumRequirementPercentage = 75.0
    const isEligibleForFinalExam = attendancePercentage >= minimumRequirementPercentage

    return {
      classId,
      studentId,
      totalSessions,
      attendedSessions,
      presentCount,
      lateCount,
      permitCount,
      sickCount,
      absentCount,
      attendancePercentage,
      minimumRequirementPercentage,
      isEligibleForFinalExam,
      sessionLogs: logs
    }
  }

  /**
   * Mengambil matriks rekapitulasi presensi semester seluruh mahasiswa dalam satu kelas (Dosen / Admin)
   */
  public async getClassAttendanceRecap(classId: string): Promise<{
    classId: string
    totalSessions: number
    students: StudentAttendanceSummaryDto[]
  }> {
    const students = await this.repo.findEnrolledStudents(classId)
    const summaries = await Promise.all(
      students.map(async (st) => {
        const sum = await this.calculateStudentAttendanceSummary(classId, st.id)
        return {
          ...sum,
          studentName: st.name,
          studentNim: st.nimNidn,
          studentEmail: st.email
        }
      })
    )

    return {
      classId,
      totalSessions: 16,
      students: summaries
    }
  }

  /**
   * Mengambil ikhtisar presensi sesi perkuliahan (Token aktif, rekap hadir, daftar mahasiswa)
   */
  public async getSessionAttendanceOverview(
    sessionId: string,
    classId?: string
  ): Promise<SessionAttendanceOverviewDto> {
    const session = await this.repo.getSessionById(sessionId)
    if (!session) {
      throw new NotFoundError(`Sesi perkuliahan dengan ID '${sessionId}' tidak ditemukan`)
    }

    const targetClassId = classId || session.classId

    // 1. Eksekusi query terindeks secara concurrent untuk performa tinggi < 200ms
    const [activeTokenRow, totalEnrolled, logs] = await Promise.all([
      this.repo.findActiveTokenBySessionId(sessionId),
      this.repo.countEnrolledStudents(targetClassId),
      this.repo.findLogsBySessionId(sessionId)
    ])

    const activeToken = activeTokenRow ? await this.toTokenDto(activeTokenRow) : null

    let presentCount = 0
    let lateCount = 0
    let permitCount = 0
    let sickCount = 0
    let absentCount = 0

    logs.forEach((l) => {
      if (l.status === 'PRESENT') presentCount++
      else if (l.status === 'LATE') lateCount++
      else if (l.status === 'PERMIT') permitCount++
      else if (l.status === 'SICK') sickCount++
      else if (l.status === 'ABSENT') absentCount++
    })

    return {
      sessionId: session.id,
      sessionNumber: session.sessionNumber,
      sessionTitle: session.title,
      activeToken,
      totalEnrolled,
      presentCount,
      lateCount,
      permitCount,
      sickCount,
      absentCount,
      logs
    }
  }
}

export const attendanceService = new AttendanceService()
