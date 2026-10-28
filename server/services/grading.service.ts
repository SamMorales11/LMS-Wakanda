import type {
  GradingSubmissionItemDto,
  CollectiveSubmissionsDto,
  GradeSubmissionPayloadDto,
  BatchGradeSubmissionDto,
  GradingQuizAttemptItemDto,
  GradingEssayAnswerItemDto,
  CollectiveQuizAttemptsDto,
  GradeEssayPayloadDto,
  QuizQuestion,
  QuizAttemptAnswer,
  SubmissionTimingStatus
} from '~/types'
import { gradingRepository, type IGradingRepository } from '../repositories/grading.repository'
import { storageService, type IStorageService } from './storage.service'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} from '../utils/errors'

export interface IGradingService {
  getCollectiveAssignmentSubmissions(
    assignmentId: string,
    lecturerId: string,
    origin?: string
  ): Promise<CollectiveSubmissionsDto>
  gradeAssignmentSubmission(
    submissionId: string,
    dto: GradeSubmissionPayloadDto,
    lecturerId: string,
    origin?: string
  ): Promise<GradingSubmissionItemDto>
  batchGradeSubmissions(
    assignmentId: string,
    dto: BatchGradeSubmissionDto,
    lecturerId: string,
    origin?: string
  ): Promise<{ updatedCount: number; results: GradingSubmissionItemDto[] }>
  getSubmissionSignedReadUrl(
    submissionId: string,
    origin?: string
  ): Promise<{ signedUrl: string; expiresAt: string; fileName: string | null; fileType: string | null }>
  getCollectiveQuizAttempts(
    quizId: string,
    lecturerId: string
  ): Promise<CollectiveQuizAttemptsDto>
  gradeQuizAttemptEssay(
    attemptId: string,
    dto: GradeEssayPayloadDto,
    lecturerId: string
  ): Promise<GradingQuizAttemptItemDto>
}

export class GradingService implements IGradingService {
  constructor(
    private readonly repo: IGradingRepository = gradingRepository,
    private readonly storage: IStorageService = storageService
  ) {}

  /**
   * Helper: Format feedback menjadi format terstruktur yang rapi
   */
  private formatCombinedFeedback(
    feedback?: string | null,
    rubricFeedback?: string | null,
    revisionNotes?: string | null
  ): string | null {
    const parts: string[] = []
    if (feedback && feedback.trim()) {
      parts.push(`[Catatan Umum]:\n${feedback.trim()}`)
    }
    if (rubricFeedback && rubricFeedback.trim()) {
      parts.push(`[Umpan Balik Rubrik]:\n${rubricFeedback.trim()}`)
    }
    if (revisionNotes && revisionNotes.trim()) {
      parts.push(`[Instruksi Revisi]:\n${revisionNotes.trim()}`)
    }
    return parts.length > 0 ? parts.join('\n\n') : null
  }

