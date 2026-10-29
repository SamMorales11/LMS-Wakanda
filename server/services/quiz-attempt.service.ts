import type {
  QuizSessionStateDto,
  QuizSessionQuestionItem,
  AutoSaveAnswerDto,
  AutoSaveResponseDto,
  QuizAttemptDto,
  QuizAttemptAnswer,
  QuizQuestion,
  QuizType,
  QuizQuestionStudentView
} from '~/types'
import { QuizRepository, type IQuizRepository } from '../repositories/quiz.repository'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} from '../utils/errors'
import { memoryCache, CacheKeys } from '../utils/cache'

export interface IQuizAttemptService {
  initiateOrResumeSession(quizId: string, studentId: string): Promise<QuizSessionStateDto>
  autoSaveAnswers(attemptId: string, answers: AutoSaveAnswerDto[], studentId: string): Promise<AutoSaveResponseDto>
  toggleDoubtful(attemptId: string, questionId: string, isDoubtful: boolean, studentId: string): Promise<{ questionId: string; isDoubtful: boolean; remainingSeconds: number }>
  autoCloseAttempt(attemptId: string, studentId?: string): Promise<QuizAttemptDto>
  submitExam(attemptId: string, answers: AutoSaveAnswerDto[] | undefined, studentId: string): Promise<QuizAttemptDto>
  getSessionState(attemptId: string, studentId: string): Promise<QuizSessionStateDto>
}

export class QuizAttemptService implements IQuizAttemptService {
  constructor(
    private readonly quizRepo: IQuizRepository = new QuizRepository()
  ) {}

  /**
   * Helper: Sanitasi soal ujian agar kunci jawaban dan rubrik tidak bocor ke siswa
   */
  private sanitizeQuestionForStudent(question: QuizQuestion): QuizQuestionStudentView {
    return {
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      points: question.points,
      options: question.options?.map(opt => ({
        id: opt.id,
        text: opt.text
      }))
    }
  }

  /**
   * Helper: Pengacakan urutan array menggunakan algoritma Fisher-Yates
   */
  private shuffleArray<T>(items: T[]): T[] {
    const array = [...items]
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
    return array
  }

