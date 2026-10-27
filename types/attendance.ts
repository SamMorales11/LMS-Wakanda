export type AttendanceStatus = 'PRESENT' | 'LATE' | 'PERMIT' | 'SICK' | 'ABSENT'

export type AttendanceMethod = 'TOKEN' | 'QR_SCAN' | 'MANUAL_LECTURER'

export interface AttendanceTokenDto {
  id: string
  sessionId: string
  token: string
  formattedToken: string
  qrCodeDataUrl?: string
  qrCodePayload?: string | null
  validFrom: string
  validUntil: string
  remainingSeconds: number
  isActive: boolean
  createdBy?: string | null
  createdAt: string
}

export interface OpenAttendanceSessionDto {
  sessionId: string
  durationMinutes?: number
}

export interface CheckInDto {
  token: string
  sessionId?: string
  deviceInfo?: string
}

export interface AttendanceLogDto {
  id: string
  sessionId: string
  studentId: string
  studentName?: string
  studentNim?: string | null
  studentEmail?: string
  status: AttendanceStatus
  checkInTime: string
  checkInMethod: AttendanceMethod
  deviceInfo?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface ManualAttendanceUpdateDto {
  sessionId: string
  studentId: string
  status: AttendanceStatus
  notes?: string
}

export interface StudentAttendanceSummaryDto {
  classId: string
  studentId: string
  studentName?: string
  studentNim?: string | null
  totalSessions: number
  attendedSessions: number
  presentCount: number
  lateCount: number
  permitCount: number
  sickCount: number
  absentCount: number
  attendancePercentage: number
  minimumRequirementPercentage: number
  isEligibleForFinalExam: boolean
  sessionLogs: AttendanceLogDto[]
}

export interface SessionAttendanceOverviewDto {
  sessionId: string
  sessionNumber: number
  sessionTitle: string
  activeToken: AttendanceTokenDto | null
  totalEnrolled: number
  presentCount: number
  lateCount: number
  permitCount: number
  sickCount: number
  absentCount: number
  logs: AttendanceLogDto[]
}
