import type {
  QuizDto,
  CreateQuizDto,
  UpdateQuizDto,
  QuizAttemptDto,
  StartQuizAttemptResponseDto,
  SubmitQuizDto,
  GradeQuizEssayDto,
  QuizAttemptOverviewDto,
  QuizQuestion,
  QuizQuestionStudentView,
  QuizAttemptAnswer,
  StudentAnswerDto
} from '~/types'
import { QuizRepository, type IQuizRepository } from '../repositories/quiz.repository'
import { AttendanceRepository, type IAttendanceRepository } from '../repositories/attendance.repository'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} from '../utils/errors'

export interface IQuizService {
  createQuiz(dto: CreateQuizDto, lecturerId: string): Promise<QuizDto>
  getQuizById(id: string, userRole: string, userId: string): Promise<QuizDto>
  getQuizzesByClassId(classId: string, userRole: string, userId: string): Promise<QuizDto[]>
  getQuizzesBySessionId(sessionId: string, userRole: string, userId: string): Promise<QuizDto[]>
  updateQuiz(id: string, dto: UpdateQuizDto, lecturerId: string): Promise<QuizDto>
  deleteQuiz(id: string, lecturerId: string): Promise<boolean>

  // Student Attempt Flows (Strict Server-Side Timestamp Validations)
  startOrResumeAttempt(quizId: string, studentId: string): Promise<StartQuizAttemptResponseDto>
  submitAttempt(attemptId: string, dto: SubmitQuizDto, studentId: string): Promise<QuizAttemptDto>
  getAttemptById(attemptId: string, userRole: string, userId: string): Promise<QuizAttemptDto>
  getQuizOverviewForLecturer(quizId: string, lecturerId: string): Promise<QuizAttemptOverviewDto>
  gradeAttemptEssays(attemptId: string, dto: GradeQuizEssayDto, lecturerId: string): Promise<QuizAttemptDto>
}

export class QuizService implements IQuizService {
  constructor(
    private readonly quizRepo: IQuizRepository = new QuizRepository(),
    private readonly attendanceRepo: IAttendanceRepository = new AttendanceRepository()
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
   * Dosen membuat Kuis mingguan, UTS (Pertemuan 8), maupun UAS (Pertemuan 16)
   */
  public async createQuiz(dto: CreateQuizDto, lecturerId: string): Promise<QuizDto> {
    const startTime = new Date(dto.startTime)
    const endTime = new Date(dto.endTime)

    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestError('Waktu berakhir ujian (endTime) harus lebih besar daripada waktu mulai (startTime)')
    }

    if (!dto.questions || dto.questions.length === 0) {
      throw new BadRequestError('Ujian wajib memiliki minimal 1 pertanyaan di bank soal')
    }

    return await this.quizRepo.create(dto, lecturerId)
  }

  /**
   * Mengambil detail ujian dengan penyaringan akses berdasarkan Role pengguna
   */
  public async getQuizById(id: string, userRole: string, userId: string): Promise<QuizDto> {
    const isLecturerOrAdmin = userRole === 'lecturer' || userRole === 'admin'
    const quiz = await this.quizRepo.findById(id, isLecturerOrAdmin)

    if (!quiz) {
      throw new NotFoundError('Ujian tidak ditemukan')
    }

    // Jika student, hitung status attempt
    if (!isLecturerOrAdmin) {
      const myAttemptsCount = await this.quizRepo.countStudentAttempts(id, userId)
      const attempts = await this.quizRepo.findStudentAttempts(id, userId)
      quiz.myAttemptsCount = myAttemptsCount
      quiz.myLatestAttempt = attempts.length > 0 ? attempts[0] : null
      quiz.questions = null // Sembunyikan bank soal sebelum ujian dimulai
    }

    return quiz
  }

  public async getQuizzesByClassId(classId: string, userRole: string, userId: string): Promise<QuizDto[]> {
    const studentId = (userRole === 'student') ? userId : undefined
    return await this.quizRepo.findByClassId(classId, studentId)
  }

