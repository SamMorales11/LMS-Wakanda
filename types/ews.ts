export type EwsRiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL'

export type EwsRiskColor = '#16A34A' | '#D97706' | '#DC2626'

export type EwsInterventionUrgency = 'IMMEDIATE' | 'HIGH' | 'ROUTINE'

export interface AttendanceTelemetryDto {
  totalSessions: number
  attendedSessions: number
  absentSessions: number
  lateSessions: number
  excusedSessions: number
  attendancePercentage: number
  isDisqualified: boolean // true jika < 75.0%
  isNearThreshold: boolean // true jika 75.0% <= percentage < 80.0%
  riskScore: number // 0 - 100
  riskLevel: EwsRiskLevel
  issues: string[]
}

export interface AssignmentTelemetryDto {
  totalAssignments: number
  submittedCount: number
  missingCount: number
  lateCount: number
  onTimeCount: number
  submissionRate: number // 0 - 100%
  averageScore: number | null
  riskScore: number // 0 - 100
  riskLevel: EwsRiskLevel
  issues: string[]
}

export interface AcademicExamTelemetryDto {
  totalQuizzes: number
  quizAverageScore: number | null
  midtermScore: number | null
  combinedExamAverage: number | null
  isBelowPassingStandard: boolean // true jika combinedExamAverage < 55.0
  riskScore: number // 0 - 100
  riskLevel: EwsRiskLevel
  issues: string[]
}

export interface StudentInterventionRecommendationsDto {
  urgency: EwsInterventionUrgency
  lecturerActions: string[]
  programAdminActions: string[]
  academicAdvisorActions: string[]
}

export interface StudentEwsProfileDto {
  studentId: string
  studentName: string
  studentNim: string | null
  studentEmail: string
  compositeRiskScore: number // 0 - 100
  overallRiskLevel: EwsRiskLevel
  riskColor: EwsRiskColor
  riskLabel: 'Aman' | 'Waspada' | 'Kritis'
  attendance: AttendanceTelemetryDto
  assignments: AssignmentTelemetryDto
  exams: AcademicExamTelemetryDto
  interventionRecommendations: StudentInterventionRecommendationsDto
}

export interface ClassEwsOverviewDto {
  classId: string
  className: string
  courseCode: string
  courseName: string
  termName: string
  lecturerName: string | null
  totalEnrolledStudents: number
  riskSummary: {
    safeCount: number
    warningCount: number
    criticalCount: number
    averageCompositeRisk: number
    atRiskPercentage: number // (warning + critical) / total * 100
  }
  criticalStudentsCount: number
  warningStudentsCount: number
  safeStudentsCount: number
  recommendedClassInterventions: string[]
  students: StudentEwsProfileDto[]
}

export interface DepartmentClassEwsItemDto {
  classId: string
  classCode: string
  courseCode: string
  courseName: string
  lecturerName: string | null
  totalStudents: number
  safeCount: number
  warningCount: number
  criticalCount: number
  averageRiskScore: number
  atRiskPercentage: number
}

export interface DepartmentEwsSummaryDto {
  termName: string
  totalClassesAnalyzed: number
  totalStudentsAnalyzed: number
  overallSafeCount: number
  overallWarningCount: number
  overallCriticalCount: number
  averageDepartmentRisk: number
  overallAtRiskPercentage: number
  highRiskClasses: DepartmentClassEwsItemDto[]
  classes: DepartmentClassEwsItemDto[]
}
