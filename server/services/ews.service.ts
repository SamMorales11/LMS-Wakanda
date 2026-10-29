import type {
  EwsRiskLevel,
  EwsRiskColor,
  EwsInterventionUrgency,
  AttendanceTelemetryDto,
  AssignmentTelemetryDto,
  AcademicExamTelemetryDto,
  StudentInterventionRecommendationsDto,
  StudentEwsProfileDto,
  ClassEwsOverviewDto,
  DepartmentClassEwsItemDto,
  DepartmentEwsSummaryDto
} from '~/types'
import {
  ewsRepository,
  type IEwsRepository,
  type EwsRawClassData
} from '../repositories/ews.repository'
import { NotFoundError } from '../utils/errors'

export class EwsService {
  constructor(private readonly repo: IEwsRepository = ewsRepository) {}

  /**
   * Menghitung telemetri kehadiran mahasiswa
   */
  public evaluateAttendanceTelemetry(
    studentId: string,
    data: EwsRawClassData
  ): AttendanceTelemetryDto {
    const totalSessions = data.sessions.length > 0 ? data.sessions.length : 16
    const studentLogs = data.attendanceLogs.filter((l) => l.studentId === studentId)

    const presentCount = studentLogs.filter((l) => l.status === 'PRESENT').length
    const lateCount = studentLogs.filter((l) => l.status === 'LATE').length
    const absentCount = studentLogs.filter((l) => l.status === 'ABSENT').length
    const excusedCount = studentLogs.filter((l) => l.status === 'PERMIT' || l.status === 'SICK').length

    const attendedSessions = presentCount + lateCount
    const attendancePercentage = totalSessions > 0
      ? Math.round((attendedSessions / totalSessions) * 10000) / 100
      : 0

    const isDisqualified = attendancePercentage < 75.0
    const isNearThreshold = attendancePercentage >= 75.0 && attendancePercentage < 80.0

    const issues: string[] = []
    let riskLevel: EwsRiskLevel = 'SAFE'
    let riskScore = 0

    if (isDisqualified) {
      riskLevel = 'CRITICAL'
      riskScore = Math.min(100, Math.round(100 - (attendancePercentage * 0.3)))
      issues.push(
        `Persentase kehadiran ${attendancePercentage.toFixed(1)}% berada di bawah ambang batas minimal 75.0% (Diskualifikasi UAS otomatis ke huruf E).`
      )
    } else if (isNearThreshold) {
      riskLevel = 'WARNING'
      riskScore = Math.round((80.0 - attendancePercentage) * 7 + 35)
      issues.push(
        `Persentase kehadiran ${attendancePercentage.toFixed(1)}% mendekati ambang batas kritis 75.0% (Toleransi ketidakhadiran tersisa maksimal 1 kali).`
      )
    } else {
      riskLevel = 'SAFE'
      riskScore = Math.max(0, Math.round((100 - attendancePercentage) * 0.4))
    }

    if (absentCount > 0) {
      issues.push(`Terdapat ${absentCount} sesi tidak hadir tanpa keterangan resmi.`)
    }
    if (lateCount >= 3) {
      issues.push(`Frekuensi keterlambatan presensi tinggi (${lateCount} kali check-in terlambat).`)
    }

    return {
      totalSessions,
      attendedSessions,
      absentSessions: absentCount,
      lateSessions: lateCount,
      excusedSessions: excusedCount,
      attendancePercentage,
      isDisqualified,
      isNearThreshold,
      riskScore,
      riskLevel,
      issues
    }
  }

