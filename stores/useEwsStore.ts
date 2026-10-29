import { defineStore } from 'pinia'
import type {
  ClassEwsOverviewDto,
  DepartmentEwsSummaryDto,
  StudentEwsProfileDto,
  EwsRiskLevel,
  ApiResponse
} from '~/types'

interface EwsStoreState {
  classEws: ClassEwsOverviewDto | null
  departmentSummary: DepartmentEwsSummaryDto | null
  myStudentEws: StudentEwsProfileDto | null
  selectedStudentProfile: StudentEwsProfileDto | null
  isLoading: boolean
  isMyEwsLoading: boolean
  error: string | null
  activeRiskFilter: 'ALL' | 'CRITICAL' | 'WARNING' | 'SAFE'
  searchQuery: string
}

export const useEwsStore = defineStore('ews', {
  state: (): EwsStoreState => ({
    classEws: null,
    departmentSummary: null,
    myStudentEws: null,
    selectedStudentProfile: null,
    isLoading: false,
    isMyEwsLoading: false,
    error: null,
    activeRiskFilter: 'ALL',
    searchQuery: ''
  }),

  getters: {
    criticalStudents: (state): StudentEwsProfileDto[] =>
      state.classEws?.students.filter((s) => s.overallRiskLevel === 'CRITICAL') || [],

    warningStudents: (state): StudentEwsProfileDto[] =>
      state.classEws?.students.filter((s) => s.overallRiskLevel === 'WARNING') || [],

    safeStudents: (state): StudentEwsProfileDto[] =>
      state.classEws?.students.filter((s) => s.overallRiskLevel === 'SAFE') || [],

    filteredStudents: (state): StudentEwsProfileDto[] => {
      let list = state.classEws?.students || []

      if (state.activeRiskFilter !== 'ALL') {
        list = list.filter((s) => s.overallRiskLevel === state.activeRiskFilter)
      }

      if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase().trim()
        list = list.filter(
          (s) =>
            s.studentName.toLowerCase().includes(q) ||
            (s.studentNim && s.studentNim.toLowerCase().includes(q))
        )
      }

      return list
    },

    totalStudents: (state): number => state.classEws?.totalEnrolledStudents || 0,
    criticalCount: (state): number => state.classEws?.criticalStudentsCount || 0,
    warningCount: (state): number => state.classEws?.warningStudentsCount || 0,
    safeCount: (state): number => state.classEws?.safeStudentsCount || 0,
    atRiskPercentage: (state): number => state.classEws?.riskSummary.atRiskPercentage || 0,
    averageCompositeRisk: (state): number => state.classEws?.riskSummary.averageCompositeRisk || 0,
    classInterventions: (state): string[] => state.classEws?.recommendedClassInterventions || [],

    isStudentAtRisk: (state): boolean => {
      if (!state.myStudentEws) return false
      return (
        state.myStudentEws.overallRiskLevel === 'CRITICAL' ||
        state.myStudentEws.overallRiskLevel === 'WARNING' ||
        state.myStudentEws.attendance.isDisqualified ||
        state.myStudentEws.attendance.isNearThreshold ||
        state.myStudentEws.assignments.missingCount > 0 ||
        state.myStudentEws.exams.isBelowPassingStandard
      )
    }
  },

  actions: {
    /**
     * Memuat analisis telemetri EWS lengkap untuk satu kelas perkuliahan (Dosen/Admin)
     */
    async fetchClassEws(classId: string) {
      if (!classId) return
      this.isLoading = true
      this.error = null

      try {
        const res = await $fetch<ApiResponse<ClassEwsOverviewDto>>(
          `/api/analytics/ews/classes/${classId}`
        )
        if (res.success && res.data) {
          this.classEws = res.data
        }
      } catch (err: any) {
        this.error = err?.data?.message || err?.message || 'Gagal memuat telemetri EWS kelas'
        console.error('[useEwsStore] Error fetchClassEws:', err)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Memuat ringkasan EWS tingkat departemen / program studi
     */
    async fetchDepartmentSummary() {
      this.isLoading = true
      this.error = null

      try {
        const res = await $fetch<ApiResponse<DepartmentEwsSummaryDto>>('/api/analytics/ews/overview')
        if (res.success && res.data) {
          this.departmentSummary = res.data
        }
      } catch (err: any) {
        this.error = err?.data?.message || err?.message || 'Gagal memuat ringkasan EWS departemen'
        console.error('[useEwsStore] Error fetchDepartmentSummary:', err)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Memuat profil telemetri EWS personal mahasiswa yang sedang login
     */
    async fetchMyStudentEws(classId: string, studentId: string) {
      if (!classId || !studentId) return
      this.isMyEwsLoading = true

      try {
        const res = await $fetch<ApiResponse<StudentEwsProfileDto>>(
          `/api/analytics/ews/classes/${classId}/students/${studentId}`
        )
        if (res.success && res.data) {
          this.myStudentEws = res.data
        }
      } catch (err) {
        console.warn('[useEwsStore] Catatan: Mahasiswa belum memiliki data telemetri EWS aktif:', err)
      } finally {
        this.isMyEwsLoading = false
      }
    },

    /**
     * Memuat profil telemetri detail seorang mahasiswa untuk modal intervensi dosen
     */
    async fetchStudentDetail(classId: string, studentId: string): Promise<StudentEwsProfileDto | null> {
      try {
        const res = await $fetch<ApiResponse<StudentEwsProfileDto>>(
          `/api/analytics/ews/classes/${classId}/students/${studentId}`
        )
        if (res.success && res.data) {
          this.selectedStudentProfile = res.data
          return res.data
        }
        return null
      } catch (err) {
        console.error('[useEwsStore] Error fetchStudentDetail:', err)
        return null
      }
    },

    setRiskFilter(filter: 'ALL' | 'CRITICAL' | 'WARNING' | 'SAFE') {
      this.activeRiskFilter = filter
    },

    setSearchQuery(q: string) {
      this.searchQuery = q
    }
  }
})