  /**
   * 1. Inisiasi sesi ujian dengan batas waktu server (expires_at) atau resume sesi yang sedang aktif
   */
  public async initiateOrResumeSession(quizId: string, studentId: string): Promise<QuizSessionStateDto> {
    const quiz = await this.quizRepo.findById(quizId, true)
    if (!quiz) {
      throw new NotFoundError('Data master ujian tidak ditemukan')
    }

    if (!quiz.isPublished) {
      throw new ForbiddenError('Ujian ini belum dipublikasikan oleh dosen')
    }

    const now = Date.now()
    const startTimeMs = new Date(quiz.startTime).getTime()
    const endTimeMs = new Date(quiz.endTime).getTime()

    // Validasi jendela waktu akses ujian berbasis Strict Server-Side Timestamp
    if (now < startTimeMs) {
      const openDateStr = new Date(startTimeMs).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      throw new BadRequestError(`Ujian belum dibuka. Akses akan dibuka pada ${openDateStr} WIB`)
    }

    if (now > endTimeMs) {
      const closeDateStr = new Date(endTimeMs).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      throw new BadRequestError(`Jendela waktu akses ujian telah ditutup pada ${closeDateStr} WIB`)
    }

    const rawQuestions = quiz.questions || []
    if (rawQuestions.length === 0) {
      throw new BadRequestError('Bank soal ujian belum diisi oleh dosen pengampu')
    }

    // Cache bank soal master di in-memory cache untuk auto-save cepat (< 200 ms)
    memoryCache.set(CacheKeys.quizQuestions(quizId), rawQuestions, 3_600_000)

    const questionsMap = new Map<string, QuizQuestion>()
    for (const q of rawQuestions) {
      questionsMap.set(q.id, q)
    }

    // Cek apakah ada sesi pengerjaan aktif (IN_PROGRESS)
    const activeAttempt = await this.quizRepo.findActiveAttempt(quizId, studentId)

    if (activeAttempt) {
      const expiresAtMs = new Date(activeAttempt.expiresAt || activeAttempt.deadlineAt).getTime()

      // Jika waktu habis, lakukan penutupan otomatis (auto-close)
      if (now > expiresAtMs) {
        await this.autoCloseAttempt(activeAttempt.id, studentId)
        throw new BadRequestError('Waktu ujian Anda telah habis dan sesi pengerjaan telah ditutup secara otomatis.')
      }

      // Resume sesi aktif yang ada
      return this.buildSessionStateDto(activeAttempt, quiz.title, quiz.quizType, quiz.durationMinutes, questionsMap, expiresAtMs)
    }

    // Cek batas kuota percobaan pengerjaan (maxAttempts)
    const pastAttemptsCount = await this.quizRepo.countStudentAttempts(quizId, studentId)
    if (pastAttemptsCount >= quiz.maxAttempts) {
      throw new BadRequestError(`Anda telah mencapai batas maksimal pengerjaan ujian (${quiz.maxAttempts} kali percobaan)`)
    }

    // Inisiasi Percobaan Baru: Pengacakan urutan soal (Fisher-Yates)
    let questionOrder: string[] = []
    if (quiz.shuffleQuestions) {
      const shuffled = this.shuffleArray(rawQuestions)
      questionOrder = shuffled.map(q => q.id)
    } else {
      questionOrder = rawQuestions.map(q => q.id)
    }

    // Hitung batas waktu server ketat (expires_at) = min(now + duration, quiz.endTime)
    const durationMs = quiz.durationMinutes * 60 * 1000
    const calculatedExpiresMs = Math.min(now + durationMs, endTimeMs)
    const serverExpiresAt = new Date(calculatedExpiresMs)

    const newAttemptNumber = pastAttemptsCount + 1
    const newAttempt = await this.quizRepo.createAttempt(
      quizId,
      studentId,
      newAttemptNumber,
      questionOrder,
      serverExpiresAt
    )

    return this.buildSessionStateDto(newAttempt, quiz.title, quiz.quizType, quiz.durationMinutes, questionsMap, calculatedExpiresMs)
  }