  /**
   * Menghitung telemetri kedisiplinan dan pengumpulan tugas
   */
  public evaluateAssignmentTelemetry(
    studentId: string,
    data: EwsRawClassData
  ): AssignmentTelemetryDto {
    const totalAssignments = data.assignments.length
    const studentSubs = data.submissions.filter((s) => s.studentId === studentId)

    const submittedCount = studentSubs.length
    const missingCount = Math.max(0, totalAssignments - submittedCount)
    const lateCount = studentSubs.filter((s) => s.isLate).length
    const onTimeCount = Math.max(0, submittedCount - lateCount)

    const submissionRate = totalAssignments > 0
      ? Math.round((submittedCount / totalAssignments) * 10000) / 100
      : 100

    // Hitung rata-rata skor tugas yang telah dinilai
    const gradedScores = studentSubs
      .map((s) => (s.score !== null ? parseFloat(String(s.score)) : null))
      .filter((s): s is number => s !== null && !isNaN(s))

    const averageScore = gradedScores.length > 0
      ? Math.round((gradedScores.reduce((sum, sc) => sum + sc, 0) / gradedScores.length) * 100) / 100
      : null

    const issues: string[] = []
    let riskLevel: EwsRiskLevel = 'SAFE'
    let riskScore = 0

    if (totalAssignments > 0) {
      if (missingCount >= 2 || submissionRate < 60) {
        riskLevel = 'CRITICAL'
        riskScore = Math.min(100, Math.round(75 + (missingCount * 8)))
        issues.push(`Terdapat ${missingCount} tugas yang tidak dikumpulkan sama sekali (Tingkat submit: ${submissionRate.toFixed(1)}%).`)
      } else if (missingCount === 1 || lateCount >= 2 || submissionRate < 80) {
        riskLevel = 'WARNING'
        riskScore = Math.min(69, Math.round(40 + (lateCount * 8) + (missingCount * 15)))
        if (missingCount === 1) {
          issues.push('Terdapat 1 tugas perkuliahan yang tidak dikumpulkan.')
        }
        if (lateCount >= 2) {
          issues.push(`Frekuensi pengumpulan melewati batas waktu normal tinggi (${lateCount} kali terlambat).`)
        }
      } else {
        riskLevel = 'SAFE'
        riskScore = lateCount === 1 ? 15 : 5
      }

      if (averageScore !== null && averageScore < 55.0) {
        issues.push(`Rata-rata capaian skor tugas (${averageScore.toFixed(1)}) berada di bawah standar kelulusan (< 55.0).`)
      }
    }

    return {
      totalAssignments,
      submittedCount,
      missingCount,
      lateCount,
      onTimeCount,
      submissionRate,
      averageScore,
      riskScore,
      riskLevel,
      issues
    }
  }

