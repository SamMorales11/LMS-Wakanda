import { eq, and, inArray, desc, sql } from 'drizzle-orm'
import {
  db,
  assignments,
  submissions,
  quizzes,
  quizAttempts,
  users,
  classEnrollments,
  courseClasses,
  type Submission,
  type QuizAttempt,
  type Assignment,
  type Quiz
} from '../database'
import type {
  GradingSubmissionItemDto,
  CollectiveSubmissionsDto,
  GradingQuizAttemptItemDto,
  GradingEssayAnswerItemDto,
  CollectiveQuizAttemptsDto,
  QuizQuestion,
  QuizAttemptAnswer
} from '~/types'

export interface IGradingRepository {
  // Assignments
  findAssignmentWithSubmissions(assignmentId: string): Promise<{
    assignment: Assignment
    classId: string
    totalEnrolled: number
    submissionRows: {
      submission: Submission
      student: { id: string; name: string; nimNidn: string | null; email: string; avatarUrl: string | null }
      grader: { name: string } | null
    }[]
  } | null>
  findSubmissionById(submissionId: string): Promise<{
    submission: Submission
    assignment: Assignment
    student: { id: string; name: string; nimNidn: string | null; email: string; avatarUrl: string | null }
    grader: { name: string } | null
  } | null>
  updateSubmissionGrade(
    submissionId: string,
    score: number,
    feedback: string | null,
    status: 'GRADED' | 'RESUBMISSION_REQUESTED',
    gradedBy: string
  ): Promise<Submission | null>

  // Quizzes / Exams
  findQuizWithAttempts(quizId: string): Promise<{
    quiz: Quiz
    attempts: {
      attempt: QuizAttempt
      student: { id: string; name: string; nimNidn: string | null; email: string }
      grader: { name: string } | null
    }[]
  } | null>
  findQuizAttemptById(attemptId: string): Promise<{
    attempt: QuizAttempt
    quiz: Quiz
    student: { id: string; name: string; nimNidn: string | null; email: string }
    grader: { name: string } | null
  } | null>
  updateQuizAttemptGrade(
    attemptId: string,
    manualScore: number,
    totalScore: number,
    answers: QuizAttemptAnswer[],
    feedback: string | null,
    gradedBy: string
  ): Promise<QuizAttempt | null>
}

export class GradingRepository implements IGradingRepository {
  public async findAssignmentWithSubmissions(assignmentId: string) {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1)

    if (!assignment) return null

