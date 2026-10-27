import { defineStore } from 'pinia'
import type {
  AcademicTermDto,
  CourseClassDto,
  CourseClassDetailDto,
  ClassSessionDto,
  GradeWeightDto,
  ApiResponse
} from '~/types'

interface AcademicState {
  activeTerm: AcademicTermDto | null
  classes: CourseClassDto[]
  selectedClassId: string | null
  selectedClassDetail: CourseClassDetailDto | null
  selectedSessionNumber: number
  isLoading: boolean
  isDetailLoading: boolean
  error: string | null
}

export const useAcademicStore = defineStore('academic', {
  state: (): AcademicState => ({
    activeTerm: null,
    classes: [],
    selectedClassId: null,
    selectedClassDetail: null,
    selectedSessionNumber: 1,
    isLoading: false,
    isDetailLoading: false,
    error: null
  }),

  getters: {
    selectedClass: (state): CourseClassDto | null => {
      if (!state.selectedClassId) return null
      return state.classes.find(c => c.id === state.selectedClassId) || state.selectedClassDetail
    },

    sessions: (state): ClassSessionDto[] => {
      return state.selectedClassDetail?.sessions || []
    },

    selectedSession: (state): ClassSessionDto | null => {
      if (!state.selectedClassDetail?.sessions) return null
      return (
        state.selectedClassDetail.sessions.find(s => s.sessionNumber === state.selectedSessionNumber) ||
        state.selectedClassDetail.sessions[0] ||
        null
      )
    },

    gradeWeights: (state): GradeWeightDto[] => {
      return state.selectedClassDetail?.gradeWeights || []
    },

    midtermSession: (state): ClassSessionDto | null => {
      return state.selectedClassDetail?.sessions.find(s => s.sessionNumber === 8) || null
    },

    finalExamSession: (state): ClassSessionDto | null => {
      return state.selectedClassDetail?.sessions.find(s => s.sessionNumber === 16) || null
    },

    totalWeight: (state): number => {
      if (!state.selectedClassDetail?.gradeWeights) return 0
      return state.selectedClassDetail.gradeWeights.reduce(
        (sum, w) => sum + parseFloat(w.weightPercentage || '0'),
        0
      )
    }
  },

  actions: {
    /**
     * Memuat Semester / Tahun Akademik Aktif dari API
     */
    async fetchActiveTerm(): Promise<AcademicTermDto | null> {
      try {
        const response = await $fetch<ApiResponse<AcademicTermDto[]>>('/api/academic-terms')
        if (response.success && response.data) {
          const active = response.data.find(t => t.isActive) || response.data[0] || null
          this.activeTerm = active
          return active
        }
        return null
      } catch (err: unknown) {
        console.error('[AcademicStore] Failed to fetch active term:', err)
        return null
      }
    },

    /**
     * Memuat daftar Kelas Paralel untuk semester aktif
     */
    async fetchClasses(termId?: string): Promise<CourseClassDto[]> {
      this.isLoading = true
      this.error = null

      try {
        const targetTermId = termId || this.activeTerm?.id
        const url = targetTermId ? `/api/classes?academicTermId=${targetTermId}` : '/api/classes'
        const response = await $fetch<ApiResponse<CourseClassDto[]>>(url)

        if (response.success && response.data) {
          this.classes = response.data
          return response.data
        }
        this.classes = []
        return []
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal memuat daftar kelas perkuliahan'
        this.error = message
        console.error('[AcademicStore] Failed to fetch classes:', err)
        return []
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Mengambil detail lengkap kelas (16 sesi pertemuan + bobot nilai)
     */
    async fetchClassDetail(classId: string): Promise<CourseClassDetailDto | null> {
      if (!classId) return null
      this.isDetailLoading = true

      try {
        const response = await $fetch<ApiResponse<CourseClassDetailDto>>(`/api/classes/${classId}`)
        if (response.success && response.data) {
          this.selectedClassDetail = response.data
          this.selectedClassId = classId
          return response.data
        }
        return null
      } catch (err: unknown) {
        console.error('[AcademicStore] Failed to fetch class detail:', err)
        return null
      } finally {
        this.isDetailLoading = false
      }
    },

    /**
     * Memilih kelas aktif dan memuat detail 16 pertemuannya
     */
    async selectClass(classId: string): Promise<void> {
      if (this.selectedClassId === classId && this.selectedClassDetail) {
        return
      }
      this.selectedClassId = classId
      await this.fetchClassDetail(classId)
      this.selectedSessionNumber = 1
    },

    /**
     * Mengubah sesi pertemuan aktif di zona tengah
     */
    selectSession(sessionNumber: number): void {
      if (sessionNumber >= 1 && sessionNumber <= 16) {
        this.selectedSessionNumber = sessionNumber
      }
    },

    /**
     * Inisialisasi awal seluruh data akademis workspace
     */
    async initWorkspace(): Promise<void> {
      this.isLoading = true
      try {
        const term = await this.fetchActiveTerm()
        const classes = await this.fetchClasses(term?.id)
        if (classes.length > 0) {
          // Pilih kelas pertama secara default jika belum ada yang dipilih
          const targetId = this.selectedClassId && classes.some(c => c.id === this.selectedClassId)
            ? this.selectedClassId
            : classes[0].id
          await this.selectClass(targetId)
        }
      } finally {
        this.isLoading = false
      }
    }
  }
})