  /**
   * Menghitung telemetri performa ujian (Kuis & UTS)
   */
  public evaluateAcademicExamTelemetry(
    studentId: string,
    data: EwsRawClassData
  ): AcademicExamTelemetryDto {
    const regularQuizzes = data.quizzes.filter((q) => q.quizType === 'QUIZ')
    const midtermQuiz = data.quizzes.find((q) => q.quizType === 'MIDTERM_EXAM')

    // Rata-rata skor kuis mingguan (ambil attempt tertinggi tiap kuis)
    let quizScoreSum = 0
    let attendedQuizCount = 0

    for (const q of regularQuizzes) {
      const attempts = data.quizAttempts.filter((a) => a.quizId === q.id && a.studentId === studentId)
      if (attempts.length > 0) {
        const scores = attempts
          .map((a) => (a.score !== null ? parseFloat(String(a.score)) : (a.autoScore !== null ? parseFloat(String(a.autoScore)) : 0)))
          .filter((s) => !isNaN(s))
        if (scores.length > 0) {
          quizScoreSum += Math.max(...scores)
          attendedQuizCount++
        }
      }
    }

    const quizAverageScore = attendedQuizCount > 0
      ? Math.round((quizScoreSum / attendedQuizCount) * 100) / 100
      : null

    // Skor UTS (Pertemuan 8)
    let midtermScore: number | null = null
    if (midtermQuiz) {
      const attempts = data.quizAttempts.filter((a) => a.quizId === midtermQuiz.id && a.studentId === studentId)
      if (attempts.length > 0) {
        const scores = attempts
          .map((a) => (a.score !== null ? parseFloat(String(a.score)) : (a.autoScore !== null ? parseFloat(String(a.autoScore)) : 0)))
          .filter((s) => !isNaN(s))
        if (scores.length > 0) {
          midtermScore = Math.max(...scores)
        }
      }
    }

    // Skor gabungan evaluasi ujian (Kuis & UTS)
    let combinedExamAverage: number | null = null
    if (quizAverageScore !== null && midtermScore !== null) {
      combinedExamAverage = Math.round(((quizAverageScore + midtermScore) / 2) * 100) / 100
    } else if (midtermScore !== null) {
      combinedExamAverage = midtermScore
    } else if (quizAverageScore !== null) {
      combinedExamAverage = quizAverageScore
    }

    const isBelowPassingStandard = combinedExamAverage !== null && combinedExamAverage < 55.0
    const issues: string[] = []
    let riskLevel: EwsRiskLevel = 'SAFE'
    let riskScore = 0

    if (combinedExamAverage !== null) {
      if (combinedExamAverage < 45.0) {
        riskLevel = 'CRITICAL'
        riskScore = Math.min(100, Math.round(75 + (45.0 - combinedExamAverage) * 1.5))
        issues.push(
          `Rata-rata evaluasi ujian (${combinedExamAverage.toFixed(1)}) berada pada rentang huruf mutu E (< 45.0). Risiko kegagalan sangat tinggi.`
        )
      } else if (combinedExamAverage < 55.0) {
        riskLevel = 'CRITICAL'
        riskScore = Math.round(60 + (55.0 - combinedExamAverage) * 1.4)
        issues.push(
          `Rata-rata evaluasi ujian (${combinedExamAverage.toFixed(1)}) di bawah batas standar kelulusan minimum C (< 55.0).`
        )
      } else if (combinedExamAverage < 65.0) {
        riskLevel = 'WARNING'
        riskScore = Math.round(35 + (65.0 - combinedExamAverage) * 1.8)
        issues.push(
          `Capaian evaluasi kuis dan UTS (${combinedExamAverage.toFixed(1)}) berada di rentang marginal (55.0 - 64.9).`
        )
      } else {
        riskLevel = 'SAFE'
        riskScore = Math.max(0, Math.round((100 - combinedExamAverage) * 0.3))
      }

      if (midtermScore !== null && midtermScore < 50.0) {
        issues.push(`Skor Ujian Tengah Semester (UTS: ${midtermScore.toFixed(1)}) sangat rendah.`)
      }
    }

    return {
      totalQuizzes: regularQuizzes.length,
      quizAverageScore,
      midtermScore,
      combinedExamAverage,
      isBelowPassingStandard,
      riskScore,
      riskLevel,
      issues
    }
  }

