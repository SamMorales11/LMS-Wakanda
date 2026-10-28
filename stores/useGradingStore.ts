import { defineStore } from 'pinia'
import type {
  CollectiveSubmissionsDto,
  GradingSubmissionItemDto,
  GradeSubmissionPayloadDto,
  CollectiveQuizAttemptsDto,
  GradingQuizAttemptItemDto,
  GradeEssayPayloadDto,
  ApiResponse
} from '~/types'

interface GradingStoreState {
  currentSubmissions: CollectiveSubmissionsDto | null
  currentQuizAttempts: CollectiveQuizAttemptsDto | null
  selectedSubmission: GradingSubmissionItemDto | null
  selectedAttempt: GradingQuizAttemptItemDto | null
  isLoading: boolean
  isGrading: boolean
  error: string | null
  feedback: string | null
}

export const useGradingStore = defineStore('grading', {
  state: (): GradingStoreState => ({
    currentSubmissions: null,
    currentQuizAttempts: null,
    selectedSubmission: null,
    selectedAttempt: null,
    isLoading: false,
    isGrading: false,
    error: null,
    feedback: null
  }),

  actions: {
    /**
     * Dosen: Memuat seluruh pengumpulan tugas mahasiswa beserta Signed Read URL
     */
    async fetchCollectiveSubmissions(assignmentId: string): Promise<CollectiveSubmissionsDto | null> {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<CollectiveSubmissionsDto>>(
          `/api/grading/assignments/${assignmentId}/submissions`
        )
        if (response.success && response.data) {
          this.currentSubmissions = response.data
          return response.data
        }
        return null
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal memuat berkas tugas'
        this.error = msg
        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Dosen: Memberikan nilai numerik (0-100), rubrik, dan catatan revisi pada pengumpulan tugas
     */
    async gradeSubmission(submissionId: string, payload: GradeSubmissionPayloadDto): Promise<void> {
      this.isGrading = true
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<any>>(
          `/api/grading/submissions/${submissionId}`,
          {
            method: 'PUT',
            body: payload
          }
        )

        if (!response.success) {
          throw new Error(response.message || 'Gagal menyimpan nilai tugas')
        }

        this.feedback = response.message || 'Nilai dan umpan balik tugas berhasil disimpan'

        // Perbarui item pada state lokal jika ada
        if (this.currentSubmissions) {
          const item = this.currentSubmissions.submissions.find((s) => s.submissionId === submissionId)
          if (item) {
            item.score = payload.score
            item.feedback = payload.feedback ?? null
            item.rubricFeedback = payload.rubricFeedback ?? null
            item.revisionNotes = payload.revisionNotes ?? null
            item.status = payload.status || 'GRADED'
          }
        }
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal menyimpan nilai'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.isGrading = false
      }
    },

    /**
     * Dosen: Memuat seluruh pengerjaan kuis/ujian mahasiswa
     */
    async fetchCollectiveQuizAttempts(quizId: string): Promise<CollectiveQuizAttemptsDto | null> {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<CollectiveQuizAttemptsDto>>(
          `/api/grading/quizzes/${quizId}/attempts`
        )
        if (response.success && response.data) {
          this.currentQuizAttempts = response.data
          return response.data
        }
        return null
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal memuat ujian'
        this.error = msg
        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Dosen: Memberikan nilai manual pada jawaban soal esai mahasiswa
     */
    async gradeQuizEssay(attemptId: string, payload: GradeEssayPayloadDto): Promise<void> {
      this.isGrading = true
      this.error = null
      this.feedback = null

      try {
        const response = await $fetch<ApiResponse<any>>(
          `/api/grading/quizzes/attempts/${attemptId}/essay`,
          {
            method: 'PUT',
            body: payload
          }
        )

        if (!response.success) {
          throw new Error(response.message || 'Gagal menilai soal esai')
        }

        this.feedback = 'Penilaian soal esai berhasil disimpan dan skor ujian diperbarui reaktif'

        // Perbarui item pada state lokal jika ada
        if (this.currentQuizAttempts) {
          const item = this.currentQuizAttempts.attempts.find((a) => a.attemptId === attemptId)
          if (item && response.data) {
            item.manualScore = response.data.manualScore
            item.totalScore = response.data.totalScore
            item.status = response.data.status
          }
        }
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal menilai esai'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.isGrading = false
      }
    }
  }
})