  /**
   * 2. Mekanisme penyimpanan jawaban berkala (auto-save dan indikator ragu-ragu)
   */
  public async autoSaveAnswers(
    attemptId: string,
    answersToSave: AutoSaveAnswerDto[],
    studentId: string
  ): Promise<AutoSaveResponseDto> {
    const attempt = await this.quizRepo.findAttemptById(attemptId)
    if (!attempt) {
      throw new NotFoundError('Sesi ujian tidak ditemukan')
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki hak akses untuk menyimpan progres ujian ini')
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestError(`Sesi ujian tidak dalam status aktif (Status: ${attempt.status})`)
    }

    const now = Date.now()
    const expiresAtMs = new Date(attempt.expiresAt || attempt.deadlineAt).getTime()

    // Jika waktu server telah habis, langsung tutup ujian secara otomatis
    if (now > expiresAtMs) {
      await this.autoCloseAttempt(attemptId, studentId)
      return {
        attemptId,
        savedCount: 0,
        remainingSeconds: 0,
        expiresAt: new Date(expiresAtMs).toISOString(),
        isExpired: true,
        lastSavedAt: new Date().toISOString(),
        answers: []
      }
    }

    // Muat data master soal dari in-memory cache untuk ultra low latency (< 200 ms)
    const rawQuestions = await memoryCache.remember(
      CacheKeys.quizQuestions(attempt.quizId),
      3_600_000,
      async () => {
        const quiz = await this.quizRepo.findById(attempt.quizId, true)
        return quiz?.questions || []
      }
    )

    const questionsMap = new Map<string, QuizQuestion>()
    for (const q of rawQuestions) {
      questionsMap.set(q.id, q)
    }

    // Gabungkan jawaban yang ada dengan jawaban baru (Upsert / Auto-save merge)
    const existingAnswers = attempt.answers || []
    const answersMap = new Map<string, QuizAttemptAnswer>()
    for (const ans of existingAnswers) {
      answersMap.set(ans.questionId, { ...ans })
    }

    for (const item of answersToSave) {
      const q = questionsMap.get(item.questionId)
      if (!q) continue

      const prev = answersMap.get(item.questionId)
      answersMap.set(item.questionId, {
        questionId: item.questionId,
        questionType: q.type,
        selectedOptionId: item.selectedOptionId !== undefined ? item.selectedOptionId : (prev?.selectedOptionId || null),
        essayAnswer: item.essayAnswer !== undefined ? item.essayAnswer : (prev?.essayAnswer || null),
        isDoubtful: item.isDoubtful !== undefined ? item.isDoubtful : (prev?.isDoubtful || false),
        isCorrect: null,
        scoreAwarded: null,
        lecturerFeedback: null
      })
    }

    const mergedAnswersList = Array.from(answersMap.values())
    await this.quizRepo.updateProgressAnswers(attemptId, mergedAnswersList)

    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000))

    return {
      attemptId,
      savedCount: answersToSave.length,
      remainingSeconds,
      expiresAt: new Date(expiresAtMs).toISOString(),
      isExpired: false,
      lastSavedAt: new Date().toISOString(),
      answers: mergedAnswersList.map(a => ({
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        essayAnswer: a.essayAnswer,
        isDoubtful: !!a.isDoubtful
      }))
    }
  }

  /**
   * Mengubah status tanda ragu-ragu (doubtful) pada butir soal tertentu
   */
  public async toggleDoubtful(
    attemptId: string,
    questionId: string,
    isDoubtful: boolean,
    studentId: string
  ): Promise<{ questionId: string; isDoubtful: boolean; remainingSeconds: number }> {
    const res = await this.autoSaveAnswers(
      attemptId,
      [{ questionId, isDoubtful }],
      studentId
    )

    return {
      questionId,
      isDoubtful,
      remainingSeconds: res.remainingSeconds
    }
  }

  /**
   * 3. Penutupan ujian otomatis saat waktu habis (auto-close) dengan auto-grading instan
   */
  public async autoCloseAttempt(attemptId: string, studentId?: string): Promise<QuizAttemptDto> {
    const attempt = await this.quizRepo.findAttemptById(attemptId)
    if (!attempt) {
      throw new NotFoundError('Sesi ujian tidak ditemukan')
    }

    if (studentId && attempt.studentId !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki akses ke sesi ujian ini')
    }

    // Jika sudah diselesaikan atau ditutup sebelumnya, kembalikan langsung
    if (attempt.status !== 'IN_PROGRESS') {
      return attempt
    }

    const rawQuestions = await memoryCache.remember(
      CacheKeys.quizQuestions(attempt.quizId),
      3_600_000,
      async () => {
        const quiz = await this.quizRepo.findById(attempt.quizId, true)
        return quiz?.questions || []
      }
    )

    // Jalankan auto-grading pada seluruh jawaban yang tersimpan sejauh ini
    const { autoScoreSum, processedAnswers } = this.evaluateAnswers(rawQuestions, attempt.answers || [])

    const closedAttempt = await this.quizRepo.saveAttemptAnswers(
      attemptId,
      processedAnswers,
      autoScoreSum,
      autoScoreSum,
      'TIMED_OUT',
      new Date()
    )

    if (!closedAttempt) {
      throw new Error('Gagal menutup sesi ujian secara otomatis')
    }

    return closedAttempt
  }

  /**
   * 4. Pengiriman ujian mahasiswa (submit) dengan Mesin Auto-Grading Pilihan Ganda Instan
   */
  public async submitExam(
    attemptId: string,
    additionalAnswers: AutoSaveAnswerDto[] | undefined,
    studentId: string
  ): Promise<QuizAttemptDto> {
    const attempt = await this.quizRepo.findAttemptById(attemptId)
    if (!attempt) {
      throw new NotFoundError('Sesi ujian tidak ditemukan')
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki hak akses untuk mengumpulkan sesi ujian ini')
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestError(`Sesi ujian ini telah diselesaikan sebelumnya dengan status: ${attempt.status}`)
    }

    // 1. Strict Server-Side Timestamp Validation
    const now = Date.now()
    const expiresAtMs = new Date(attempt.expiresAt || attempt.deadlineAt).getTime()
    const GRACE_PERIOD_MS = 60 * 1000 // Toleransi latensi jaringan 60 detik
    const isLateTimedOut = now > (expiresAtMs + GRACE_PERIOD_MS)

    // 2. Gabungkan jawaban terakhir jika ada yang dikirimkan bersamaan dengan submit
    const rawQuestions = await memoryCache.remember(
      CacheKeys.quizQuestions(attempt.quizId),
      3_600_000,
      async () => {
        const quiz = await this.quizRepo.findById(attempt.quizId, true)
        return quiz?.questions || []
      }
    )
    const questionsMap = new Map<string, QuizQuestion>()
    for (const q of rawQuestions) {
      questionsMap.set(q.id, q)
    }

    const answersMap = new Map<string, QuizAttemptAnswer>()
    for (const ans of (attempt.answers || [])) {
      answersMap.set(ans.questionId, { ...ans })
    }

    if (additionalAnswers && additionalAnswers.length > 0) {
      for (const item of additionalAnswers) {
        const q = questionsMap.get(item.questionId)
        if (!q) continue

        const prev = answersMap.get(item.questionId)
        answersMap.set(item.questionId, {
          questionId: item.questionId,
          questionType: q.type,
          selectedOptionId: item.selectedOptionId !== undefined ? item.selectedOptionId : (prev?.selectedOptionId || null),
          essayAnswer: item.essayAnswer !== undefined ? item.essayAnswer : (prev?.essayAnswer || null),
          isDoubtful: item.isDoubtful !== undefined ? item.isDoubtful : (prev?.isDoubtful || false),
          isCorrect: null,
          scoreAwarded: null,
          lecturerFeedback: null
        })
      }
    }

    const allStudentAnswers = Array.from(answersMap.values())

    // 3. Mesin Auto-Grading Instan untuk Pilihan Ganda
    const { autoScoreSum, hasEssayQuestions, processedAnswers } = this.evaluateAnswers(rawQuestions, allStudentAnswers)

    let finalStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'TIMED_OUT' = 'SUBMITTED'
    let totalScore: number | null = null

    if (isLateTimedOut) {
      finalStatus = 'TIMED_OUT'
      totalScore = autoScoreSum
    } else if (!hasEssayQuestions) {
      finalStatus = 'GRADED'
      totalScore = autoScoreSum
    } else {
      finalStatus = 'SUBMITTED'
      totalScore = null
    }

    const submitted = await this.quizRepo.saveAttemptAnswers(
      attemptId,
      processedAnswers,
      autoScoreSum,
      totalScore,
      finalStatus,
      new Date()
    )

    if (!submitted) {
      throw new Error('Gagal menyimpan hasil pengumpulan ujian')
    }

    return submitted
  }

  /**
   * Mengambil state sesi ujian saat ini (beserta jawaban & tanda ragu-ragu)
   */
  public async getSessionState(attemptId: string, studentId: string): Promise<QuizSessionStateDto> {
    const attempt = await this.quizRepo.findAttemptById(attemptId)
    if (!attempt) {
      throw new NotFoundError('Sesi ujian tidak ditemukan')
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki akses ke sesi ujian ini')
    }

    const quiz = await this.quizRepo.findById(attempt.quizId, true)
    if (!quiz) {
      throw new NotFoundError('Data master ujian tidak ditemukan')
    }

    const now = Date.now()
    const expiresAtMs = new Date(attempt.expiresAt || attempt.deadlineAt).getTime()

    // Jika waktu habis dan masih IN_PROGRESS, auto close
    if (attempt.status === 'IN_PROGRESS' && now > expiresAtMs) {
      const closed = await this.autoCloseAttempt(attemptId, studentId)
      return this.buildSessionStateDto(closed, quiz.title, quiz.quizType, quiz.durationMinutes, new Map(quiz.questions?.map(q => [q.id, q])), expiresAtMs)
    }

    const questionsMap = new Map<string, QuizQuestion>()
    for (const q of (quiz.questions || [])) {
      questionsMap.set(q.id, q)
    }

    return this.buildSessionStateDto(attempt, quiz.title, quiz.quizType, quiz.durationMinutes, questionsMap, expiresAtMs)
  }

  /**
   * Helper: Mesin evaluasi & Auto-grading instan untuk Pilihan Ganda
   */
  private evaluateAnswers(questions: QuizQuestion[], studentAnswers: (AutoSaveAnswerDto | QuizAttemptAnswer)[]) {
    const studentAnswersMap = new Map<string, AutoSaveAnswerDto | QuizAttemptAnswer>()
    for (const ans of studentAnswers) {
      studentAnswersMap.set(ans.questionId, ans)
    }

    let autoScoreSum = 0
    let hasEssayQuestions = false
    const processedAnswers: QuizAttemptAnswer[] = []

    for (const q of questions) {
      const studentAns = studentAnswersMap.get(q.id)

      if (q.type === 'MULTIPLE_CHOICE') {
        const selectedId = studentAns?.selectedOptionId || null
        const isCorrect = selectedId !== null && selectedId === q.correctOptionId
        const scoreAwarded = isCorrect ? q.points : 0
        if (isCorrect) {
          autoScoreSum += scoreAwarded
        }

        processedAnswers.push({
          questionId: q.id,
          questionType: 'MULTIPLE_CHOICE',
          selectedOptionId: selectedId,
          essayAnswer: null,
          isDoubtful: studentAns?.isDoubtful || false,
          isCorrect,
          scoreAwarded,
          lecturerFeedback: null
        })
      } else if (q.type === 'ESSAY') {
        hasEssayQuestions = true
        processedAnswers.push({
          questionId: q.id,
          questionType: 'ESSAY',
          selectedOptionId: null,
          essayAnswer: studentAns?.essayAnswer || '',
          isDoubtful: studentAns?.isDoubtful || false,
          isCorrect: null,
          scoreAwarded: null, // Awaiting lecturer grading
          lecturerFeedback: null
        })
      }
    }

    return { autoScoreSum, hasEssayQuestions, processedAnswers }
  }

  /**
   * Helper: Membentuk DTO status sesi ujian untuk antarmuka mahasiswa
   */
  private buildSessionStateDto(
    attempt: QuizAttemptDto,
    quizTitle: string,
    quizType: QuizType,
    durationMinutes: number,
    questionsMap: Map<string, QuizQuestion>,
    expiresAtMs: number
  ): QuizSessionStateDto {
    const now = Date.now()
    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000))
    const isExpired = now > expiresAtMs

    const studentAnswersMap = new Map<string, QuizAttemptAnswer>()
    for (const a of (attempt.answers || [])) {
      studentAnswersMap.set(a.questionId, a)
    }

    let answeredCount = 0
    let doubtfulCount = 0

    const questionOrder = attempt.questionOrder || []
    const orderedQuestions: QuizSessionQuestionItem[] = []

    for (const qId of questionOrder) {
      const q = questionsMap.get(qId)
      if (!q) continue

      const current = studentAnswersMap.get(qId)
      const hasAnswer = q.type === 'MULTIPLE_CHOICE'
        ? !!current?.selectedOptionId
        : !!(current?.essayAnswer && current.essayAnswer.trim().length > 0)

      if (hasAnswer) answeredCount++
      if (current?.isDoubtful) doubtfulCount++

      const sanitized = this.sanitizeQuestionForStudent(q)

      orderedQuestions.push({
        ...sanitized,
        currentAnswer: current ? {
          selectedOptionId: current.selectedOptionId || null,
          essayAnswer: current.essayAnswer || null,
          isDoubtful: !!current.isDoubtful
        } : undefined
      })
    }

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      quizTitle,
      quizType,
      durationMinutes,
      startedAt: attempt.startedAt,
      expiresAt: new Date(expiresAtMs).toISOString(),
      remainingSeconds,
      isExpired,
      status: attempt.status,
      totalQuestions: orderedQuestions.length,
      answeredCount,
      doubtfulCount,
      questions: orderedQuestions
    }
  }
}

export const quizAttemptService = new QuizAttemptService()