  /**
   * Menghasilkan rekomendasi tindakan intervensi bagi Dosen, Admin Prodi, dan Dosen Wali (PA)
   */
  public generateInterventionRecommendations(
    attendance: AttendanceTelemetryDto,
    assignments: AssignmentTelemetryDto,
    exams: AcademicExamTelemetryDto,
    overallLevel: EwsRiskLevel
  ): StudentInterventionRecommendationsDto {
    const lecturerActions: string[] = []
    const programAdminActions: string[] = []
    const academicAdvisorActions: string[] = []

    let urgency: EwsInterventionUrgency = 'ROUTINE'
    if (overallLevel === 'CRITICAL') {
      urgency = 'IMMEDIATE'
    } else if (overallLevel === 'WARNING') {
      urgency = 'HIGH'
    }

    // Rekomendasi berdasarkan Kehadiran
    if (attendance.isDisqualified) {
      lecturerActions.push(
        'Segera laporkan status diskualifikasi kehadiran ke sistem dan konfirmasikan dokumen izin/sakit susulan jika ada.'
      )
      programAdminActions.push(
        'Terbitkan Surat Peringatan Akademik (SP-Presensi) dan kunci akses ujian akhir jika tidak ada permohonan dispensasi resmi.'
      )
      academicAdvisorActions.push(
        'Panggil mahasiswa untuk konseling tatap muka terkait kendala kehadiran dan mitigasi pengulangan mata kuliah.'
      )
    } else if (attendance.isNearThreshold) {
      lecturerActions.push(
        'Kirimkan notifikasi peringatan ambang batas presensi melalui workspace; ingatkan bahwa 1 kali absen lagi berakibat diskualifikasi.'
      )
      academicAdvisorActions.push(
        'Pantau kehadiran mingguan mahasiswa pada sisa pertemuan semester berjalan.'
      )
    }

    // Rekomendasi berdasarkan Tugas
    if (assignments.missingCount >= 2) {
      lecturerActions.push(
        `Buka kesempatan pengumpulan tugas susulan (late window) dengan penalti proporsional untuk ${assignments.missingCount} tugas yang bolong.`
      )
      programAdminActions.push(
        'Identifikasi apakah ada kendala akses infrastruktur laboratorium atau masalah konektivitas pada mahasiswa bersangkutan.'
      )
    } else if (assignments.missingCount === 1) {
      lecturerActions.push('Hubungi mahasiswa agar mengumpulkan 1 tugas yang tertinggal sebelum batas cutoff ditutup.')
    }

    if (assignments.lateCount >= 2) {
      lecturerActions.push(
        'Berikan bimbingan manajemen waktu dan asistensi teknis pengerjaan praktikum mandiri.'
      )
    }

    // Rekomendasi berdasarkan Ujian (Kuis & UTS)
    if (exams.isBelowPassingStandard) {
      lecturerActions.push(
        `Fasilitasi sesi tutorial sebaya (peer tutoring) dan tawarkan ujian remedial untuk memperbaiki skor UTS (${exams.midtermScore !== null ? exams.midtermScore.toFixed(1) : '< 55.0'}).`
      )
      academicAdvisorActions.push(
        'Tinjau beban studi SKS mahasiswa pada Kartu Rencana Studi (KRS) untuk menghindari kegagalan kumulatif.'
      )
      programAdminActions.push(
        'Daftarkan mahasiswa ke dalam program bimbingan belajar intensif program studi sebelum masa UAS.'
      )
    } else if (exams.riskLevel === 'WARNING') {
      lecturerActions.push('Berikan bank latihan soal dan kisi-kisi terarah guna persiapan menghadapi UAS.')
    }

    // Rekomendasi fallback jika Aman
    if (lecturerActions.length === 0) {
      lecturerActions.push('Pertahankan keaktifan dan apresiasi performa akademik mahasiswa.')
    }
    if (programAdminActions.length === 0) {
      programAdminActions.push('Pertahankan pemantauan telemetri rutin berkala.')
    }
    if (academicAdvisorActions.length === 0) {
      academicAdvisorActions.push('Verifikasi kemajuan studi reguler pada evaluasi tengah semester.')
    }

    return {
      urgency,
      lecturerActions,
      programAdminActions,
      academicAdvisorActions
    }
  }