  /**
   * Helper: Ekstraksi catatan rubrik & revisi dari teks feedback gabungan
   */
  private parseCombinedFeedback(raw?: string | null): {
    feedback: string | null
    rubricFeedback: string | null
    revisionNotes: string | null
  } {
    if (!raw) {
      return { feedback: null, rubricFeedback: null, revisionNotes: null }
    }

    let feedback: string | null = null
    let rubricFeedback: string | null = null
    let revisionNotes: string | null = null

    const rubricMatch = raw.match(/\[Umpan Balik Rubrik\]:\s*([\s\S]*?)(?=\n\n\[|$)/)
    if (rubricMatch) rubricFeedback = rubricMatch[1].trim()

    const revisionMatch = raw.match(/\[Instruksi Revisi\]:\s*([\s\S]*?)(?=\n\n\[|$)/)
    if (revisionMatch) revisionNotes = revisionMatch[1].trim()

    const generalMatch = raw.match(/\[Catatan Umum\]:\s*([\s\S]*?)(?=\n\n\[|$)/)
    if (generalMatch) {
      feedback = generalMatch[1].trim()
    } else if (!rubricMatch && !revisionMatch) {
      feedback = raw.trim()
    }

    return { feedback, rubricFeedback, revisionNotes }
  }

  /**
   * 1. Melihat atau mengunduh berkas pengumpulan tugas mahasiswa secara kolektif dengan Signed Read URL
   */
  public async getCollectiveAssignmentSubmissions(
    assignmentId: string,
    lecturerId: string,
    origin?: string
  ): Promise<CollectiveSubmissionsDto> {
    const data = await this.repo.findAssignmentWithSubmissions(assignmentId)
    if (!data) {
      throw new NotFoundError(`Tugas dengan ID '${assignmentId}' tidak ditemukan`)
    }

    const maxScoreNum = parseFloat(data.assignment.maxScore)

    let totalScoreSum = 0
    let gradedCount = 0
    let resubmissionCount = 0
    let highestScore: number | null = null
    let lowestScore: number | null = null

    const submissionItems: GradingSubmissionItemDto[] = await Promise.all(
      data.submissionRows.map(async (row) => {
        let signedReadUrl: string | null = null
        let urlExpiresAt: string | null = null

        // Generate Signed Read URL (berdurasi 60 menit) jika berkas ada
        if (row.submission.fileKey) {
          try {
            const signedRes = await this.storage.createSignedReadUrl(
              { fileKey: row.submission.fileKey, expiresInSeconds: 3600 },
              origin
            )
            signedReadUrl = signedRes.signedUrl
            urlExpiresAt = new Date(Date.now() + signedRes.expiresInSeconds * 1000).toISOString()
          } catch (err) {
            console.warn(`[GradingService] Gagal menghasilkan Signed Read URL untuk '${row.submission.fileKey}':`, err)
          }
        }

        const scoreNum = row.submission.score !== null ? parseFloat(row.submission.score) : null
        const percentage = (scoreNum !== null && maxScoreNum > 0)
          ? parseFloat(((scoreNum / maxScoreNum) * 100).toFixed(2))
          : null

        if (row.submission.status === 'GRADED' && scoreNum !== null) {
          gradedCount++
          totalScoreSum += scoreNum
          if (highestScore === null || scoreNum > highestScore) highestScore = scoreNum
          if (lowestScore === null || scoreNum < lowestScore) lowestScore = scoreNum
        } else if (row.submission.status === 'RESUBMISSION_REQUESTED') {
          resubmissionCount++
        }

        const timingStatus: SubmissionTimingStatus = row.submission.isLate ? 'LATE' : 'ON_TIME'
        const timingLabel = row.submission.isLate ? 'Terlambat' : 'Tepat Waktu'
        const timingColor = row.submission.isLate ? '#DC2626' : '#16A34A'

        const parsedFeedback = this.parseCombinedFeedback(row.submission.feedback)

        return {
          submissionId: row.submission.id,
          assignmentId: data.assignment.id,
          assignmentTitle: data.assignment.title,
          maxScore: maxScoreNum,
          studentId: row.student.id,
          studentName: row.student.name,
          studentNim: row.student.nimNidn,
          studentEmail: row.student.email,
          fileKey: row.submission.fileKey,
          fileName: row.submission.fileName,
          fileSize: row.submission.fileSize,
          fileType: row.submission.fileType,
          signedReadUrl,
          urlExpiresAt,
          contentText: row.submission.contentText,
          submittedAt: row.submission.submittedAt.toISOString(),
          isLate: row.submission.isLate,
          timingStatus,
          timingLabel,
          timingColor,
          score: scoreNum,
          percentage,
          feedback: parsedFeedback.feedback,
          rubricFeedback: parsedFeedback.rubricFeedback,
          revisionNotes: parsedFeedback.revisionNotes,
          status: row.submission.status,
          gradedBy: row.submission.gradedBy,
          graderName: row.grader?.name || null,
          gradedAt: row.submission.gradedAt ? row.submission.gradedAt.toISOString() : null
        }
      })
    )

    const submittedCount = submissionItems.length
    const pendingCount = Math.max(0, submittedCount - gradedCount - resubmissionCount)
    const averageScore = gradedCount > 0 ? parseFloat((totalScoreSum / gradedCount).toFixed(2)) : null

    return {
      assignmentId: data.assignment.id,
      assignmentTitle: data.assignment.title,
      classId: data.classId,
      maxScore: maxScoreNum,
      dueDate: data.assignment.dueDate.toISOString(),
      cutoffDate: data.assignment.cutoffDate ? data.assignment.cutoffDate.toISOString() : null,
      totalEnrolled: data.totalEnrolled,
      submittedCount,
      gradedCount,
      resubmissionCount,
      pendingCount,
      averageScore,
      highestScore,
      lowestScore,
      submissions: submissionItems
    }
  }

  /**
   * 2. Memberikan skor numerik (0-100) beserta umpan balik rubrik atau catatan revisi pada tabel submissions
   */
  public async gradeAssignmentSubmission(
    submissionId: string,
    dto: GradeSubmissionPayloadDto,
    lecturerId: string,
    origin?: string
  ): Promise<GradingSubmissionItemDto> {
    const row = await this.repo.findSubmissionById(submissionId)
    if (!row) {
      throw new NotFoundError(`Pengumpulan tugas dengan ID '${submissionId}' tidak ditemukan`)
    }

    const maxScoreNum = parseFloat(row.assignment.maxScore)
    if (dto.score < 0 || dto.score > maxScoreNum) {
      throw new BadRequestError(`Skor harus berada dalam rentang 0 hingga ${maxScoreNum}`)
    }

    const combinedFeedback = this.formatCombinedFeedback(dto.feedback, dto.rubricFeedback, dto.revisionNotes)
    const finalStatus = dto.status || 'GRADED'

    const updated = await this.repo.updateSubmissionGrade(
      submissionId,
      dto.score,
      combinedFeedback,
      finalStatus,
      lecturerId
    )

    if (!updated) {
      throw new Error('Gagal memperbarui nilai pengumpulan tugas')
    }

    let signedReadUrl: string | null = null
    let urlExpiresAt: string | null = null
    if (updated.fileKey) {
      try {
        const signedRes = await this.storage.createSignedReadUrl(
          { fileKey: updated.fileKey, expiresInSeconds: 3600 },
          origin
        )
        signedReadUrl = signedRes.signedUrl
        urlExpiresAt = new Date(Date.now() + signedRes.expiresInSeconds * 1000).toISOString()
      } catch (err) {
        console.warn(`[GradingService] Gagal menghasilkan Signed Read URL untuk '${updated.fileKey}':`, err)
      }
    }

    const parsedFeedback = this.parseCombinedFeedback(updated.feedback)
    const scoreNum = parseFloat(updated.score || String(dto.score))
    const percentage = maxScoreNum > 0 ? parseFloat(((scoreNum / maxScoreNum) * 100).toFixed(2)) : null

    return {
      submissionId: updated.id,
      assignmentId: row.assignment.id,
      assignmentTitle: row.assignment.title,
      maxScore: maxScoreNum,
      studentId: row.student.id,
      studentName: row.student.name,
      studentNim: row.student.nimNidn,
      studentEmail: row.student.email,
      fileKey: updated.fileKey,
      fileName: updated.fileName,
      fileSize: updated.fileSize,
      fileType: updated.fileType,
      signedReadUrl,
      urlExpiresAt,
      contentText: updated.contentText,
      submittedAt: updated.submittedAt.toISOString(),
      isLate: updated.isLate,
      timingStatus: updated.isLate ? 'LATE' : 'ON_TIME',
      timingLabel: updated.isLate ? 'Terlambat' : 'Tepat Waktu',
      timingColor: updated.isLate ? '#DC2626' : '#16A34A',
      score: scoreNum,
      percentage,
      feedback: parsedFeedback.feedback,
      rubricFeedback: parsedFeedback.rubricFeedback,
      revisionNotes: parsedFeedback.revisionNotes,
      status: updated.status,
      gradedBy: updated.gradedBy,
      graderName: row.grader?.name || null,
      gradedAt: updated.gradedAt ? updated.gradedAt.toISOString() : null
    }
  }

  /**
   * Penilaian kolektif / Batch grading untuk banyak pengumpulan tugas sekaligus
   */
  public async batchGradeSubmissions(
    assignmentId: string,
    dto: BatchGradeSubmissionDto,
    lecturerId: string,
    origin?: string
  ): Promise<{ updatedCount: number; results: GradingSubmissionItemDto[] }> {
    const results: GradingSubmissionItemDto[] = []

    for (const item of dto.grades) {
      const graded = await this.gradeAssignmentSubmission(
        item.submissionId,
        {
          score: item.score,
          feedback: item.feedback,
          rubricFeedback: item.rubricFeedback,
          revisionNotes: item.revisionNotes,
          status: item.status
        },
        lecturerId,
        origin
      )
      results.push(graded)
    }

    return {
      updatedCount: results.length,
      results
    }
  }

  /**
   * Mengambil Signed Read URL tunggal secara instan untuk pratinjau berkas tugas
   */
  public async getSubmissionSignedReadUrl(
    submissionId: string,
    origin?: string
  ): Promise<{ signedUrl: string; expiresAt: string; fileName: string | null; fileType: string | null }> {
    const row = await this.repo.findSubmissionById(submissionId)
    if (!row) {
      throw new NotFoundError(`Pengumpulan tugas dengan ID '${submissionId}' tidak ditemukan`)
    }

    if (!row.submission.fileKey) {
      throw new BadRequestError('Pengumpulan ini tidak memiliki berkas dokumen')
    }

    const signed = await this.storage.createSignedReadUrl(
      { fileKey: row.submission.fileKey, expiresInSeconds: 3600 },
      origin
    )

    return {
      signedUrl: signed.signedUrl,
      expiresAt: new Date(Date.now() + signed.expiresInSeconds * 1000).toISOString(),
      fileName: row.submission.fileName,
      fileType: row.submission.fileType
    }
  }

  /**
   * Mengambil seluruh percobaan ujian mahasiswa untuk kuis/ujian tertentu
   */
  public async getCollectiveQuizAttempts(
    quizId: string,
    lecturerId: string
  ): Promise<CollectiveQuizAttemptsDto> {
    const data = await this.repo.findQuizWithAttempts(quizId)
    if (!data) {
      throw new NotFoundError(`Ujian dengan ID '${quizId}' tidak ditemukan`)
    }

    const questionsList = (data.quiz.questionsJsonb as QuizQuestion[]) || []
    const essayQuestions = questionsList.filter(q => q.type === 'ESSAY')
    const maxScoreNum = parseFloat(data.quiz.maxScore)
    const passingScoreNum = parseFloat(data.quiz.passingScore)

    let totalScoreSum = 0
    let gradedCount = 0
    let pendingEssayCount = 0
    let highestScore: number | null = null
    let lowestScore: number | null = null

    const attemptItems: GradingQuizAttemptItemDto[] = data.attempts.map(row => {
      const answersList = (row.attempt.answersJsonb as QuizAttemptAnswer[]) || []
      const answersMap = new Map<string, QuizAttemptAnswer>()
      for (const a of answersList) {
        answersMap.set(a.questionId, a)
      }

      // Format essay answers
      const essayAnswers: GradingEssayAnswerItemDto[] = essayQuestions.map(eq => {
        const studentAns = answersMap.get(eq.id)
        return {
          questionId: eq.id,
          prompt: eq.prompt,
          rubric: eq.rubric || null,
          maxPoints: eq.points,
          essayAnswer: studentAns?.essayAnswer || '',
          scoreAwarded: studentAns?.scoreAwarded ?? null,
          lecturerFeedback: studentAns?.lecturerFeedback || null
        }
      })

      const hasUngradedEssay = essayAnswers.some(ea => ea.scoreAwarded === null)
      if (hasUngradedEssay && row.attempt.status === 'SUBMITTED') {
        pendingEssayCount++
      }

      const totalScoreNum = row.attempt.score !== null ? parseFloat(row.attempt.score) : null
      const autoScoreNum = row.attempt.autoScore !== null ? parseFloat(row.attempt.autoScore) : 0
      const manualScoreNum = row.attempt.manualScore !== null ? parseFloat(row.attempt.manualScore) : null

      if (row.attempt.status === 'GRADED' && totalScoreNum !== null) {
        gradedCount++
        totalScoreSum += totalScoreNum
        if (highestScore === null || totalScoreNum > highestScore) highestScore = totalScoreNum
        if (lowestScore === null || totalScoreNum < lowestScore) lowestScore = totalScoreNum
      }

      const percentage = (totalScoreNum !== null && maxScoreNum > 0)
        ? parseFloat(((totalScoreNum / maxScoreNum) * 100).toFixed(2))
        : null

      const isPassed = totalScoreNum !== null ? totalScoreNum >= passingScoreNum : false

      return {
        attemptId: row.attempt.id,
        quizId: data.quiz.id,
        quizTitle: data.quiz.title,
        quizType: data.quiz.quizType as any,
        maxScore: maxScoreNum,
        passingScore: passingScoreNum,
        studentId: row.student.id,
        studentName: row.student.name,
        studentNim: row.student.nimNidn,
        startedAt: row.attempt.startedAt.toISOString(),
        submittedAt: row.attempt.submittedAt ? row.attempt.submittedAt.toISOString() : null,
        status: row.attempt.status as any,
        autoScore: autoScoreNum,
        manualScore: manualScoreNum,
        totalScore: totalScoreNum,
        percentage,
        isPassed,
        generalFeedback: row.attempt.feedback,
        essayAnswers,
        gradedBy: row.attempt.gradedBy,
        graderName: row.grader?.name || null,
        gradedAt: row.attempt.gradedAt ? row.attempt.gradedAt.toISOString() : null
      }
    })

    const averageScore = gradedCount > 0 ? parseFloat((totalScoreSum / gradedCount).toFixed(2)) : null

    return {
      quizId: data.quiz.id,
      quizTitle: data.quiz.title,
      classId: data.quiz.classId,
      quizType: data.quiz.quizType as any,
      maxScore: maxScoreNum,
      passingScore: passingScoreNum,
      totalAttempts: attemptItems.length,
      gradedCount,
      pendingEssayCount,
      averageScore,
      highestScore,
      lowestScore,
      attempts: attemptItems
    }
  }

  /**
   * 3. Memberikan nilai manual pada jawaban soal Esai di tabel quiz_attempts
   * yang secara reaktif memicu pembaruan skor total ujian mahasiswa (autoScore + manualScore)
   */
  public async gradeQuizAttemptEssay(
    attemptId: string,
    dto: GradeEssayPayloadDto,
    lecturerId: string
  ): Promise<GradingQuizAttemptItemDto> {
    const data = await this.repo.findQuizAttemptById(attemptId)
    if (!data) {
      throw new NotFoundError(`Percobaan ujian dengan ID '${attemptId}' tidak ditemukan`)
    }

    const quizQuestions = (data.quiz.questionsJsonb as QuizQuestion[]) || []
    const questionsMap = new Map<string, QuizQuestion>()
    for (const q of quizQuestions) {
      questionsMap.set(q.id, q)
    }

    const currentAnswers = (data.attempt.answersJsonb as QuizAttemptAnswer[]) || []
    const gradeMap = new Map<string, { scoreAwarded: number; feedback?: string | null }>()

    for (const ansItem of dto.answers) {
      const q = questionsMap.get(ansItem.questionId)
      if (!q) {
        throw new BadRequestError(`Butir soal '${ansItem.questionId}' tidak ada dalam bank soal ujian`)
      }
      if (ansItem.scoreAwarded < 0 || ansItem.scoreAwarded > q.points) {
        throw new BadRequestError(`Nilai untuk soal '${q.prompt.substring(0, 30)}...' harus antara 0 dan ${q.points}`)
      }
      gradeMap.set(ansItem.questionId, {
        scoreAwarded: ansItem.scoreAwarded,
        feedback: ansItem.lecturerFeedback || null
      })
    }

    let manualScoreSum = 0
    const updatedAnswers: QuizAttemptAnswer[] = currentAnswers.map(ans => {
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

    // Reactively compute totalScore = autoScore + manualScore
    const autoScoreNum = data.attempt.autoScore !== null ? parseFloat(data.attempt.autoScore) : 0
    const totalScore = autoScoreNum + manualScoreSum

    const updated = await this.repo.updateQuizAttemptGrade(
      attemptId,
      manualScoreSum,
      totalScore,
      updatedAnswers,
      dto.feedback || data.attempt.feedback,
      lecturerId
    )

    if (!updated) {
      throw new Error('Gagal menyimpan hasil penilaian esai ujian')
    }

    const maxScoreNum = parseFloat(data.quiz.maxScore)
    const passingScoreNum = parseFloat(data.quiz.passingScore)
    const percentage = maxScoreNum > 0 ? parseFloat(((totalScore / maxScoreNum) * 100).toFixed(2)) : null
    const isPassed = totalScore >= passingScoreNum

    // Format essay answers for return
    const essayQuestions = quizQuestions.filter(q => q.type === 'ESSAY')
    const updatedAnswersMap = new Map<string, QuizAttemptAnswer>()
    for (const a of updatedAnswers) {
      updatedAnswersMap.set(a.questionId, a)
    }

    const essayAnswers: GradingEssayAnswerItemDto[] = essayQuestions.map(eq => {
      const studentAns = updatedAnswersMap.get(eq.id)
      return {
        questionId: eq.id,
        prompt: eq.prompt,
        rubric: eq.rubric || null,
        maxPoints: eq.points,
        essayAnswer: studentAns?.essayAnswer || '',
        scoreAwarded: studentAns?.scoreAwarded ?? null,
        lecturerFeedback: studentAns?.lecturerFeedback || null
      }
    })

    return {
      attemptId: updated.id,
      quizId: data.quiz.id,
      quizTitle: data.quiz.title,
      quizType: data.quiz.quizType as any,
      maxScore: maxScoreNum,
      passingScore: passingScoreNum,
      studentId: data.student.id,
      studentName: data.student.name,
      studentNim: data.student.nimNidn,
      startedAt: updated.startedAt.toISOString(),
      submittedAt: updated.submittedAt ? updated.submittedAt.toISOString() : null,
      status: updated.status as any,
      autoScore: autoScoreNum,
      manualScore: manualScoreSum,
      totalScore,
      percentage,
      isPassed,
      generalFeedback: updated.feedback,
      essayAnswers,
      gradedBy: updated.gradedBy,
      graderName: data.grader?.name || null,
      gradedAt: updated.gradedAt ? updated.gradedAt.toISOString() : null
    }
  }
}

export const gradingService = new GradingService()
