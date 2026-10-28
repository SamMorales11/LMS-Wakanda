import type {
  GradeComponent,
  GradeStatus,
  LetterGrade,
  GradeWeightItemDto,
  ConfigureGradeWeightsDto,
  StudentGradeBreakdownDto,
  ClassGradebookDto,
  ManualGradeAdjustmentDto,
  GradeAuditLogDto
} from '~/types'
import {
  gradebookRepository,
  type IGradebookRepository,
  type ClassGradeAssessmentData
} from '../repositories/gradebook.repository'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} from '../utils/errors'

export const DEFAULT_GRADE_WEIGHTS: GradeWeightItemDto[] = [
  { componentName: 'ATTENDANCE', weightPercentage: 10.0, description: 'Presensi & Keaktifan Perkuliahan (Minimal 75%)' },
  { componentName: 'ASSIGNMENT', weightPercentage: 20.0, description: 'Tugas Terstruktur & Praktikum Mandiri' },
  { componentName: 'QUIZ', weightPercentage: 15.0, description: 'Kuis Terstruktur Mingguan' },
  { componentName: 'MIDTERM_EXAM', weightPercentage: 25.0, description: 'Ujian Tengah Semester (UTS - Pertemuan 8)' },
  { componentName: 'FINAL_EXAM', weightPercentage: 30.0, description: 'Ujian Akhir Semester (UAS - Pertemuan 16)' }
]

export class GradebookService {
  constructor(private readonly repo: IGradebookRepository = gradebookRepository) {}

  /**
   * Mengonversi skor numerik (0 - 100) ke huruf mutu standar ITW dan bobot indeks (IP)
   * A  >= 85.0 (4.00)
   * AB : 80.0 - 84.99 (3.50)
   * B  : 70.0 - 79.99 (3.00)
   * BC : 65.0 - 69.99 (2.50)
   * C  : 55.0 - 64.99 (2.00)
   * D  : 45.0 - 54.99 (1.00)
   * E  : < 45.0 ATAU Kehadiran < 75.0% (0.00)
   */
  public convertScoreToLetterAndPoint(
    numericScore: number,
    isAttendanceDisqualified: boolean
  ): { letterGrade: LetterGrade; gradePoint: number } {
    if (isAttendanceDisqualified) {
      return { letterGrade: 'E', gradePoint: 0.0 }
    }

    const score = Math.round(numericScore * 100) / 100

    if (score >= 85.0) {
      return { letterGrade: 'A', gradePoint: 4.0 }
    }
    if (score >= 80.0) {
      return { letterGrade: 'AB', gradePoint: 3.5 }
    }
    if (score >= 70.0) {
      return { letterGrade: 'B', gradePoint: 3.0 }
    }
    if (score >= 65.0) {
      return { letterGrade: 'BC', gradePoint: 2.5 }
    }
    if (score >= 55.0) {
      return { letterGrade: 'C', gradePoint: 2.0 }
    }
    if (score >= 45.0) {
      return { letterGrade: 'D', gradePoint: 1.0 }
    }
    return { letterGrade: 'E', gradePoint: 0.0 }
  }

  /**
   * Mengambil bobot penilaian kelas yang aktif, atau default jika belum dikonfigurasi
   */
  public async getEffectiveWeights(classId: string): Promise<GradeWeightItemDto[]> {
    const dbWeights = await this.repo.findGradeWeights(classId)
    if (dbWeights && dbWeights.length === 5) {
      return dbWeights.map((w) => ({
        componentName: w.componentName as GradeComponent,
        weightPercentage: parseFloat(w.weightPercentage),
        description: w.description
      }))
    }
    return DEFAULT_GRADE_WEIGHTS
  }

  /**
   * Mengonfigurasi persentase bobot penilaian kelas (wajib total 100% untuk kelima komponen)
   */
  public async configureGradeWeights(
    classId: string,
    dto: ConfigureGradeWeightsDto,
    lecturerId: string
  ): Promise<GradeWeightItemDto[]> {
    const classInfo = await this.repo.findClassInfo(classId)
    if (!classInfo) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${classId}' tidak ditemukan`)
    }

