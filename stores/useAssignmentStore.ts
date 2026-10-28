import { defineStore } from 'pinia'
import type {
  AssignmentDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmissionDto,
  AssignmentSubmissionOverviewDto,
  PresignedUploadResponseDto,
  ApiResponse
} from '~/types'

interface AssignmentStoreState {
  assignments: AssignmentDto[]
  selectedAssignment: AssignmentDto | null
  currentOverview: AssignmentSubmissionOverviewDto | null
  isLoading: boolean
  isSubmitting: boolean
  isCreating: boolean
  error: string | null
  feedback: string | null
}

export const useAssignmentStore = defineStore('assignment', {
  state: (): AssignmentStoreState => ({
    assignments: [],
    selectedAssignment: null,
    currentOverview: null,
    isLoading: false,
    isSubmitting: false,
    isCreating: false,
    error: null,
    feedback: null
  }),

  actions: {
    /**
     * Memuat daftar tugas perkuliahan untuk sesi pertemuan tertentu
     */
    async fetchSessionAssignments(sessionId: string): Promise<AssignmentDto[]> {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<ApiResponse<AssignmentDto[]>>(
          `/api/sessions/${sessionId}/assignments`
        )

        if (response.success && response.data) {
          this.assignments = response.data
          return response.data
        }
        this.assignments = []
        return []
      } catch (err: any) {
        console.warn('[AssignmentStore] Gagal memuat tugas sesi:', err)
        this.assignments = []
        return []
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Dosen: Membuat tugas baru untuk sebuah sesi perkuliahan
     */
    async createAssignment(dto: CreateAssignmentDto): Promise<AssignmentDto> {
      this.isCreating = true
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<AssignmentDto>>('/api/assignments', {
          method: 'POST',
          body: dto
        })

        if (response.success && response.data) {
          this.feedback = `Tugas '${response.data.title}' berhasil dibuat!`
          if (dto.sessionId) {
            await this.fetchSessionAssignments(dto.sessionId)
          }
          return response.data
        }
        throw new Error(response.message || 'Gagal membuat tugas')
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Gagal membuat tugas'
        this.error = message
        throw new Error(message)
      } finally {
        this.isCreating = false
      }
    },

    /**
     * Dosen: Menghapus tugas
     */
    async deleteAssignment(assignmentId: string, sessionId?: string): Promise<boolean> {
      try {
        const response = await $fetch<ApiResponse<{ success: boolean }>>(
          `/api/assignments/${assignmentId}`,
          { method: 'DELETE' }
        )

        if (response.success) {
          this.assignments = this.assignments.filter(a => a.id !== assignmentId)
          if (sessionId) {
            await this.fetchSessionAssignments(sessionId)
          }
          return true
        }
        return false
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Gagal menghapus tugas'
        this.error = message
        throw new Error(message)
      }
    },

    /**
     * Mahasiswa: Mengunggah berkas tugas (PDF/ZIP) melalui Presigned URL & Submit
     * Memvalidasi Strict Server-Side Timestamp:
     * - Menolak jika waktu server melewati cutoff_date
     * - Menandai Tepat Waktu (#16A34A) atau Terlambat (#DC2626)
     */
    async submitAssignmentFile(
      assignmentId: string,
      file: File,
      notes?: string
    ): Promise<SubmissionDto> {
      this.isSubmitting = true
      this.error = null
      this.feedback = null

      try {
        // 1. Request Presigned Upload URL ke server (validasi cutoff_date & tipe file server-side)
        const presignedRes = await $fetch<ApiResponse<PresignedUploadResponseDto>>(
          `/api/assignments/${assignmentId}/upload-url`,
          {
            method: 'POST',
            body: {
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size
            }
          }
        )

        if (!presignedRes.success || !presignedRes.data) {
          throw new Error(presignedRes.message || 'Gagal mendapatkan presigned upload URL')
        }

        const presigned = presignedRes.data

        // 2. Upload file biner langsung ke Storage (R2 S3 / Local Storage Fallback)
        const uploadHeaders: Record<string, string> = {
          'Content-Type': file.type || 'application/octet-stream'
        }

        const uploadRes = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: uploadHeaders,
          body: file
        })

        if (!uploadRes.ok) {
          throw new Error(
            `Gagal mengunggah berkas ke storage (${uploadRes.status}: ${uploadRes.statusText})`
          )
        }

        // 3. Rekam Submission di Database dengan Strict Server-Side Timestamp Validation
        const submitRes = await $fetch<ApiResponse<SubmissionDto>>(
          `/api/assignments/${assignmentId}/submissions`,
          {
            method: 'POST',
            body: {
              assignmentId,
              fileKey: presigned.fileKey,
              fileUrl: presigned.signedReadUrl,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              contentText: notes || null
            }
          }
        )

        if (submitRes.success && submitRes.data) {
          this.feedback = submitRes.message || 'Tugas berhasil dikumpulkan'

          // Perbarui data tugas lokal jika ada
          const foundIndex = this.assignments.findIndex(a => a.id === assignmentId)
          if (foundIndex !== -1) {
            this.assignments[foundIndex].mySubmission = submitRes.data
          }

          return submitRes.data
        }

        throw new Error(submitRes.message || 'Gagal mencatat pengumpulan tugas')
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Pengumpulan tugas gagal'
        this.error = message
        throw new Error(message)
      } finally {
        this.isSubmitting = false
      }
    },

    /**
     * Dosen: Mengambil rekap seluruh pengumpulan mahasiswa untuk sebuah tugas
     */
    async fetchAssignmentOverview(assignmentId: string): Promise<AssignmentSubmissionOverviewDto | null> {
      try {
        const response = await $fetch<ApiResponse<AssignmentSubmissionOverviewDto>>(
          `/api/assignments/${assignmentId}/submissions`
        )

        if (response.success && response.data) {
          this.currentOverview = response.data
          return response.data
        }
        return null
      } catch (err: any) {
        console.warn('[AssignmentStore] Gagal mengambil overview tugas:', err)
        return null
      }
    },

    /**
     * Dosen: Menilai pengumpulan tugas mahasiswa
     */
    async gradeSubmission(
      submissionId: string,
      score: number,
      feedback?: string,
      assignmentId?: string
    ): Promise<boolean> {
      try {
        const response = await $fetch<ApiResponse<SubmissionDto>>(
          `/api/submissions/${submissionId}/grade`,
          {
            method: 'PUT',
            body: { score, feedback }
          }
        )

        if (response.success) {
          if (assignmentId) {
            await this.fetchAssignmentOverview(assignmentId)
          }
          return true
        }
        return false
      } catch (err: any) {
        const message = err.data?.message || err.message || 'Gagal menyimpan nilai'
        this.error = message
        throw new Error(message)
      }
    }
  }
})