  /**
   * Menghitung profil EWS lengkap per mahasiswa
   */
  public calculateStudentEwsProfile(
    student: { studentId: string; name: string; nimNidn: string | null; email: string },
    data: EwsRawClassData
  ): StudentEwsProfileDto {
    const attendance = this.evaluateAttendanceTelemetry(student.studentId, data)
    const assignments = this.evaluateAssignmentTelemetry(student.studentId, data)
    const exams = this.evaluateAcademicExamTelemetry(student.studentId, data)

    // Bobot Komposit PRD: Presensi 40%, Tugas 30%, Akademik 30%
    let compositeScore = Math.round(
      (attendance.riskScore * 0.4) +
      (assignments.riskScore * 0.3) +
      (exams.riskScore * 0.3)
    )

    // Aturan Kritis Otomatis
    let overallRiskLevel: EwsRiskLevel = 'SAFE'
    if (attendance.isDisqualified || (exams.combinedExamAverage !== null && exams.combinedExamAverage < 45.0) || compositeScore >= 70) {
      overallRiskLevel = 'CRITICAL'
      compositeScore = Math.max(75, compositeScore)
    } else if (attendance.isNearThreshold || assignments.missingCount >= 1 || exams.isBelowPassingStandard || compositeScore >= 35) {
      overallRiskLevel = 'WARNING'
      compositeScore = Math.max(35, compositeScore)
    } else {
      overallRiskLevel = 'SAFE'
    }

    let riskColor: EwsRiskColor = '#16A34A'
    let riskLabel: 'Aman' | 'Waspada' | 'Kritis' = 'Aman'

    if (overallRiskLevel === 'CRITICAL') {
      riskColor = '#DC2626'
      riskLabel = 'Kritis'
    } else if (overallRiskLevel === 'WARNING') {
      riskColor = '#D97706'
      riskLabel = 'Waspada'
    }

    const interventionRecommendations = this.generateInterventionRecommendations(
      attendance,
      assignments,
      exams,
      overallRiskLevel
    )

    return {
      studentId: student.studentId,
      studentName: student.name,
      studentNim: student.nimNidn,
      studentEmail: student.email,
      compositeRiskScore: Math.min(100, Math.max(0, compositeScore)),
      overallRiskLevel,
      riskColor,
      riskLabel,
      attendance,
      assignments,
      exams,
      interventionRecommendations
    }
  }

  /**
   * Analisis EWS kelas secara komprehensif
   */
  public async getClassEwsOverview(classId: string): Promise<ClassEwsOverviewDto> {
    const data = await this.repo.findClassTelemetry(classId)
    if (!data) {
      throw new NotFoundError(`Kelas dengan ID '${classId}' tidak ditemukan`)
    }

    const studentProfiles = data.enrolledStudents.map((st) =>
      this.calculateStudentEwsProfile(st, data)
    )

    const criticalCount = studentProfiles.filter((s) => s.overallRiskLevel === 'CRITICAL').length
    const warningCount = studentProfiles.filter((s) => s.overallRiskLevel === 'WARNING').length
    const safeCount = studentProfiles.filter((s) => s.overallRiskLevel === 'SAFE').length

    const totalStudents = studentProfiles.length
    const avgRisk = totalStudents > 0
      ? Math.round((studentProfiles.reduce((sum, s) => sum + s.compositeRiskScore, 0) / totalStudents) * 100) / 100
      : 0

    const atRiskPercentage = totalStudents > 0
      ? Math.round(((criticalCount + warningCount) / totalStudents) * 10000) / 100
      : 0

    // Rekomendasi intervensi level kelas
    const recommendedClassInterventions: string[] = []
    if (criticalCount > 0) {
      recommendedClassInterventions.push(
        `Perhatian Mendesak: Terdapat ${criticalCount} mahasiswa berstatus Kritis (#DC2626). Segera lakukan penjadwalan konseling akademik sebelum batas UAS.`
      )
    }
    if (warningCount > 0) {
      recommendedClassInterventions.push(
        `Pemantauan Kelas: Terdapat ${warningCount} mahasiswa berstatus Waspada (#D97706) yang membutuhkan pendampingan tugas dan presensi.`
      )
    }
    if (atRiskPercentage >= 30) {
      recommendedClassInterventions.push(
        'Sebanyak >30% peserta kelas berada dalam zona berisiko. Disarankan mengadakan review materi silabus dan sesi konsultasi terbuka.'
      )
    }
    if (recommendedClassInterventions.length === 0) {
      recommendedClassInterventions.push('Kinerja dan kedisiplinan seluruh peserta kelas berada dalam kategori Aman (#16A34A).')
    }

    // Urutkan mahasiswa: Kritis paling atas, lalu Waspada, lalu Aman
    studentProfiles.sort((a, b) => b.compositeRiskScore - a.compositeRiskScore)

    return {
      classId: data.classId,
      className: data.classCode,
      courseCode: data.courseCode,
      courseName: data.courseName,
      termName: data.termName,
      lecturerName: data.lecturerName,
      totalEnrolledStudents: totalStudents,
      riskSummary: {
        safeCount,
        warningCount,
        criticalCount,
        averageCompositeRisk: avgRisk,
        atRiskPercentage
      },
      criticalStudentsCount: criticalCount,
      warningStudentsCount: warningCount,
      safeStudentsCount: safeCount,
      recommendedClassInterventions,
      students: studentProfiles
    }
  }