  public async getQuizzesBySessionId(sessionId: string, userRole: string, userId: string): Promise<QuizDto[]> {
    const studentId = (userRole === 'student') ? userId : undefined
    return await this.quizRepo.findBySessionId(sessionId, studentId)
  }

  public async updateQuiz(id: string, dto: UpdateQuizDto, lecturerId: string): Promise<QuizDto> {
    const existing = await this.quizRepo.findById(id, true)
    if (!existing) {
      throw new NotFoundError('Ujian tidak ditemukan')
    }

    const updated = await this.quizRepo.update(id, dto)
    if (!updated) {
      throw new Error('Gagal memperbarui ujian')
    }

    return updated
  }

  public async deleteQuiz(id: string, lecturerId: string): Promise<boolean> {
    const existing = await this.quizRepo.findById(id, false)
    if (!existing) {
      throw new NotFoundError('Ujian tidak ditemukan')
    }

    return await this.quizRepo.delete(id)
  }

  /**
   * Student mulai / resume pengerjaan ujian berbasis Strict Server-Side Timestamp
   */
  public async startOrResumeAttempt(quizId: string, studentId: string): Promise<StartQuizAttemptResponseDto> {
    const quiz = await this.quizRepo.findById(quizId, true)
    if (!quiz) {
      throw new NotFoundError('Ujian tidak ditemukan')
    }

    if (!quiz.isPublished) {
      throw new ForbiddenError('Ujian ini belum dipublikasikan oleh dosen')
    }

    // 1. Strict Server-Side Timestamp Validation: Jendela Akses Ujian
    const now = Date.now()
    const startTimeMs = new Date(quiz.startTime).getTime()
    const endTimeMs = new Date(quiz.endTime).getTime()

    if (now < startTimeMs) {
      const openDateStr = new Date(startTimeMs).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      throw new BadRequestError(`Ujian belum dibuka. Waktu akses dimulai pada ${openDateStr} WIB`)
    }

    if (now > endTimeMs) {
      const closeDateStr = new Date(endTimeMs).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      throw new BadRequestError(`Jendela waktu ujian telah ditutup pada ${closeDateStr} WIB`)
    }

    // 2. Cek apakah ada sesi pengerjaan aktif (IN_PROGRESS)
    let activeAttempt = await this.quizRepo.findActiveAttempt(quizId, studentId)

    if (activeAttempt) {
      // Evaluasi apakah durasi timer pengerjaan aktif telah kedaluwarsa
      const startedAtMs = new Date(activeAttempt.startedAt).getTime()
      const timerEndMs = startedAtMs + (quiz.durationMinutes * 60 * 1000)
      const strictDeadlineMs = Math.min(timerEndMs, endTimeMs)

      if (now > strictDeadlineMs) {
        // Otomatis tandai sebagai TIMED_OUT jika sudah melewati deadline
        await this.quizRepo.saveAttemptAnswers(
          activeAttempt.id,
          activeAttempt.answers || [],
          0,
          0,
          'TIMED_OUT',
          new Date(strictDeadlineMs)
        )

        throw new BadRequestError('Waktu durasi ujian Anda telah habis (Timed Out).')
      }

      // Resume sesi aktif yang ada
      const questionOrder = activeAttempt.questionOrder || []
      const questionsMap = new Map<string, QuizQuestion>()
      for (const q of (quiz.questions || [])) {
        questionsMap.set(q.id, q)
      }

      const orderedQuestions: QuizQuestionStudentView[] = []
      for (const qId of questionOrder) {
        const q = questionsMap.get(qId)
        if (q) {
          orderedQuestions.push(this.sanitizeQuestionForStudent(q))
        }
      }

      const remainingSeconds = Math.max(0, Math.floor((strictDeadlineMs - now) / 1000))

      return {
        attempt: activeAttempt,
        questions: orderedQuestions,
        remainingSeconds,
        deadlineAt: new Date(strictDeadlineMs).toISOString(),
        expiresAt: new Date(strictDeadlineMs).toISOString()
      }
    }

    // 3. Cek batasan percobaan maksimal (maxAttempts)
    const pastAttemptsCount = await this.quizRepo.countStudentAttempts(quizId, studentId)
    if (pastAttemptsCount >= quiz.maxAttempts) {
      throw new BadRequestError(`Anda telah mencapai batas maksimal pengerjaan ujian (${quiz.maxAttempts} kali percobaan)`)
    }

    // 4. Inisialisasi Percobaan Baru: Fitur Pengacakan Urutan Soal (Shuffle)
    const rawQuestions = quiz.questions || []
    if (rawQuestions.length === 0) {
      throw new BadRequestError('Bank soal ujian belum diisi oleh dosen pengampu')
    }

    let questionOrder: string[] = []
    if (quiz.shuffleQuestions) {
      const shuffled = this.shuffleArray(rawQuestions)
      questionOrder = shuffled.map(q => q.id)
    } else {
      questionOrder = rawQuestions.map(q => q.id)
    }

    const calculatedDeadlineMs = Math.min(now + (quiz.durationMinutes * 60 * 1000), endTimeMs)
    const newAttemptNumber = pastAttemptsCount + 1
    const newAttempt = await this.quizRepo.createAttempt(
      quizId,
      studentId,
      newAttemptNumber,
      questionOrder,
      new Date(calculatedDeadlineMs)
    )

    // Hitung deadline spesifik attempt ini
    const startedMs = new Date(newAttempt.startedAt).getTime()
    const timerEndMs = startedMs + (quiz.durationMinutes * 60 * 1000)
    const strictDeadlineMs = Math.min(timerEndMs, endTimeMs)
    const remainingSeconds = Math.max(0, Math.floor((strictDeadlineMs - now) / 1000))

    const questionsMap = new Map<string, QuizQuestion>()
    for (const q of rawQuestions) {
      questionsMap.set(q.id, q)
    }

    const orderedQuestions: QuizQuestionStudentView[] = []
    for (const qId of questionOrder) {
      const q = questionsMap.get(qId)
      if (q) {
        orderedQuestions.push(this.sanitizeQuestionForStudent(q))
      }
    }

    return {
      attempt: newAttempt,
      questions: orderedQuestions,
      remainingSeconds,
      deadlineAt: new Date(strictDeadlineMs).toISOString(),
      expiresAt: new Date(strictDeadlineMs).toISOString()
    }
  }

