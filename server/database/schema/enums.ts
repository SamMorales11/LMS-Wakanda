import { pgEnum } from 'drizzle-orm/pg-core'

// User Roles in PRD: lecturer, student, admin
export const userRoleEnum = pgEnum('user_role', ['admin', 'lecturer', 'student'])

// Academic Term Semester Types
export const termSemesterEnum = pgEnum('term_semester', ['ODD', 'EVEN', 'SHORT'])

// Class Session Types (covering 16-session standard: lectures, UTS, UAS, etc.)
export const sessionTypeEnum = pgEnum('session_type', [
  'REGULAR',
  'MIDTERM_EXAM',
  'FINAL_EXAM',
  'LABORATORY',
  'QUIZ'
])

// Class Session Status
export const sessionStatusEnum = pgEnum('session_status', [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
])

// Class Enrollment Status
export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'ENROLLED',
  'DROPPED',
  'COMPLETED',
  'PENDING'
])

// Attendance Status
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'PRESENT',
  'LATE',
  'PERMIT',
  'SICK',
  'ABSENT'
])

// Attendance Verification Method
export const attendanceMethodEnum = pgEnum('attendance_method', [
  'TOKEN',
  'QR_SCAN',
  'MANUAL_LECTURER'
])

// Submission Status
export const submissionStatusEnum = pgEnum('submission_status', [
  'SUBMITTED',
  'GRADED',
  'RESUBMISSION_REQUESTED'
])

// Quiz Attempt Status
export const quizAttemptStatusEnum = pgEnum('quiz_attempt_status', [
  'IN_PROGRESS',
  'SUBMITTED',
  'GRADED',
  'TIMED_OUT'
])

// Final Grade Approval Status
export const gradeStatusEnum = pgEnum('grade_status', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'PUBLISHED'
])