    // Validasi 5 komponen unik
    const expectedComponents: GradeComponent[] = ['ATTENDANCE', 'ASSIGNMENT', 'QUIZ', 'MIDTERM_EXAM', 'FINAL_EXAM']
    const providedComponents = new Set(dto.weights.map((w) => w.componentName))

    for (const comp of expectedComponents) {
      if (!providedComponents.has(comp)) {
        throw new BadRequestError(`Komponen penilaian '${comp}' wajib diikutsertakan dalam konfigurasi`)
      }
    }

    // Validasi total akumulasi bobot harus tepat 100%
    const totalPercentage = dto.weights.reduce((sum, w) => sum + Number(w.weightPercentage), 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new BadRequestError(
        `Total persentase bobot penilaian harus tepat 100.00%. Akumulasi saat ini: ${totalPercentage.toFixed(2)}%`
      )
    }

    const saved = await this.repo.upsertGradeWeights(classId, dto.weights)

    // Recalculate class gradebook so existing calculations stay updated
    try {
      await this.calculateAndPersistClassGradebook(classId, lecturerId)
    } catch (err) {
      console.warn('[GradebookService] Otomatisasi kalkulasi nilai setelah ubah bobot tertunda:', err)
    }

    return saved.map((w) => ({
      componentName: w.componentName as GradeComponent,
      weightPercentage: parseFloat(w.weightPercentage),
      description: w.description
    }))
  }

  /**
   * Menghitung rincian nilai seorang mahasiswa berdasarkan data mentah penilaian
   */
  private calculateStudentBreakdown(
    student: { studentId: string; name: string; nimNidn: string | null; email: string },
    data: ClassGradeAssessmentData,
    weightMap: Map<GradeComponent, number>
  ): StudentGradeBreakdownDto {
    const totalSessions = data.sessions.length > 0 ? data.sessions.length : 16

    // Attendance
    const studentLogs = data.attendanceLogs.filter((l) => l.studentId === student.studentId)
    const attendedSessions = studentLogs.filter((l) => l.status === 'PRESENT' || l.status === 'LATE').length
    const attendancePercentage = totalSessions > 0
      ? Math.round((attendedSessions / totalSessions) * 10000) / 100
      : 0
    const attendanceScore = attendancePercentage
    const attendanceWeight = weightMap.get('ATTENDANCE') ?? 10.0
    const weightedAttendance = Math.round(((attendanceScore * attendanceWeight) / 100) * 100) / 100
    const isEligible = attendancePercentage >= 75.0

    // Assignments
    const rawAssignments: { assignmentId: string; title: string; score: number; maxScore: number }[] = []
    let gradedAssignmentCount = 0
    let totalAssignmentScoreSum = 0

    for (const a of data.assignments) {
      const sub = data.submissions.find((s) => s.assignmentId === a.id && s.studentId === student.studentId)
      const maxScore = typeof a.maxScore === 'number' ? a.maxScore : parseFloat(a.maxScore || '100')
      let itemScore = 0

      if (sub && sub.score !== null && sub.score !== undefined) {
        itemScore = typeof sub.score === 'number' ? sub.score : parseFloat(String(sub.score))
        gradedAssignmentCount++
      }

      totalAssignmentScoreSum += itemScore
      rawAssignments.push({
        assignmentId: a.id,
        title: a.title,
        score: itemScore,
        maxScore
      })
    }

    const averageAssignmentScore = data.assignments.length > 0
      ? Math.round((totalAssignmentScoreSum / data.assignments.length) * 100) / 100
      : 0
    const assignmentWeight = weightMap.get('ASSIGNMENT') ?? 20.0
    const weightedAssignment = Math.round(((averageAssignmentScore * assignmentWeight) / 100) * 100) / 100

    // Quizzes (quizType = 'QUIZ')
    const regularQuizzes = data.quizzes.filter((q) => q.quizType === 'QUIZ')
    const rawQuizzes: { quizId: string; title: string; score: number; maxScore: number }[] = []
    let gradedQuizCount = 0
    let totalQuizScoreSum = 0

    for (const q of regularQuizzes) {
      const attempts = data.quizAttempts.filter((att) => att.quizId === q.id && att.studentId === student.studentId)
      const maxScore = typeof q.maxScore === 'number' ? q.maxScore : parseFloat(q.maxScore || '100')
      let bestScore = 0

      if (attempts.length > 0) {
        const scores = attempts
          .map((att) => (att.score !== null ? parseFloat(String(att.score)) : 0))
          .filter((s) => !isNaN(s))
        if (scores.length > 0) {
          bestScore = Math.max(...scores)
          gradedQuizCount++
        }
      }

      totalQuizScoreSum += bestScore
      rawQuizzes.push({
        quizId: q.id,
        title: q.title,
        score: bestScore,
        maxScore
      })
    }

    const averageQuizScore = regularQuizzes.length > 0
      ? Math.round((totalQuizScoreSum / regularQuizzes.length) * 100) / 100
      : 0
    const quizWeight = weightMap.get('QUIZ') ?? 15.0
    const weightedQuiz = Math.round(((averageQuizScore * quizWeight) / 100) * 100) / 100

    // Midterm Exam (quizType = 'MIDTERM_EXAM')
    const midtermQuiz = data.quizzes.find((q) => q.quizType === 'MIDTERM_EXAM')
    let midtermScore: number | null = null

    if (midtermQuiz) {
      const attempts = data.quizAttempts.filter((att) => att.quizId === midtermQuiz.id && att.studentId === student.studentId)
      if (attempts.length > 0) {
        const scores = attempts
          .map((att) => (att.score !== null ? parseFloat(String(att.score)) : 0))
          .filter((s) => !isNaN(s))
        midtermScore = scores.length > 0 ? Math.max(...scores) : 0
      } else {
        midtermScore = 0
      }
    }

    const midtermWeight = weightMap.get('MIDTERM_EXAM') ?? 25.0
    const effectiveMidtermScore = midtermScore ?? 0
    const weightedMidterm = Math.round(((effectiveMidtermScore * midtermWeight) / 100) * 100) / 100

    // Final Exam (quizType = 'FINAL_EXAM')
    const finalExamQuiz = data.quizzes.find((q) => q.quizType === 'FINAL_EXAM')
    let finalExamScore: number | null = null

    if (finalExamQuiz) {
      const attempts = data.quizAttempts.filter((att) => att.quizId === finalExamQuiz.id && att.studentId === student.studentId)
      if (attempts.length > 0) {
        const scores = attempts
          .map((att) => (att.score !== null ? parseFloat(String(att.score)) : 0))
          .filter((s) => !isNaN(s))
        finalExamScore = scores.length > 0 ? Math.max(...scores) : 0
      } else {
        finalExamScore = 0
      }
    }

    const finalExamWeight = weightMap.get('FINAL_EXAM') ?? 30.0
    const effectiveFinalExamScore = finalExamScore ?? 0
    const weightedFinalExam = Math.round(((effectiveFinalExamScore * finalExamWeight) / 100) * 100) / 100

    // Rumus PRD: NA = (W_absen * Skor_Presensi) + (W_tugas * Rata_Tugas) + (W_kuis * Rata_Kuis) + (W_UTS * Skor_UTS) + (W_UAS * Skor_UAS)
    const rawTotalScore = (
      (attendanceWeight * attendanceScore) +
      (assignmentWeight * averageAssignmentScore) +
      (quizWeight * averageQuizScore) +
      (midtermWeight * effectiveMidtermScore) +
      (finalExamWeight * effectiveFinalExamScore)
    ) / 100

    const finalNumericScore = Math.round(rawTotalScore * 100) / 100
    const isAttendanceDisqualified = !isEligible

    const { letterGrade, gradePoint } = this.convertScoreToLetterAndPoint(
      finalNumericScore,
      isAttendanceDisqualified
    )

    // Check existing stored final grade for persistent overrides or status
    const existing = data.finalGrades.find((fg) => fg.studentId === student.studentId)

    return {
      studentId: student.studentId,
      studentName: student.name,
      studentNim: student.nimNidn,
      studentEmail: student.email,
      attendance: {
        attendedSessions,
        totalSessions,
        attendancePercentage,
        score: attendanceScore,
        weightPercentage: attendanceWeight,
        weightedScore: weightedAttendance,
        isEligible
      },
      assignment: {
        totalAssignments: data.assignments.length,
        gradedCount: gradedAssignmentCount,
        rawScores: rawAssignments,
        averageScore: averageAssignmentScore,
        weightPercentage: assignmentWeight,
        weightedScore: weightedAssignment
      },
      quiz: {
        totalQuizzes: regularQuizzes.length,
        gradedCount: gradedQuizCount,
        rawScores: rawQuizzes,
        averageScore: averageQuizScore,
        weightPercentage: quizWeight,
        weightedScore: weightedQuiz
      },
      midtermExam: {
        quizId: midtermQuiz?.id ?? null,
        title: midtermQuiz?.title ?? null,
        score: midtermScore,
        weightPercentage: midtermWeight,
        weightedScore: weightedMidterm
      },
      finalExam: {
        quizId: finalExamQuiz?.id ?? null,
        title: finalExamQuiz?.title ?? null,
        score: finalExamScore,
        weightPercentage: finalExamWeight,
        weightedScore: weightedFinalExam
      },
      finalGrade: {
        id: existing?.id ?? null,
        numericScore: existing ? parseFloat(existing.totalScore) : finalNumericScore,
        letterGrade: (existing?.letterGrade as LetterGrade) ?? letterGrade,
        gradePoint: existing ? parseFloat(existing.gradePoint) : gradePoint,
        isAttendanceDisqualified,
        status: (existing?.status as GradeStatus) ?? 'DRAFT',
        publishedAt: existing?.publishedAt ? existing.publishedAt.toISOString() : null,
        updatedAt: existing?.updatedAt ? existing.updatedAt.toISOString() : null
      }
    }
  }

  /**
   * Mengambil data Gradebook kelas secara komprehensif
   */
  public async getClassGradebook(classId: string): Promise<ClassGradebookDto> {
    const data = await this.repo.findClassAssessmentData(classId)
    if (!data) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${classId}' tidak ditemukan`)
    }

    const effectiveWeights = await this.getEffectiveWeights(classId)
    const weightMap = new Map<GradeComponent, number>()
    for (const w of effectiveWeights) {
      weightMap.set(w.componentName, w.weightPercentage)
    }

    const students = data.enrolledStudents.map((st) =>
      this.calculateStudentBreakdown(st, data, weightMap)
    )

    // Agregasi statistik kelas
    const scores = students.map((s) => s.finalGrade.numericScore)
    const averageFinalScore = scores.length > 0
      ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100) / 100
      : null
    const highestScore = scores.length > 0 ? Math.max(...scores) : null
    const lowestScore = scores.length > 0 ? Math.min(...scores) : null

    const gradeDistribution: Record<LetterGrade, number> = {
      A: 0,
      AB: 0,
      B: 0,
      BC: 0,
      C: 0,
      D: 0,
      E: 0
    }

    for (const st of students) {
      const letter = st.finalGrade.letterGrade
      if (gradeDistribution[letter] !== undefined) {
        gradeDistribution[letter]++
      } else {
        gradeDistribution.E++
      }
    }

    return {
      classId,
      className: data.className,
      courseCode: data.courseCode,
      courseName: data.courseName,
      termName: data.termName,
      weights: effectiveWeights,
      totalStudents: students.length,
      averageFinalScore,
      highestScore,
      lowestScore,
      gradeDistribution,
      students
    }
  }

  /**
   * Menjalankan kalkulasi massal dan menyimpan/memperbarui rekaman ke tabel final_grades
   */
  public async calculateAndPersistClassGradebook(
    classId: string,
    lecturerId: string
  ): Promise<ClassGradebookDto> {
    const data = await this.repo.findClassAssessmentData(classId)
    if (!data) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${classId}' tidak ditemukan`)
    }

    const effectiveWeights = await this.getEffectiveWeights(classId)
    const weightMap = new Map<GradeComponent, number>()
    for (const w of effectiveWeights) {
      weightMap.set(w.componentName, w.weightPercentage)
    }

    const students = data.enrolledStudents.map((st) =>
      this.calculateStudentBreakdown(st, data, weightMap)
    )

    // Batch upsert to final_grades
    const recordsToUpsert = students.map((st) => ({
      classId,
      studentId: st.studentId,
      attendanceScore: st.attendance.score,
      assignmentScore: st.assignment.averageScore,
      quizScore: st.quiz.averageScore,
      midtermScore: st.midtermExam.score ?? 0,
      finalExamScore: st.finalExam.score ?? 0,
      totalScore: st.finalGrade.numericScore,
      letterGrade: st.finalGrade.letterGrade,
      gradePoint: st.finalGrade.gradePoint,
      status: st.finalGrade.status || 'DRAFT'
    }))

    await this.repo.batchUpsertFinalGrades(recordsToUpsert)

    // Re-fetch clean representation
    return await this.getClassGradebook(classId)
  }

  /**
   * Mengambil rincian nilai seorang mahasiswa secara spesifik (untuk portal Mahasiswa)
   */
  public async getStudentGrade(
    classId: string,
    studentId: string
  ): Promise<StudentGradeBreakdownDto> {
    const data = await this.repo.findClassAssessmentData(classId)
    if (!data) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${classId}' tidak ditemukan`)
    }

    const enrolled = data.enrolledStudents.find((st) => st.studentId === studentId)
    if (!enrolled) {
      throw new ForbiddenError('Anda tidak terdaftar sebagai mahasiswa aktif pada kelas perkuliahan ini')
    }

    const effectiveWeights = await this.getEffectiveWeights(classId)
    const weightMap = new Map<GradeComponent, number>()
    for (const w of effectiveWeights) {
      weightMap.set(w.componentName, w.weightPercentage)
    }

    return this.calculateStudentBreakdown(enrolled, data, weightMap)
  }

  /**
   * Penyesuaian nilai manual oleh Dosen lengkap dengan audit trail ke tabel grade_audit_logs
   */
  public async adjustStudentGradeManual(
    classId: string,
    dto: ManualGradeAdjustmentDto,
    changedById: string,
    ipAddress?: string
  ): Promise<{
    finalGrade: StudentGradeBreakdownDto['finalGrade']
    auditLog: GradeAuditLogDto
  }> {
    const data = await this.repo.findClassAssessmentData(classId)
    if (!data) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${classId}' tidak ditemukan`)
    }

    const enrolled = data.enrolledStudents.find((st) => st.studentId === dto.studentId)
    if (!enrolled) {
      throw new NotFoundError(`Mahasiswa dengan ID '${dto.studentId}' tidak terdaftar pada kelas ini`)
    }

    const effectiveWeights = await this.getEffectiveWeights(classId)
    const weightMap = new Map<GradeComponent, number>()
    for (const w of effectiveWeights) {
      weightMap.set(w.componentName, w.weightPercentage)
    }

    // Hitung baseline saat ini
    const currentBreakdown = this.calculateStudentBreakdown(enrolled, data, weightMap)
    const previousScore = currentBreakdown.finalGrade.numericScore
    const previousLetter = currentBreakdown.finalGrade.letterGrade

    // Tentukan skor komponen baru (jika dioverride)
    const newAttendanceScore = dto.attendanceScore ?? currentBreakdown.attendance.score
    const newAssignmentScore = dto.assignmentScore ?? currentBreakdown.assignment.averageScore
    const newQuizScore = dto.quizScore ?? currentBreakdown.quiz.averageScore
    const newMidtermScore = dto.midtermScore ?? (currentBreakdown.midtermExam.score ?? 0)
    const newFinalExamScore = dto.finalExamScore ?? (currentBreakdown.finalExam.score ?? 0)

    let newNumericScore: number

    if (dto.numericScore !== undefined && dto.numericScore !== null) {
      newNumericScore = Math.round(dto.numericScore * 100) / 100
    } else {
      const attendanceWeight = weightMap.get('ATTENDANCE') ?? 10.0
      const assignmentWeight = weightMap.get('ASSIGNMENT') ?? 20.0
      const quizWeight = weightMap.get('QUIZ') ?? 15.0
      const midtermWeight = weightMap.get('MIDTERM_EXAM') ?? 25.0
      const finalExamWeight = weightMap.get('FINAL_EXAM') ?? 30.0

      const calculated = (
        (attendanceWeight * newAttendanceScore) +
        (assignmentWeight * newAssignmentScore) +
        (quizWeight * newQuizScore) +
        (midtermWeight * newMidtermScore) +
        (finalExamWeight * newFinalExamScore)
      ) / 100
      newNumericScore = Math.round(calculated * 100) / 100
    }

    // Disqualification check: Kehadiran < 75.0% (menggunakan skor kehadiran baru jika disesuaikan, atau persentase aktual)
    const effectiveAttendancePercentage = dto.attendanceScore !== undefined
      ? newAttendanceScore
      : currentBreakdown.attendance.attendancePercentage
    const isAttendanceDisqualified = effectiveAttendancePercentage < 75.0

    const { letterGrade: newLetter, gradePoint: newGradePoint } = this.convertScoreToLetterAndPoint(
      newNumericScore,
      isAttendanceDisqualified
    )

    // Simpan / perbarui ke tabel final_grades
    const saved = await this.repo.upsertFinalGrade({
      classId,
      studentId: dto.studentId,
      attendanceScore: newAttendanceScore,
      assignmentScore: newAssignmentScore,
      quizScore: newQuizScore,
      midtermScore: newMidtermScore,
      finalExamScore: newFinalExamScore,
      totalScore: newNumericScore,
      letterGrade: newLetter,
      gradePoint: newGradePoint,
      status: currentBreakdown.finalGrade.status
    })

    // Simpan audit log ke tabel grade_audit_logs
    const auditRecord = await this.repo.createAuditLog({
      finalGradeId: saved.id,
      changedBy: changedById,
      previousScore,
      newScore: newNumericScore,
      previousLetter,
      newLetter,
      reason: dto.reason,
      ipAddress: ipAddress ?? null
    })

    const auditLogDto: GradeAuditLogDto = {
      id: auditRecord.id,
      finalGradeId: saved.id,
      studentName: enrolled.name,
      studentNim: enrolled.nimNidn,
      changedById,
      changedByName: 'Dosen / Admin',
      previousScore,
      newScore: newNumericScore,
      previousLetter,
      newLetter,
      reason: dto.reason,
      ipAddress: ipAddress ?? null,
      createdAt: auditRecord.createdAt instanceof Date ? auditRecord.createdAt.toISOString() : String(auditRecord.createdAt)
    }

    return {
      finalGrade: {
        id: saved.id,
        numericScore: newNumericScore,
        letterGrade: newLetter,
        gradePoint: newGradePoint,
        isAttendanceDisqualified,
        status: saved.status as GradeStatus,
        publishedAt: saved.publishedAt ? saved.publishedAt.toISOString() : null,
        updatedAt: saved.updatedAt ? saved.updatedAt.toISOString() : null
      },
      auditLog: auditLogDto
    }
  }

  /**
   * Mengambil riwayat audit log perubahan nilai manual kelas
   */
  public async getClassAuditLogs(classId: string): Promise<GradeAuditLogDto[]> {
    const classInfo = await this.repo.findClassInfo(classId)
    if (!classInfo) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${classId}' tidak ditemukan`)
    }
    return await this.repo.findAuditLogsByClass(classId)
  }

  /**
   * Memperbarui status nilai kelas (DRAFT, SUBMITTED, APPROVED, PUBLISHED)
   */
  public async updateClassGradeStatus(
    classId: string,
    status: GradeStatus,
    userId: string
  ): Promise<{ updatedCount: number; status: GradeStatus }> {
    const classInfo = await this.repo.findClassInfo(classId)
    if (!classInfo) {
      throw new NotFoundError(`Kelas perkuliahan dengan ID '${classId}' tidak ditemukan`)
    }

    const updatedCount = await this.repo.updateFinalGradesStatus(
      classId,
      status,
      status === 'APPROVED' || status === 'PUBLISHED' ? userId : undefined
    )

    return {
      updatedCount,
      status
    }
  }
}

export const gradebookService = new GradebookService()