  /**
   * Student mengirimkan jawaban ujian (Submit) dengan Validasi Strict Timestamp & Auto-Grading Pilihan Ganda
   */
  public async submitAttempt(attemptId: string, dto: SubmitQuizDto, studentId: string): Promise<QuizAttemptDto> {
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

    const quiz = await this.quizRepo.findById(attempt.quizId, true)
    if (!quiz) {
      throw new NotFoundError('Data master ujian tidak ditemukan')
    }

    // 1. Strict Server-Side Timestamp Validation
    const now = Date.now()
    const startedMs = new Date(attempt.startedAt).getTime()
    const timerEndMs = startedMs + (quiz.durationMinutes * 60 * 1000)
    const quizEndMs = new Date(quiz.endTime).getTime()
    const strictDeadlineMs = Math.min(timerEndMs, quizEndMs)

    // Toleransi latensi jaringan 60 detik
    const GRACE_PERIOD_MS = 60 * 1000
    const isLateTimedOut = now > (strictDeadlineMs + GRACE_PERIOD_MS)

    // 2. Evaluasi Jawaban & Auto-grading untuk Pilihan Ganda
    const rawQuestions = quiz.questions || []
    const questionsMap = new Map<string, QuizQuestion>()
    for (const q of rawQuestions) {
      questionsMap.set(q.id, q)
    }

    const studentAnswersMap = new Map<string, StudentAnswerDto>()
    for (const ans of (dto.answers || [])) {
      studentAnswersMap.set(ans.questionId, ans)
    }

    let autoScoreSum = 0
    let hasEssayQuestions = false
    const processedAnswers: QuizAttemptAnswer[] = []

    for (const q of rawQuestions) {
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
          isCorrect: null,
          scoreAwarded: null, // Menunggu penilaian dosen
          lecturerFeedback: null
        })
      }
    }

    // 3. Tentukan status akhir: TIMED_OUT, GRADED (jika semua pilihan ganda), atau SUBMITTED (ada esai)
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

    const updatedAttempt = await this.quizRepo.saveAttemptAnswers(
      attemptId,
      processedAnswers,
      autoScoreSum,
      totalScore,
      finalStatus,
      new Date()
    )

    if (!updatedAttempt) {
      throw new Error('Gagal menyimpan hasil pengumpulan ujian')
    }

    return updatedAttempt
  }

  public async getAttemptById(attemptId: string, userRole: string, userId: string): Promise<QuizAttemptDto> {
    const attempt = await this.quizRepo.findAttemptById(attemptId)
    if (!attempt) {
      throw new NotFoundError('Percobaan ujian tidak ditemukan')
    }

    if (userRole === 'student' && attempt.studentId !== userId) {
      throw new ForbiddenError('Anda tidak memiliki hak untuk melihat percobaan ujian mahasiswa lain')
    }

    return attempt
  }

  /**
   * Dosen melihat rekapitulasi nilai dan daftar percobaan ujian seluruh mahasiswa
   */
  public async getQuizOverviewForLecturer(quizId: string, lecturerId: string): Promise<QuizAttemptOverviewDto> {
    const quiz = await this.quizRepo.findById(quizId, true)
    if (!quiz) {
      throw new NotFoundError('Ujian tidak ditemukan')
    }

    const attempts = await this.quizRepo.findAttemptsByQuizId(quizId)
    const totalAttempts = attempts.length
    const uniqueStudents = new Set(attempts.map(a => a.studentId)).size

    let totalScore = 0
    let highestScore = 0
    let lowestScore = totalAttempts > 0 ? 1000 : 0
    let gradedCount = 0

    for (const a of attempts) {
      if (a.score !== null) {
        const val = parseFloat(a.score)
        totalScore += val
        gradedCount++
        if (val > highestScore) highestScore = val
        if (val < lowestScore) lowestScore = val
      }
    }

    const averageScore = gradedCount > 0 ? parseFloat((totalScore / gradedCount).toFixed(2)) : 0
    if (lowestScore === 1000) lowestScore = 0

    return {
      quiz,
      totalAttempts,
      totalStudents: uniqueStudents,
      averageScore,
      highestScore,
      lowestScore,
      attempts
    }
  }

  /**
   * Dosen melakukan penilaian manual pada soal Esai
   */
  public async gradeAttemptEssays(attemptId: string, dto: GradeQuizEssayDto, lecturerId: string): Promise<QuizAttemptDto> {
    const attempt = await this.quizRepo.findAttemptById(attemptId)
    if (!attempt) {
      throw new NotFoundError('Percobaan ujian tidak ditemukan')
    }

    const answers = attempt.answers || []
    const gradeMap = new Map<string, { scoreAwarded: number; feedback?: string | null }>()
    for (const item of dto.answers) {
      gradeMap.set(item.questionId, {
        scoreAwarded: item.scoreAwarded,
        feedback: item.lecturerFeedback || null
      })
    }

    let manualScoreSum = 0
    const updatedAnswers: QuizAttemptAnswer[] = answers.map(ans => {
      if (ans.questionType === 'ESSAY' && gradeMap.has(ans.questionId)) {
        const gradeInfo = gradeMap.get(ans.questionId)!
        manualScoreSum += gradeInfo.scoreAwarded
        return {
          ...ans,
          scoreAwarded: gradeInfo.scoreAwarded,
          lecturerFeedback: gradeInfo.feedback,
          isCorrect: gradeInfo.scoreAwarded > 0
        }
      }
      return ans
    })

    const autoScoreVal = attempt.autoScore ? parseFloat(attempt.autoScore) : 0
    const totalScore = autoScoreVal + manualScoreSum

    const graded = await this.quizRepo.gradeAttempt(
      attemptId,
      manualScoreSum,
      totalScore,
      updatedAnswers,
      dto.feedback || null,
      lecturerId
    )

    if (!graded) {
      throw new Error('Gagal menyimpan penilaian esai')
    }

    return graded
  }
}

export const quizService = new QuizService()