    // Hitung total enrolled
    const [enrolledRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(classEnrollments)
      .where(
        and(
          eq(classEnrollments.classId, assignment.classId),
          eq(classEnrollments.status, 'ENROLLED')
        )
      )

    const totalEnrolled = enrolledRes?.count ?? 0

    // Ambil seluruh submissions
    const subRows = await db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt))

    if (subRows.length === 0) {
      return {
        assignment,
        classId: assignment.classId,
        totalEnrolled,
        submissionRows: []
      }
    }

    // Ambil users
    const studentIds = [...new Set(subRows.map(s => s.studentId))]
    const graderIds = [...new Set(subRows.map(s => s.gradedBy).filter((g): g is string => !!g))]
    const allUserIds = [...new Set([...studentIds, ...graderIds])]

    const usersMap = new Map<string, { id: string; name: string; nimNidn: string | null; email: string; avatarUrl: string | null }>()
    if (allUserIds.length > 0) {
      const uRows = await db
        .select({
          id: users.id,
          name: users.name,
          nimNidn: users.nimNidn,
          email: users.email,
          avatarUrl: users.avatarUrl
        })
        .from(users)
        .where(inArray(users.id, allUserIds))

      for (const u of uRows) {
        usersMap.set(u.id, u)
      }
    }

    const submissionRows = subRows.map(sub => {
      const student = usersMap.get(sub.studentId) || {
        id: sub.studentId,
        name: 'Mahasiswa',
        nimNidn: null,
        email: '',
        avatarUrl: null
      }

      const grader = sub.gradedBy ? usersMap.get(sub.gradedBy) || null : null

      return {
        submission: sub,
        student,
        grader: grader ? { name: grader.name } : null
      }
    })

    return {
      assignment,
      classId: assignment.classId,
      totalEnrolled,
      submissionRows
    }
  }

  public async findSubmissionById(submissionId: string) {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1)

    if (!submission) return null

    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, submission.assignmentId))
      .limit(1)

    if (!assignment) return null

    const [student] = await db
      .select({
        id: users.id,
        name: users.name,
        nimNidn: users.nimNidn,
        email: users.email,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(eq(users.id, submission.studentId))
      .limit(1)

    let grader: { name: string } | null = null
    if (submission.gradedBy) {
      const [g] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, submission.gradedBy))
        .limit(1)
      grader = g || null
    }

    return {
      submission,
      assignment,
      student: student || {
        id: submission.studentId,
        name: 'Mahasiswa',
        nimNidn: null,
        email: '',
        avatarUrl: null
      },
      grader
    }
  }

  public async updateSubmissionGrade(
    submissionId: string,
    score: number,
    feedback: string | null,
    status: 'GRADED' | 'RESUBMISSION_REQUESTED',
    gradedBy: string
  ): Promise<Submission | null> {
    const [updated] = await db
      .update(submissions)
      .set({
        score: String(score),
        feedback,
        status,
        gradedBy,
        gradedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(submissions.id, submissionId))
      .returning()

    return updated || null
  }

  public async findQuizWithAttempts(quizId: string) {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1)

    if (!quiz) return null

    const attemptRows = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .orderBy(desc(quizAttempts.submittedAt), desc(quizAttempts.startedAt))

    if (attemptRows.length === 0) {
      return { quiz, attempts: [] }
    }

    const studentIds = [...new Set(attemptRows.map(a => a.studentId))]
    const graderIds = [...new Set(attemptRows.map(a => a.gradedBy).filter((g): g is string => !!g))]
    const allUserIds = [...new Set([...studentIds, ...graderIds])]

    const usersMap = new Map<string, { id: string; name: string; nimNidn: string | null; email: string }>()
    if (allUserIds.length > 0) {
      const uRows = await db
        .select({
          id: users.id,
          name: users.name,
          nimNidn: users.nimNidn,
          email: users.email
        })
        .from(users)
        .where(inArray(users.id, allUserIds))

      for (const u of uRows) {
        usersMap.set(u.id, u)
      }
    }

    const attempts = attemptRows.map(att => {
      const student = usersMap.get(att.studentId) || {
        id: att.studentId,
        name: 'Mahasiswa',
        nimNidn: null,
        email: ''
      }

      const grader = att.gradedBy ? usersMap.get(att.gradedBy) || null : null

      return {
        attempt: att,
        student,
        grader: grader ? { name: grader.name } : null
      }
    })

    return { quiz, attempts }
  }

  public async findQuizAttemptById(attemptId: string) {
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, attemptId))
      .limit(1)

    if (!attempt) return null

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, attempt.quizId))
      .limit(1)

    if (!quiz) return null

    const [student] = await db
      .select({
        id: users.id,
        name: users.name,
        nimNidn: users.nimNidn,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, attempt.studentId))
      .limit(1)

    let grader: { name: string } | null = null
    if (attempt.gradedBy) {
      const [g] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, attempt.gradedBy))
        .limit(1)
      grader = g || null
    }

    return {
      attempt,
      quiz,
      student: student || {
        id: attempt.studentId,
        name: 'Mahasiswa',
        nimNidn: null,
        email: ''
      },
      grader
    }
  }

  public async updateQuizAttemptGrade(
    attemptId: string,
    manualScore: number,
    totalScore: number,
    answers: QuizAttemptAnswer[],
    feedback: string | null,
    gradedBy: string
  ): Promise<QuizAttempt | null> {
    const [updated] = await db
      .update(quizAttempts)
      .set({
        manualScore: String(manualScore),
        score: String(totalScore),
        answersJsonb: answers,
        status: 'GRADED',
        feedback,
        gradedBy,
        gradedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(quizAttempts.id, attemptId))
      .returning()

    return updated || null
  }
}

export const gradingRepository = new GradingRepository()
