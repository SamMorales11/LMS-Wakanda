import { defineStore } from 'pinia'
import type {
  SessionAttendanceOverviewDto,
  StudentAttendanceSummaryDto,
  AttendanceTokenDto,
  AttendanceStatus,
  ApiResponse
} from '~/types'

interface AttendanceStoreState {
  sessionOverview: SessionAttendanceOverviewDto | null
  studentSummary: StudentAttendanceSummaryDto | null
  activeToken: AttendanceTokenDto | null
  remainingSeconds: number
  isLoading: boolean
  isCheckingIn: boolean
  isOpeningSession: boolean
  error: string | null
  feedback: string | null
  timerId: ReturnType<typeof setInterval> | null
}

export const useAttendanceStore = defineStore('attendance', {
  state: (): AttendanceStoreState => ({
    sessionOverview: null,
    studentSummary: null,
    activeToken: null,
    remainingSeconds: 0,
    isLoading: false,
    isCheckingIn: false,
    isOpeningSession: false,
    error: null,
    feedback: null,
    timerId: null
  }),

  getters: {
    hasActiveToken: (state): boolean => {
      return !!state.activeToken && state.remainingSeconds > 0
    },

    formattedRemainingTime: (state): string => {
      if (state.remainingSeconds <= 0) return '00:00'
      const mins = Math.floor(state.remainingSeconds / 60)
      const secs = state.remainingSeconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    isStudentAttended: (state): boolean => {
      if (!state.sessionOverview || !state.studentSummary) return false
      return state.studentSummary.sessionLogs.some(
        l => l.sessionId === state.sessionOverview?.sessionId && ['PRESENT', 'LATE'].includes(l.status)
      )
    },

    currentStudentSessionLog: (state) => {
      if (!state.sessionOverview || !state.studentSummary) return null
      return state.studentSummary.sessionLogs.find(
        l => l.sessionId === state.sessionOverview?.sessionId
      ) || null
    }
  },

  actions: {
    clearTimer() {
      if (this.timerId) {
        clearInterval(this.timerId)
        this.timerId = null
      }
    },

    startCountdown(seconds: number) {
      this.clearTimer()
      this.remainingSeconds = Math.max(0, seconds)

      if (this.remainingSeconds > 0) {
        this.timerId = setInterval(() => {
          if (this.remainingSeconds > 1) {
            this.remainingSeconds--
          } else {
            this.remainingSeconds = 0
            if (this.activeToken) {
              this.activeToken.isActive = false
            }
            this.clearTimer()
          }
        }, 1000)
      }
    },

    /**
     * Memuat ikhtisar presensi sesi tertentu (Dosen / Mahasiswa)
     */
    async fetchSessionOverview(sessionId: string, classId?: string): Promise<SessionAttendanceOverviewDto | null> {
      this.isLoading = true
      this.error = null

      try {
        const query = classId ? { classId } : {}
        const response = await $fetch<ApiResponse<SessionAttendanceOverviewDto>>(
          `/api/attendance/sessions/${sessionId}`,
          { query }
        )

        if (response.success && response.data) {
          this.sessionOverview = response.data
          this.activeToken = response.data.activeToken

          if (this.activeToken?.remainingSeconds && this.activeToken.remainingSeconds > 0) {
            this.startCountdown(this.activeToken.remainingSeconds)
          } else {
            this.clearTimer()
            this.remainingSeconds = 0
          }

          return response.data
        }
        return null
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Gagal memuat ikhtisar presensi'
        this.error = message
        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Memuat ringkasan presensi mahasiswa pada kelas aktif (Persentase 16 sesi & Kelayakan UAS >= 75%)
     */
    async fetchStudentSummary(classId: string, studentId?: string): Promise<StudentAttendanceSummaryDto | null> {
      try {
        const query = studentId ? { studentId } : {}
        const response = await $fetch<ApiResponse<StudentAttendanceSummaryDto>>(
          `/api/attendance/classes/${classId}/summary`,
          { query }
        )

        if (response.success && response.data) {
          this.studentSummary = response.data
          return response.data
        }
        return null
      } catch (err: any) {
        console.warn('[AttendanceStore] Gagal mengambil summary presensi mahasiswa:', err.data?.message || err.message)
        return null
      }
    },

    /**
     * Dosen: Membuka sesi presensi dengan token PIN 6-digit & QR code dinamis
     */
    async openSession(sessionId: string, durationMinutes: number = 15): Promise<AttendanceTokenDto | null> {
      this.isOpeningSession = true
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<AttendanceTokenDto>>('/api/attendance/open', {
          method: 'POST',
          body: { sessionId, durationMinutes }
        })

        if (response.success && response.data) {
          this.activeToken = response.data
          this.startCountdown(response.data.remainingSeconds || durationMinutes * 60)
          this.feedback = `Sesi presensi aktif! PIN: ${response.data.formattedToken}`

          // Segera perbarui ikhtisar sesi
          if (this.sessionOverview) {
            this.sessionOverview.activeToken = response.data
          }
          return response.data
        }
        return null
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Gagal membuka sesi presensi'
        this.error = message
        throw new Error(message)
      } finally {
        this.isOpeningSession = false
      }
    },

    /**
     * Dosen: Menutup sesi presensi lebih awal
     */
    async closeSession(sessionId: string): Promise<boolean> {
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<{ success: boolean; message: string }>>('/api/attendance/close', {
          method: 'POST',
          body: { sessionId }
        })

        if (response.success) {
          this.activeToken = null
          this.clearTimer()
          this.remainingSeconds = 0
          this.feedback = 'Sesi presensi berhasil ditutup'

          if (this.sessionOverview) {
            this.sessionOverview.activeToken = null
          }
          return true
        }
        return false
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Gagal menutup sesi presensi'
        this.error = message
        throw new Error(message)
      }
    },

    /**
     * Mahasiswa: Melakukan check-in presensi secara real-time
     */
    async checkIn(token: string, sessionId?: string): Promise<{ success: boolean; message: string }> {
      this.isCheckingIn = true
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<{ log: any; summary: StudentAttendanceSummaryDto }>>(
          '/api/attendance/check-in',
          {
            method: 'POST',
            body: {
              token: token.trim().replace('-', ''),
              sessionId,
              deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'Web Client'
            }
          }
        )

        if (response.success && response.data) {
          this.studentSummary = response.data.summary
          this.feedback = `Presensi berhasil dicatat! Status: ${response.data.log.status}`

          // Refresh session overview jika ada
          if (sessionId) {
            await this.fetchSessionOverview(sessionId)
          }

          return { success: true, message: this.feedback }
        }

        return { success: false, message: response.message || 'Presensi gagal diproses' }
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Presensi gagal. Pastikan token benar dan sesi masih aktif'
        this.error = message
        throw new Error(message)
      } finally {
        this.isCheckingIn = false
      }
    },

    /**
     * Dosen: Mengubah status presensi mahasiswa secara manual
     */
    async manualUpdate(sessionId: string, studentId: string, status: AttendanceStatus, notes?: string): Promise<boolean> {
      try {
        const response = await $fetch<ApiResponse<any>>('/api/attendance/manual', {
          method: 'POST',
          body: {
            sessionId,
            studentId,
            status,
            notes
          }
        })

        if (response.success) {
          this.feedback = `Status presensi mahasiswa berhasil diubah ke ${status}`
          await this.fetchSessionOverview(sessionId)
          return true
        }
        return false
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Gagal memperbarui status presensi'
        this.error = message
        throw new Error(message)
      }
    }
  }
})
