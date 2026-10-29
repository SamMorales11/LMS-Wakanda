export type ReportExportFormat = 'xlsx' | 'html' | 'json'

export type AttendanceMatrixStatusCode = 'H' | 'I' | 'S' | 'A' | 'T' | '-'

export interface AttendanceMatrixCellDto {
  sessionId: string
  sessionNumber: number
  sessionDate?: string
  sessionType?: string
  status: 'PRESENT' | 'PERMIT' | 'SICK' | 'ABSENT' | 'LATE' | 'NONE'
  statusCode: AttendanceMatrixStatusCode
  statusLabel: string
  checkInTime?: string | null
}

export interface StudentAttendanceMatrixRowDto {
  studentId: string
  studentName: string
  studentNim: string | null
  studentEmail: string
  sessions: AttendanceMatrixCellDto[]
  totalPresent: number // H (Hadir)
  totalLate: number // T (Terlambat)
  totalPermit: number // I (Izin)
  totalSick: number // S (Sakit)
  totalAbsent: number // A (Alpa / Tanpa Keterangan)
  totalAttended: number // H + T
  attendancePercentage: number // (totalAttended / totalSessions) * 100
  isEligibleForUas: boolean // >= 75.0%
}

export interface AttendanceMatrixReportDto {
  classId: string
  className: string
  courseCode: string
  courseName: string
  credits: number
  termName: string
  lecturerName: string
  lecturerNidn: string | null
  totalSessions: number
  sessions: {
    id: string
    sessionNumber: number
    title: string
    sessionDate: string
    sessionType: string
    status: string
  }[]
  students: StudentAttendanceMatrixRowDto[]
  classAverageAttendance: number
  eligibleCount: number
  disqualifiedCount: number
}

export interface AcademicReportMetadata {
  institutionName: string
  institutionSubName: string
  facultyName: string
  programName: string
  campusAddress: string
  campusContact: string
  academicYear: string
  termName: string
  courseCode: string
  courseName: string
  credits: number
  classCode: string
  schedule: string
  room: string
  lecturerName: string
  lecturerNidn: string | null
  headOfDepartmentName: string
  headOfDepartmentNidn: string | null
  generatedAt: string
}
