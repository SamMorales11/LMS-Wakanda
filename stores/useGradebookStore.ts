import { defineStore } from 'pinia'
import type {
  ClassGradebookDto,
  StudentGradeBreakdownDto,
  GradeWeightItemDto,
  ConfigureGradeWeightsDto,
  ManualGradeAdjustmentDto,
  GradeAuditLogDto,
  GradeStatus,
  ApiResponse
} from '~/types'

interface GradebookStoreState {
  gradebook: ClassGradebookDto | null
  myGrade: StudentGradeBreakdownDto | null
  auditLogs: GradeAuditLogDto[]
  isLoading: boolean
  isCalculating: boolean
  isSavingWeights: boolean
  isAdjusting: boolean
  isUpdatingStatus: boolean
  error: string | null
  feedback: string | null
}

export const useGradebookStore = defineStore('gradebook', {
  state: (): GradebookStoreState => ({
    gradebook: null,
    myGrade: null,
    auditLogs: [],
    isLoading: false,
    isCalculating: false,
    isSavingWeights: false,
    isAdjusting: false,
    isUpdatingStatus: false,
    error: null,
    feedback: null
  }),

  getters: {
    weights: (state): GradeWeightItemDto[] => {
      return state.gradebook?.weights || []
    },

    totalStudents: (state): number => state.gradebook?.totalStudents || 0,

    classAverage: (state): number | null => state.gradebook?.averageFinalScore ?? null,

    gradeDistribution: (state) => state.gradebook?.gradeDistribution || {
      A: 0,
      AB: 0,
      B: 0,
      BC: 0,
      C: 0,
      D: 0,
      E: 0
    },

    isAttendanceEligible: (state): boolean => {
      return state.myGrade ? state.myGrade.attendance.isEligible : true
    }
  },

  actions: {
    /**
     * Dosen: Memuat seluruh data Gradebook kelas
     */
    async fetchClassGradebook(classId: string): Promise<ClassGradebookDto | null> {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<ClassGradebookDto>>(
          `/api/gradebook/classes/${classId}`
        )
        if (response.success && response.data) {
          this.gradebook = response.data
          return response.data
        }
        return null
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal memuat Gradebook kelas'
        this.error = msg
        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Mahasiswa: Memuat rincian evaluasi akademik & transparansi nilai sendiri
     */
    async fetchMyGrade(classId: string): Promise<StudentGradeBreakdownDto | null> {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<StudentGradeBreakdownDto>>(
          `/api/gradebook/classes/${classId}/my-grade`
        )
        if (response.success && response.data) {
          this.myGrade = response.data
          return response.data
        }
        return null
      } catch (err: any) {
        console.warn('[GradebookStore] Gagal memuat nilai mahasiswa:', err)
        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Dosen: Konfigurasi bobot komponen penilaian kelas (total 100%)
     */
    async updateWeights(classId: string, weights: GradeWeightItemDto[]): Promise<GradeWeightItemDto[]> {
      this.isSavingWeights = true
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<GradeWeightItemDto[]>>(
          `/api/gradebook/classes/${classId}/weights`,
          {
            method: 'PUT',
            body: { weights } as ConfigureGradeWeightsDto
          }
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Gagal menyimpan bobot penilaian')
        }

        this.feedback = 'Bobot penilaian kelas berhasil diperbarui dan diselaraskan ke 100%'
        // Refresh gradebook
        await this.fetchClassGradebook(classId)
        return response.data
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal menyimpan bobot penilaian'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.isSavingWeights = false
      }
    },

    /**
     * Dosen: Menjalankan kalkulasi massal Nilai Akhir (NA) dan huruf mutu
     */
    async calculateGradebook(classId: string): Promise<ClassGradebookDto> {
      this.isCalculating = true
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<ClassGradebookDto>>(
          `/api/gradebook/classes/${classId}/calculate`,
          { method: 'POST' }
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Gagal menjalankan kalkulasi nilai kelas')
        }

        this.gradebook = response.data
        this.feedback = 'Kalkulasi Nilai Akhir (NA) berhasil diperbarui dan disimpan ke database'
        return response.data
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal kalkulasi nilai'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.isCalculating = false
      }
    },

    /**
     * Dosen: Penyesuaian nilai manual per mahasiswa lengkap dengan alasan audit log
     */
    async adjustGrade(classId: string, dto: ManualGradeAdjustmentDto): Promise<void> {
      this.isAdjusting = true
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<any>>(
          `/api/gradebook/classes/${classId}/adjust`,
          {
            method: 'PUT',
            body: dto
          }
        )

        if (!response.success) {
          throw new Error(response.message || 'Gagal melakukan penyesuaian nilai')
        }

        this.feedback = response.message || 'Penyesuaian nilai berhasil dicatat ke audit log'
        // Refresh gradebook
        await this.fetchClassGradebook(classId)
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal menyesuaikan nilai'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.isAdjusting = false
      }
    },

    /**
     * Dosen: Memuat riwayat jejak audit perubahan nilai
     */
    async fetchAuditLogs(classId: string): Promise<GradeAuditLogDto[]> {
      try {
        const response = await $fetch<ApiResponse<GradeAuditLogDto[]>>(
          `/api/gradebook/classes/${classId}/audit-logs`
        )
        if (response.success && response.data) {
          this.auditLogs = response.data
          return response.data
        }
        return []
      } catch (err) {
        console.warn('[GradebookStore] Gagal memuat audit log:', err)
        return []
      }
    },

    /**
     * Dosen: Memperbarui status publikasi nilai kelas
     */
    async updateGradeStatus(classId: string, status: GradeStatus): Promise<void> {
      this.isUpdatingStatus = true
      this.error = null

      try {
        const response = await $fetch<ApiResponse<any>>(
          `/api/gradebook/classes/${classId}/status`,
          {
            method: 'PUT',
            body: { status }
          }
        )

        if (!response.success) {
          throw new Error(response.message || 'Gagal memperbarui status nilai')
        }

        this.feedback = `Status nilai kelas berhasil diperbarui menjadi ${status}`
        await this.fetchClassGradebook(classId)
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal mengubah status nilai'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.isUpdatingStatus = false
      }
    }
  }
})
