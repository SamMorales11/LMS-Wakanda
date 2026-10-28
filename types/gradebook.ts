export type GradeComponent = 'ATTENDANCE' | 'ASSIGNMENT' | 'QUIZ' | 'MIDTERM_EXAM' | 'FINAL_EXAM'

export type GradeStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED'

export type LetterGrade = 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'E'

export interface GradeWeightItemDto {
  componentName: GradeComponent
  weightPercentage: number
  description?: string | null
}

export interface ConfigureGradeWeightsDto {
  weights: GradeWeightItemDto[]
}

export interface ComponentScoreBreakdownDto {
  score: number // 0 - 100
  weightPercentage: number
  weightedScore: number
  details?: Record<string, any>
}

export interface StudentGradeBreakdownDto {
  studentId: string
  studentName: string
  studentNim: string | null
  studentEmail: string
  attendance: {
    attendedSessions: number
    totalSessions: number
    attendancePercentage: number
    score: number
    weightPercentage: number
    weightedScore: number
    isEligible: boolean // >= 75.0%
  }
  assignment: {
    totalAssignments: number
    gradedCount: number
    rawScores: {
      assignmentId: string
      title: string
      score: number
      maxScore: number
    }[]
    averageScore: number
    weightPercentage: number
    weightedScore: number
  }
  quiz: {
    totalQuizzes: number
    gradedCount: number
    rawScores: {
      quizId: string
      title: string
      score: number
      maxScore: number
    }[]
    averageScore: number
    weightPercentage: number
    weightedScore: number
  }
  midtermExam: {
    quizId?: string | null
    title?: string | null
    score: number | null
    weightPercentage: number
    weightedScore: number
  }
  finalExam: {
    quizId?: string | null
    title?: string | null
    score: number | null
    weightPercentage: number
    weightedScore: number
  }
  finalGrade: {
    id?: string | null
    numericScore: number
    letterGrade: LetterGrade
    gradePoint: number
    isAttendanceDisqualified: boolean // true if attendance < 75% forced letter 'E'
    status: GradeStatus
    publishedAt?: string | null
    updatedAt?: string | null
  }
}

export interface ClassGradebookDto {
  classId: string
  className: string
  courseCode: string
  courseName: string
  termName: string
  weights: GradeWeightItemDto[]
  totalStudents: number
  averageFinalScore: number | null
  highestScore: number | null
  lowestScore: number | null
  gradeDistribution: Record<LetterGrade, number>
  students: StudentGradeBreakdownDto[]
}

export interface ManualGradeAdjustmentDto {
  studentId: string
  numericScore?: number
  attendanceScore?: number
  assignmentScore?: number
  quizScore?: number
  midtermScore?: number
  finalExamScore?: number
  reason: string
}

export interface GradeAuditLogDto {
  id: string
  finalGradeId: string
  studentName: string
  studentNim: string | null
  changedById: string
  changedByName: string
  previousScore: number | null
  newScore: number
  previousLetter: LetterGrade | null
  newLetter: LetterGrade
  reason: string
  ipAddress: string | null
  createdAt: string
}
