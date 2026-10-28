export type QuizType = 'QUIZ' | 'MIDTERM_EXAM' | 'FINAL_EXAM'

export type QuestionType = 'MULTIPLE_CHOICE' | 'ESSAY'

export type QuizAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'TIMED_OUT'

export type QuizAccessStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED'

export interface QuizQuestionOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  type: QuestionType
  prompt: string
  points: number
  options?: QuizQuestionOption[]
  correctOptionId?: string | null
  explanation?: string | null
  rubric?: string | null
}

export interface QuizQuestionStudentView {
  id: string
  type: QuestionType
  prompt: string
  points: number
  options?: QuizQuestionOption[]
}

export interface StudentAnswerDto {
  questionId: string
  selectedOptionId?: string | null
  essayAnswer?: string | null
}

export interface QuizAttemptAnswer {
  questionId: string
  questionType: QuestionType
  selectedOptionId?: string | null
  essayAnswer?: string | null
  isCorrect?: boolean | null
  scoreAwarded?: number | null
  lecturerFeedback?: string | null
}

export interface QuizDto {
  id: string
  classId: string
  sessionId: string | null
  sessionNumber?: number | null
  sessionTitle?: string | null
  title: string
  description: string | null
  quizType: QuizType
  durationMinutes: number
  maxScore: string
  passingScore: string
  startTime: string
  endTime: string
  shuffleQuestions: boolean
  maxAttempts: number
  isPublished: boolean
  questionsCount: number
  questions?: QuizQuestion[] | null
  createdBy?: string | null
  createdAt: string
  updatedAt: string
  accessStatus: QuizAccessStatus
  myAttemptsCount?: number
  myLatestAttempt?: QuizAttemptDto | null
}

export interface CreateQuizDto {
  classId: string
  sessionId?: string | null
  title: string
  description?: string | null
  quizType?: QuizType
  durationMinutes?: number
  maxScore?: number
  passingScore?: number
  startTime: string
  endTime: string
  shuffleQuestions?: boolean
  maxAttempts?: number
  isPublished?: boolean
  questions: QuizQuestion[]
}

export interface UpdateQuizDto {
  title?: string
  description?: string | null
  quizType?: QuizType
  sessionId?: string | null
  durationMinutes?: number
  maxScore?: number
  passingScore?: number
  startTime?: string
  endTime?: string
  shuffleQuestions?: boolean
  maxAttempts?: number
  isPublished?: boolean
  questions?: QuizQuestion[]
}

export interface QuizAttemptDto {
  id: string
  quizId: string
  quizTitle?: string
  studentId: string
  studentName?: string
  studentNim?: string
  attemptNumber: number
  startedAt: string
  submittedAt: string | null
  durationSpentSeconds?: number | null
  remainingSeconds?: number
  deadlineAt: string
  score: string | null
  autoScore?: string | null
  manualScore?: string | null
  status: QuizAttemptStatus
  feedback: string | null
  questionOrder?: string[]
  questions?: QuizQuestionStudentView[]
  answers?: QuizAttemptAnswer[]
  createdAt: string
  updatedAt: string
}

export interface StartQuizAttemptResponseDto {
  attempt: QuizAttemptDto
  questions: QuizQuestionStudentView[]
  remainingSeconds: number
  deadlineAt: string
}

export interface SubmitQuizDto {
  answers: StudentAnswerDto[]
}

export interface GradeQuizEssayDto {
  answers: {
    questionId: string
    scoreAwarded: number
    lecturerFeedback?: string | null
  }[]
  feedback?: string | null
}

export interface QuizAttemptOverviewDto {
  quiz: QuizDto
  totalAttempts: number
  totalStudents: number
  averageScore: number
  highestScore: number
  lowestScore: number
  attempts: QuizAttemptDto[]
}
