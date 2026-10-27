import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

// 1. Enums
export * from './enums'

// 2. Tables
export * from './users'
export * from './academics'
export * from './sessions'
export * from './enrollments'
export * from './attendance'
export * from './assessments'
export * from './grades'
export * from './materials'

// 3. Relations
export * from './relations'

// 4. Type-Safe Model Definitions (Inferred Types)
import { users } from './users'
import { programs, academicTerms, courses, courseClasses, classLecturers } from './academics'
import { classSessions } from './sessions'
import { classEnrollments } from './enrollments'
import { attendanceTokens, attendanceLogs } from './attendance'
import { assignments, submissions, quizzes, quizAttempts } from './assessments'
import { gradeWeights, finalGrades, gradeAuditLogs } from './grades'
import { sessionMaterials, materialReadProgress } from './materials'

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Program = InferSelectModel<typeof programs>
export type NewProgram = InferInsertModel<typeof programs>

export type AcademicTerm = InferSelectModel<typeof academicTerms>
export type NewAcademicTerm = InferInsertModel<typeof academicTerms>

export type Course = InferSelectModel<typeof courses>
export type NewCourse = InferInsertModel<typeof courses>

export type CourseClass = InferSelectModel<typeof courseClasses>
export type NewCourseClass = InferInsertModel<typeof courseClasses>

export type ClassLecturer = InferSelectModel<typeof classLecturers>
export type NewClassLecturer = InferInsertModel<typeof classLecturers>

export type ClassSession = InferSelectModel<typeof classSessions>
export type NewClassSession = InferInsertModel<typeof classSessions>

export type ClassEnrollment = InferSelectModel<typeof classEnrollments>
export type NewClassEnrollment = InferInsertModel<typeof classEnrollments>

export type AttendanceToken = InferSelectModel<typeof attendanceTokens>
export type NewAttendanceToken = InferInsertModel<typeof attendanceTokens>

export type AttendanceLog = InferSelectModel<typeof attendanceLogs>
export type NewAttendanceLog = InferInsertModel<typeof attendanceLogs>

export type Assignment = InferSelectModel<typeof assignments>
export type NewAssignment = InferInsertModel<typeof assignments>

export type Submission = InferSelectModel<typeof submissions>
export type NewSubmission = InferInsertModel<typeof submissions>

export type Quiz = InferSelectModel<typeof quizzes>
export type NewQuiz = InferInsertModel<typeof quizzes>

export type QuizAttempt = InferSelectModel<typeof quizAttempts>
export type NewQuizAttempt = InferInsertModel<typeof quizAttempts>

export type GradeWeight = InferSelectModel<typeof gradeWeights>
export type NewGradeWeight = InferInsertModel<typeof gradeWeights>

export type FinalGrade = InferSelectModel<typeof finalGrades>
export type NewFinalGrade = InferInsertModel<typeof finalGrades>

export type GradeAuditLog = InferSelectModel<typeof gradeAuditLogs>
export type NewGradeAuditLog = InferInsertModel<typeof gradeAuditLogs>

export type SessionMaterial = InferSelectModel<typeof sessionMaterials>
export type NewSessionMaterial = InferInsertModel<typeof sessionMaterials>

export type MaterialReadProgress = InferSelectModel<typeof materialReadProgress>
export type NewMaterialReadProgress = InferInsertModel<typeof materialReadProgress>