  /**
   * Analisis telemetri EWS mendalam untuk seorang mahasiswa tertentu
   */
  public async getStudentEwsDetail(
    classId: string,
    studentId: string
  ): Promise<StudentEwsProfileDto> {
    const data = await this.repo.findClassTelemetry(classId)
    if (!data) {
      throw new NotFoundError(`Kelas dengan ID '${classId}' tidak ditemukan`)
    }

    const student = data.enrolledStudents.find((s) => s.studentId === studentId)
    if (!student) {
      throw new NotFoundError(`Mahasiswa dengan ID '${studentId}' tidak terdaftar pada kelas ini`)
    }

    return this.calculateStudentEwsProfile(student, data)
  }

  /**
   * Ringkasan analitik EWS lintas kelas untuk Admin Prodi / Kaprodi
   */
  public async getDepartmentEwsOverview(): Promise<DepartmentEwsSummaryDto> {
    const classesData = await this.repo.findAllActiveClassesTelemetry()

    const classItems: DepartmentClassEwsItemDto[] = []
    let totalStudentsAnalyzed = 0
    let totalSafe = 0
    let totalWarning = 0
    let totalCritical = 0
    let totalRiskSum = 0

    for (const c of classesData) {
      const studentProfiles = c.enrolledStudents.map((st) =>
        this.calculateStudentEwsProfile(st, c)
      )

      const crit = studentProfiles.filter((s) => s.overallRiskLevel === 'CRITICAL').length
      const warn = studentProfiles.filter((s) => s.overallRiskLevel === 'WARNING').length
      const safe = studentProfiles.filter((s) => s.overallRiskLevel === 'SAFE').length
      const total = studentProfiles.length

      const classAvgRisk = total > 0
        ? Math.round((studentProfiles.reduce((sum, s) => sum + s.compositeRiskScore, 0) / total) * 100) / 100
        : 0

      const atRiskPct = total > 0
        ? Math.round(((crit + warn) / total) * 10000) / 100
        : 0

      totalStudentsAnalyzed += total
      totalSafe += safe
      totalWarning += warn
      totalCritical += crit
      totalRiskSum += (classAvgRisk * total)

      classItems.push({
        classId: c.classId,
        classCode: c.classCode,
        courseCode: c.courseCode,
        courseName: c.courseName,
        lecturerName: c.lecturerName,
        totalStudents: total,
        safeCount: safe,
        warningCount: warn,
        criticalCount: crit,
        averageRiskScore: classAvgRisk,
        atRiskPercentage: atRiskPct
      })
    }

    const avgDeptRisk = totalStudentsAnalyzed > 0
      ? Math.round((totalRiskSum / totalStudentsAnalyzed) * 100) / 100
      : 0

    const overallAtRiskPct = totalStudentsAnalyzed > 0
      ? Math.round(((totalCritical + totalWarning) / totalStudentsAnalyzed) * 10000) / 100
      : 0

    // Kelas dengan risiko tinggi (persentase mahasiswa berisiko >= 25%)
    const highRiskClasses = classItems
      .filter((cl) => cl.atRiskPercentage >= 25.0 || cl.criticalCount > 0)
      .sort((a, b) => b.atRiskPercentage - a.atRiskPercentage)

    const termName = classesData.length > 0 ? classesData[0].termName : 'T.A. 2026/2027 Ganjil'

    return {
      termName,
      totalClassesAnalyzed: classesData.length,
      totalStudentsAnalyzed,
      overallSafeCount: totalSafe,
      overallWarningCount: totalWarning,
      overallCriticalCount: totalCritical,
      averageDepartmentRisk: avgDeptRisk,
      overallAtRiskPercentage: overallAtRiskPct,
      highRiskClasses,
      classes: classItems
    }
  }
}

export const ewsService = new EwsService()
