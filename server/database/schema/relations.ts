import { relations } from 'drizzle-orm'
import { users } from './users'
import { programs, academicTerms, courses, courseClasses, classLecturers } from './academics'
import { classSessions } from './sessions'
import { classEnrollments } from './enrollments'
import { attendanceTokens, attendanceLogs } from './attendance'
import { assignments, submissions, quizzes, quizAttempts } from './assessments'
import { gradeWeights, finalGrades, gradeAuditLogs } from './grades'

// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  lecturerClasses: many(classLecturers),
  enrollments: many(classEnrollments),
  attendanceLogs: many(attendanceLogs),
  createdAttendanceTokens: many(attendanceTokens),
  createdAssignments: many(assignments),
  submissions: many(submissions, { relationName: 'student' }),
  gradedSubmissions: many(submissions, { relationName: 'grader' }),
  createdQuizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  finalGrades: many(finalGrades, { relationName: 'student' }),
  approvedFinalGrades: many(finalGrades, { relationName: 'approver' }),
  gradeAuditLogs: many(gradeAuditLogs)
}))

// Programs Relations
export const programsRelations = relations(programs, ({ many }) => ({
  courses: many(courses)
}))

// Academic Terms Relations
export const academicTermsRelations = relations(academicTerms, ({ many }) => ({
  courseClasses: many(courseClasses)
}))

// Courses Relations
export const coursesRelations = relations(courses, ({ one, many }) => ({
  program: one(programs, {
    fields: [courses.programId],
    references: [programs.id]
  }),
  classes: many(courseClasses)
}))

// Course Classes Relations
export const courseClassesRelations = relations(courseClasses, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseClasses.courseId],
    references: [courses.id]
  }),
  academicTerm: one(academicTerms, {
    fields: [courseClasses.academicTermId],
    references: [academicTerms.id]
  }),
  lecturers: many(classLecturers),
  sessions: many(classSessions),
  enrollments: many(classEnrollments),
  assignments: many(assignments),
  quizzes: many(quizzes),
  gradeWeights: many(gradeWeights),
  finalGrades: many(finalGrades)
}))

// Class Lecturers Relations
export const classLecturersRelations = relations(classLecturers, ({ one }) => ({
  courseClass: one(courseClasses, {
    fields: [classLecturers.classId],
    references: [courseClasses.id]
  }),
  lecturer: one(users, {
    fields: [classLecturers.lecturerId],
    references: [users.id]
  })
}))

// Class Sessions Relations (Struktur 16 Pertemuan)
export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  courseClass: one(courseClasses, {
    fields: [classSessions.classId],
    references: [courseClasses.id]
  }),
  tokens: many(attendanceTokens),
  attendanceLogs: many(attendanceLogs),
  assignments: many(assignments),
  quizzes: many(quizzes)
}))

// Class Enrollments Relations
export const classEnrollmentsRelations = relations(classEnrollments, ({ one }) => ({
  courseClass: one(courseClasses, {
    fields: [classEnrollments.classId],
    references: [courseClasses.id]
  }),
  student: one(users, {
    fields: [classEnrollments.studentId],
    references: [users.id]
  })
}))

// Attendance Tokens Relations
export const attendanceTokensRelations = relations(attendanceTokens, ({ one }) => ({
  session: one(classSessions, {
    fields: [attendanceTokens.sessionId],
    references: [classSessions.id]
  }),
  creator: one(users, {
    fields: [attendanceTokens.createdBy],
    references: [users.id]
  })
}))

// Attendance Logs Relations
export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  session: one(classSessions, {
    fields: [attendanceLogs.sessionId],
    references: [classSessions.id]
  }),
  student: one(users, {
    fields: [attendanceLogs.studentId],
    references: [users.id]
  })
}))

// Assignments Relations
export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  courseClass: one(courseClasses, {
    fields: [assignments.classId],
    references: [courseClasses.id]
  }),
  session: one(classSessions, {
    fields: [assignments.sessionId],
    references: [classSessions.id]
  }),
  creator: one(users, {
    fields: [assignments.createdBy],
    references: [users.id]
  }),
  submissions: many(submissions)
}))

// Submissions Relations
export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id]
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
    relationName: 'student'
  }),
  grader: one(users, {
    fields: [submissions.gradedBy],
    references: [users.id],
    relationName: 'grader'
  })
}))

// Quizzes Relations
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  courseClass: one(courseClasses, {
    fields: [quizzes.classId],
    references: [courseClasses.id]
  }),
  session: one(classSessions, {
    fields: [quizzes.sessionId],
    references: [classSessions.id]
  }),
  creator: one(users, {
    fields: [quizzes.createdBy],
    references: [users.id]
  }),
  attempts: many(quizAttempts)
}))

// Quiz Attempts Relations
export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id]
  }),
  student: one(users, {
    fields: [quizAttempts.studentId],
    references: [users.id]
  })
}))

// Grade Weights Relations
export const gradeWeightsRelations = relations(gradeWeights, ({ one }) => ({
  courseClass: one(courseClasses, {
    fields: [gradeWeights.classId],
    references: [courseClasses.id]
  })
}))

// Final Grades Relations
export const finalGradesRelations = relations(finalGrades, ({ one, many }) => ({
  courseClass: one(courseClasses, {
    fields: [finalGrades.classId],
    references: [courseClasses.id]
  }),
  student: one(users, {
    fields: [finalGrades.studentId],
    references: [users.id],
    relationName: 'student'
  }),
  approver: one(users, {
    fields: [finalGrades.approvedBy],
    references: [users.id],
    relationName: 'approver'
  }),
  auditLogs: many(gradeAuditLogs)
}))

// Grade Audit Logs Relations
export const gradeAuditLogsRelations = relations(gradeAuditLogs, ({ one }) => ({
  finalGrade: one(finalGrades, {
    fields: [gradeAuditLogs.finalGradeId],
    references: [finalGrades.id]
  }),
  changedByUser: one(users, {
    fields: [gradeAuditLogs.changedBy],
    references: [users.id]
  })
}))
