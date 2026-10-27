export type TermSemester = 'ODD' | 'EVEN' | 'SHORT'
export type SessionType = 'REGULAR' | 'MIDTERM_EXAM' | 'FINAL_EXAM' | 'LABORATORY' | 'QUIZ'
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface AcademicTermDto {
  id: string
  code: string
  name: string
  year: string
  semester: TermSemester
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAcademicTermDto {
  code: string
  name: string
  year: string
  semester: TermSemester
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface UpdateAcademicTermDto {
  code?: string
  name?: string
  year?: string
  semester?: TermSemester
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export interface CourseDto {
  id: string
  programId: string
  code: string
  name: string
  credits: number
  semester: number
  description?: string | null
  syllabusUrl?: string | null
  isActive: boolean
  programName?: string
  programCode?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCourseDto {
  programId: string
  code: string
  name: string
  credits: number
  semester: number
  description?: string
  syllabusUrl?: string
}

export interface UpdateCourseDto {
  programId?: string
  code?: string
  name?: string
  credits?: number
  semester?: number
  description?: string
  syllabusUrl?: string
  isActive?: boolean
}

export interface CourseClassDto {
  id: string
  courseId: string
  academicTermId: string
  code: string
  capacity: number
  room?: string | null
  scheduleDay?: string | null
  scheduleStart?: string | null
  scheduleEnd?: string | null
  isActive: boolean
  courseName?: string
  courseCode?: string
  termName?: string
  termCode?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCourseClassDto {
  courseId: string
  academicTermId: string
  code: string // e.g. "A", "B", "TI-3A"
  capacity?: number
  room?: string
  scheduleDay?: string
  scheduleStart?: string // e.g. "08:00:00"
  scheduleEnd?: string // e.g. "10:30:00"
  startDate?: string // Tanggal mulai sesi 1 (default: term startDate)
  lecturerId?: string // Optional dosen pengampu utama
}

export interface UpdateCourseClassDto {
  code?: string
  capacity?: number
  room?: string
  scheduleDay?: string
  scheduleStart?: string
  scheduleEnd?: string
  isActive?: boolean
}

export interface ClassSessionDto {
  id: string
  classId: string
  sessionNumber: number
  title: string
  topicDescription?: string | null
  sessionDate: string
  startTime: string
  endTime: string
  sessionType: SessionType
  status: SessionStatus
  createdAt: string
  updatedAt: string
}

export interface GradeWeightDto {
  id: string
  classId: string
  componentName: string
  weightPercentage: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export interface CourseClassDetailDto extends CourseClassDto {
  sessions: ClassSessionDto[]
  gradeWeights: GradeWeightDto[]
  lecturers: Array<{
    id: string
    name: string
    email: string
    nimNidn?: string | null
    isPrimary: boolean
  }>
}
