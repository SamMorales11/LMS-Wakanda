export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'RESUBMISSION_REQUESTED'

export type SubmissionTimingStatus = 'ON_TIME' | 'LATE'

export interface AssignmentDto {
  id: string
  classId: string
  sessionId: string | null
  sessionNumber?: number | null
  sessionTitle?: string | null
  title: string
  description?: string | null
  instructions?: string | null
  maxScore: string
  dueDate: string
  cutoffDate?: string | null
  allowLateSubmission: boolean
  latePenaltyPercentage: string
  allowedFileTypes: string
  maxFileSizeMb: number
  isPublished: boolean
  isExpired: boolean
  isClosed: boolean
  createdBy?: string | null
  creatorName?: string | null
  submissionCount?: number
  mySubmission?: SubmissionDto | null
  createdAt: string
  updatedAt: string
}

export interface CreateAssignmentDto {
  classId: string
  sessionId?: string | null
  title: string
  description?: string | null
  instructions?: string | null
  maxScore?: number
  dueDate: string
  cutoffDate?: string | null
  allowLateSubmission?: boolean
  latePenaltyPercentage?: number
  allowedFileTypes?: string
  maxFileSizeMb?: number
  isPublished?: boolean
}

export interface UpdateAssignmentDto {
  title?: string
  description?: string | null
  instructions?: string | null
  maxScore?: number
  dueDate?: string
  cutoffDate?: string | null
  allowLateSubmission?: boolean
  latePenaltyPercentage?: number
  allowedFileTypes?: string
  maxFileSizeMb?: number
  isPublished?: boolean
}

export interface SubmissionDto {
  id: string
  assignmentId: string
  studentId: string
  studentName?: string
  studentNim?: string | null
  studentEmail?: string
  fileKey?: string | null
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  fileType?: string | null
  contentText?: string | null
  submittedAt: string
  isLate: boolean
  timingStatus: SubmissionTimingStatus
  timingLabel: string
  timingColor: string
  score?: string | null
  feedback?: string | null
  gradedBy?: string | null
  graderName?: string | null
  gradedAt?: string | null
  status: SubmissionStatus
  createdAt: string
  updatedAt: string
}

export interface CreateSubmissionDto {
  assignmentId: string
  fileKey?: string | null
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  fileType?: string | null
  contentText?: string | null
}

export interface GradeSubmissionDto {
  score: number
  feedback?: string | null
}

export interface AssignmentSubmissionOverviewDto {
  assignment: AssignmentDto
  totalEnrolled: number
  submittedCount: number
  onTimeCount: number
  lateCount: number
  gradedCount: number
  submissions: SubmissionDto[]
}
