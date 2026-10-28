import { defineStore } from 'pinia'
import type {
  QuizDto,
  QuizSessionStateDto,
  QuizSessionQuestionItem,
  QuizAttemptDto,
  ApiResponse,
  AutoSaveResponseDto
} from '~/types'

interface LocalAnswerItem {
  questionId: string
  selectedOptionId?: string | null
  essayAnswer?: string | null
  isDoubtful: boolean
}

interface QuizStoreState {
  sessionQuizzes: QuizDto[]
  activeSession: QuizSessionStateDto | null
  currentQuestionIndex: number
  localAnswers: Record<string, LocalAnswerItem>
  remainingSeconds: number
  isExamOpen: boolean
  isSubmitting: boolean
  isAutoSaving: boolean
  lastSavedAt: string | null
  examResult: QuizAttemptDto | null
  isLoading: boolean
  error: string | null
  feedback: string | null
}

export const useQuizStore = defineStore('quiz', {
  state: (): QuizStoreState => ({
    sessionQuizzes: [],
    activeSession: null,
    currentQuestionIndex: 0,
    localAnswers: {},
    remainingSeconds: 0,
    isExamOpen: false,
    isSubmitting: false,
    isAutoSaving: false,
    lastSavedAt: null,
    examResult: null,
    isLoading: false,
    error: null,
    feedback: null
  }),

  getters: {
    totalQuestions: (state): number => state.activeSession?.questions.length || 0,

    currentQuestion: (state): QuizSessionQuestionItem | null => {
      if (!state.activeSession?.questions || state.activeSession.questions.length === 0) return null
      return state.activeSession.questions[state.currentQuestionIndex] || null
    },

    answeredCount: (state): number => {
      return Object.values(state.localAnswers).filter((ans) => {
        return (
          (ans.selectedOptionId !== null && ans.selectedOptionId !== undefined && ans.selectedOptionId !== '') ||
          (ans.essayAnswer !== null && ans.essayAnswer !== undefined && ans.essayAnswer.trim() !== '')
        )
      }).length
    },

    doubtfulCount: (state): number => {
      return Object.values(state.localAnswers).filter((ans) => ans.isDoubtful).length
    },

    formattedRemainingTime: (state): string => {
      const totalSec = Math.max(0, state.remainingSeconds)
      const hours = Math.floor(totalSec / 3600)
      const minutes = Math.floor((totalSec % 3600) / 60)
      const seconds = totalSec % 60

      if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    },

    isTimeUrgent: (state): boolean => {
      return state.remainingSeconds > 0 && state.remainingSeconds <= 300 // 5 minutes or less
    },

    isTimeExpired: (state): boolean => {
      return state.activeSession !== null && state.remainingSeconds <= 0
    }
  },

  actions: {
    /**
     * Memuat daftar ujian untuk sebuah sesi perkuliahan
     */
    async fetchSessionQuizzes(sessionId: string): Promise<QuizDto[]> {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<QuizDto[]>>(`/api/sessions/${sessionId}/quizzes`)
        if (response.success && response.data) {
          this.sessionQuizzes = response.data
          return response.data
        }
        this.sessionQuizzes = []
        return []
      } catch (err: any) {
        console.warn('[QuizStore] Gagal memuat kuis sesi:', err)
        this.sessionQuizzes = []
        return []
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Memulai atau melanjutkan sesi pengerjaan ujian daring
     */
    async initiateExam(quizId: string): Promise<QuizSessionStateDto> {
      this.isLoading = true
      this.error = null
      this.examResult = null

      try {
        const response = await $fetch<ApiResponse<QuizSessionStateDto>>(`/api/quizzes/${quizId}/initiate`, {
          method: 'POST'
        })

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Gagal memulai sesi pengerjaan ujian')
        }

        const session = response.data
        this.activeSession = session
        this.remainingSeconds = session.remainingSeconds
        this.currentQuestionIndex = 0

        // Inisialisasi peta jawaban lokal
        const answersMap: Record<string, LocalAnswerItem> = {}
        for (const q of session.questions) {
          answersMap[q.id] = {
            questionId: q.id,
            selectedOptionId: q.currentAnswer?.selectedOptionId || null,
            essayAnswer: q.currentAnswer?.essayAnswer || '',
            isDoubtful: Boolean(q.currentAnswer?.isDoubtful)
          }
        }
        this.localAnswers = answersMap
        this.isExamOpen = true

        return session
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal memulai sesi ujian'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update jawaban pilihan ganda mahasiswa pada soal aktif
     */
    selectMcqOption(questionId: string, optionId: string) {
      if (!this.localAnswers[questionId]) {
        this.localAnswers[questionId] = {
          questionId,
          selectedOptionId: optionId,
          isDoubtful: false
        }
      } else {
        this.localAnswers[questionId].selectedOptionId = optionId
      }
    },

    /**
     * Update jawaban esai mahasiswa pada soal aktif
     */
    updateEssayAnswer(questionId: string, text: string) {
      if (!this.localAnswers[questionId]) {
        this.localAnswers[questionId] = {
          questionId,
          essayAnswer: text,
          isDoubtful: false
        }
      } else {
        this.localAnswers[questionId].essayAnswer = text
      }
    },

    /**
     * Menandai atau membatalkan status ragu-ragu pada butir soal
     */
    async toggleDoubtful(questionId: string) {
      if (!this.activeSession) return
      const current = this.localAnswers[questionId]
      const newDoubtfulState = current ? !current.isDoubtful : true

      if (!this.localAnswers[questionId]) {
        this.localAnswers[questionId] = {
          questionId,
          isDoubtful: newDoubtfulState
        }
      } else {
        this.localAnswers[questionId].isDoubtful = newDoubtfulState
      }

      try {
        await $fetch<ApiResponse<{ isDoubtful: boolean }>>(
          `/api/quizzes/attempts/${this.activeSession.attemptId}/doubtful`,
          {
            method: 'POST',
            body: {
              questionId,
              isDoubtful: newDoubtfulState
            }
          }
        )
      } catch (err) {
        console.warn('[QuizStore] Gagal sinkronisasi status ragu-ragu ke server:', err)
      }
    },

    /**
     * Auto-save berkala atau saat beralih butir soal
     */
    async autoSaveAll(): Promise<void> {
      if (!this.activeSession || this.isSubmitting) return

      this.isAutoSaving = true
      try {
        const answersArray = Object.values(this.localAnswers).map((a) => ({
          questionId: a.questionId,
          selectedOptionId: a.selectedOptionId || undefined,
          essayAnswer: a.essayAnswer || undefined,
          isDoubtful: a.isDoubtful
        }))

        const res = await $fetch<ApiResponse<AutoSaveResponseDto>>(
          `/api/quizzes/attempts/${this.activeSession.attemptId}/auto-save`,
          {
            method: 'POST',
            body: { answers: answersArray }
          }
        )

        if (res.success && res.data) {
          this.remainingSeconds = res.data.remainingSeconds
          this.lastSavedAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          if (res.data.isExpired) {
            await this.submitFinalExam(true)
          }
        }
      } catch (err) {
        console.warn('[QuizStore] Auto-save error:', err)
      } finally {
        this.isAutoSaving = false
      }
    },

    /**
     * Navigasi ke nomor soal tertentu
     */
    goToQuestion(index: number) {
      if (index >= 0 && index < this.totalQuestions) {
        this.currentQuestionIndex = index
      }
    },

    nextQuestion() {
      if (this.currentQuestionIndex < this.totalQuestions - 1) {
        this.currentQuestionIndex++
      }
    },

    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
      }
    },

    /**
     * Mengumpulkan jawaban akhir ujian (Final Submit)
     */
    async submitFinalExam(isTimedOut = false): Promise<QuizAttemptDto> {
      if (!this.activeSession) {
        throw new Error('Tidak ada sesi ujian yang sedang aktif')
      }

      this.isSubmitting = true
      this.error = null

      try {
        const answersPayload = Object.values(this.localAnswers).map((a) => ({
          questionId: a.questionId,
          selectedOptionId: a.selectedOptionId || null,
          essayAnswer: a.essayAnswer || null,
          isDoubtful: a.isDoubtful
        }))

        const response = await $fetch<ApiResponse<QuizAttemptDto>>(
          `/api/quizzes/attempts/${this.activeSession.attemptId}/submit`,
          {
            method: 'POST',
            body: { answers: answersPayload }
          }
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Gagal mengumpulkan lembar jawaban ujian')
        }

        this.examResult = response.data
        this.feedback = response.message || 'Ujian berhasil dikumpulkan'
        this.activeSession = null

        return response.data
      } catch (err: any) {
        const msg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal mengumpulkan ujian'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.isSubmitting = false
      }
    },

    /**
     * Menutup jendela ujian setelah melihat hasil
     */
    closeExam() {
      this.isExamOpen = false
      this.activeSession = null
      this.examResult = null
      this.remainingSeconds = 0
    },

    /**
     * Tick countdown satu detik (dipanggil oleh interval komponen)
     */
    tickSecond() {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--
      }
    }
  }
})
