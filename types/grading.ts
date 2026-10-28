import type { QuizType, QuizAttemptStatus, SubmissionStatus, SubmissionTimingStatus } from './index'

export interface GradingSubmissionItemDto {
  submissionId: string
  assignmentId: string
  assignmentTitle: string
  maxScore: number
  studentId: string
  studentName: string
  studentNim: string | null
  studentEmail: string
  fileKey: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  signedReadUrl: string | null
  urlExpiresAt: string | null
  contentText: string | null
  submittedAt: string
  isLate: boolean
  timingStatus: SubmissionTimingStatus
  timingLabel: string
  timingColor: string
  score: number | null
  percentage: number | null
  feedback: string | null
  rubricFeedback: string | null
  revisionNotes: string | null
  status: SubmissionStatus
  gradedBy: string | null
  graderName: string | null
  gradedAt: string | null
}

export interface CollectiveSubmissionsDto {
  assignmentId: string
  assignmentTitle: string
  classId: string
  maxScore: number
  dueDate: string
  cutoffDate: string | null
  totalEnrolled: number
  submittedCount: number
  gradedCount: number
  resubmissionCount: number
  pendingCount: number
  averageScore: number | null
  highestScore: number | null
  lowestScore: number | null
  submissions: GradingSubmissionItemDto[]
}

export interface GradeSubmissionPayloadDto {
  score: number
  feedback?: string | null
  rubricFeedback?: string | null
  revisionNotes?: string | null
  status?: 'GRADED' | 'RESUBMISSION_REQUESTED'
}

export interface BatchGradeSubmissionDto {
  grades: {
    submissionId: string
    score: number
    feedback?: string | null
    rubricFeedback?: string | null
    revisionNotes?: string | null
    status?: 'GRADED' | 'RESUBMISSION_REQUESTED'
  }[]
}

export interface GradingEssayAnswerItemDto {
  questionId: string
  prompt: string
  rubric?: string | null
  maxPoints: number
  essayAnswer: string
  scoreAwarded: number | null
  lecturerFeedback: string | null
}

export interface GradingQuizAttemptItemDto {
  attemptId: string
  quizId: string
  quizTitle: string
  quizType: QuizType
  maxScore: number
  passingScore: number
  studentId: string
  studentName: string
  studentNim: string | null
  startedAt: string
  submittedAt: string | null
  status: QuizAttemptStatus
  autoScore: number
  manualScore: number | null
  totalScore: number | null
  percentage: number | null
  isPassed: boolean
  generalFeedback: string | null
  essayAnswers: GradingEssayAnswerItemDto[]
  gradedBy: string | null
  graderName: string | null
  gradedAt: string | null
}

export interface CollectiveQuizAttemptsDto {
  quizId: string
  quizTitle: string
  classId: string
  quizType: QuizType
  maxScore: number
  passingScore: number
  totalAttempts: number
  gradedCount: number
  pendingEssayCount: number
  averageScore: number | null
  highestScore: number | null
  lowestScore: number | null
  attempts: GradingQuizAttemptItemDto[]
}

export interface GradeEssayPayloadDto {
  answers: {
    questionId: string
    scoreAwarded: number
    lecturerFeedback?: string | null
  }[]
  feedback?: string | null
}
