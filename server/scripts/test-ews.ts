import 'dotenv/config'
import assert from 'node:assert'
import { ewsService } from '../services/ews.service'
import { db, courseClasses } from '../database'
import type { EwsRawClassData } from '../repositories/ews.repository'

async function runEwsTests() {
  console.log('=== [1] Unit Testing Telemetry Risk Calculation Logic ===')

  // Mock data generator helper
  const createMockClassData = (overrides?: Partial<EwsRawClassData>): EwsRawClassData => ({
    classId: 'mock-class-id',
    classCode: 'IF-101-A',
    courseCode: 'IF-101',
    courseName: 'Pemrograman Web',
    termName: '2026/2027 Ganjil',
    lecturerName: 'Dr. T\'Challa',
    sessions: Array.from({ length: 16 }, (_, i) => ({
      id: `session-${i + 1}`,
      sessionNumber: i + 1,
      title: `Pertemuan ${i + 1}`,
      sessionType: i + 1 === 8 ? 'MIDTERM_EXAM' : (i + 1 === 16 ? 'FINAL_EXAM' : 'REGULAR')
    })),
    enrolledStudents: [
      { studentId: 'student-1', name: 'Shuri', nimNidn: '2611001', email: 'shuri@wakanda.ac.id' }
    ],
    attendanceLogs: [],
    assignments: [
      { id: 'assign-1', title: 'Tugas 1', dueDate: new Date(), cutoffDate: null, maxScore: 100 },
      { id: 'assign-2', title: 'Tugas 2', dueDate: new Date(), cutoffDate: null, maxScore: 100 },
      { id: 'assign-3', title: 'Tugas 3', dueDate: new Date(), cutoffDate: null, maxScore: 100 }
    ],
    submissions: [],
    quizzes: [
      { id: 'quiz-1', title: 'Kuis 1', quizType: 'QUIZ', maxScore: 100, passingScore: 55 },
      { id: 'quiz-midterm', title: 'UTS', quizType: 'MIDTERM_EXAM', maxScore: 100, passingScore: 55 }
    ],
    quizAttempts: [],
    ...overrides
  })

  // Test Case A: Critical Attendance (< 75%)
  const dataCriticalAttendance = createMockClassData({
    // Only 10 attended out of 16 (62.5% < 75%)
    attendanceLogs: Array.from({ length: 10 }, (_, i) => ({
      sessionId: `session-${i + 1}`,
      studentId: 'student-1',
      status: 'PRESENT' as const,
      checkInTime: new Date()
    }))
  })

  const attCritical = ewsService.evaluateAttendanceTelemetry('student-1', dataCriticalAttendance)
  assert.strictEqual(attCritical.isDisqualified, true, 'Kehadiran 62.5% wajib terdiskualifikasi')
  assert.strictEqual(attCritical.riskLevel, 'CRITICAL', 'Level risiko kehadiran wajib CRITICAL')
  console.log('✓ Attendance < 75% correctly triggers CRITICAL level and disqualification flag')

  // Test Case B: Warning Attendance (75.0% - 79.9%)
  const dataWarningAttendance = createMockClassData({
    // 12 attended out of 16 (75.0%)
    attendanceLogs: Array.from({ length: 12 }, (_, i) => ({
      sessionId: `session-${i + 1}`,
      studentId: 'student-1',
      status: 'PRESENT' as const,
      checkInTime: new Date()
    }))
  })

  const attWarning = ewsService.evaluateAttendanceTelemetry('student-1', dataWarningAttendance)
  assert.strictEqual(attWarning.isDisqualified, false)
  assert.strictEqual(attWarning.isNearThreshold, true)
  assert.strictEqual(attWarning.riskLevel, 'WARNING')
  console.log('✓ Attendance 75% - 79.9% correctly triggers WARNING and near-threshold warning')

  // Test Case C: Safe Attendance (>= 80%)
  const dataSafeAttendance = createMockClassData({
    // 14 attended out of 16 (87.5%)
    attendanceLogs: Array.from({ length: 14 }, (_, i) => ({
      sessionId: `session-${i + 1}`,
      studentId: 'student-1',
      status: 'PRESENT' as const,
      checkInTime: new Date()
    }))
  })

  const attSafe = ewsService.evaluateAttendanceTelemetry('student-1', dataSafeAttendance)
  assert.strictEqual(attSafe.isDisqualified, false)
  assert.strictEqual(attSafe.isNearThreshold, false)
  assert.strictEqual(attSafe.riskLevel, 'SAFE')
  console.log('✓ Attendance >= 80% correctly evaluated as SAFE')

  // Test Case D: Assignment Missing Discipline
  const dataMissingAssignments = createMockClassData({
    // Only 1 submitted out of 3 (2 missing)
    submissions: [
      {
        id: 'sub-1',
        assignmentId: 'assign-1',
        studentId: 'student-1',
        isLate: false,
        status: 'SUBMITTED',
        score: 85,
        submittedAt: new Date()
      }
    ]
  })

  const assignCritical = ewsService.evaluateAssignmentTelemetry('student-1', dataMissingAssignments)
  assert.strictEqual(assignCritical.missingCount, 2)
  assert.strictEqual(assignCritical.riskLevel, 'CRITICAL')
  console.log('✓ Missing >= 2 assignments triggers CRITICAL assignment risk')

  // Test Case E: Exam Below Passing Standard (< 55.0)
  const dataLowExam = createMockClassData({
    quizAttempts: [
      {
        id: 'att-1',
        quizId: 'quiz-1',
        studentId: 'student-1',
        score: 50,
        autoScore: 50,
        manualScore: 0,
        status: 'GRADED',
        submittedAt: new Date()
      },
      {
        id: 'att-2',
        quizId: 'quiz-midterm',
        studentId: 'student-1',
        score: 48,
        autoScore: 48,
        manualScore: 0,
        status: 'GRADED',
        submittedAt: new Date()
      }
    ]
  })

  const examTelemetry = ewsService.evaluateAcademicExamTelemetry('student-1', dataLowExam)
  assert.strictEqual(examTelemetry.isBelowPassingStandard, true)
  assert.strictEqual(examTelemetry.riskLevel, 'CRITICAL')
  assert.strictEqual(examTelemetry.combinedExamAverage, 49)
  console.log('✓ Exam average < 55.0 correctly flagged as below passing standard with CRITICAL risk')

  // Test Case F: Composite Profile & Intervention Generation
  const compositeCritical = ewsService.calculateStudentEwsProfile(
    { studentId: 'student-1', name: 'Shuri', nimNidn: '2611001', email: 'shuri@wakanda.ac.id' },
    dataCriticalAttendance
  )

  assert.strictEqual(compositeCritical.overallRiskLevel, 'CRITICAL')
  assert.strictEqual(compositeCritical.riskColor, '#DC2626')
  assert.strictEqual(compositeCritical.riskLabel, 'Kritis')
  assert.strictEqual(compositeCritical.interventionRecommendations.urgency, 'IMMEDIATE')
  assert.ok(compositeCritical.interventionRecommendations.lecturerActions.length > 0)
  assert.ok(compositeCritical.interventionRecommendations.programAdminActions.length > 0)
  assert.ok(compositeCritical.interventionRecommendations.academicAdvisorActions.length > 0)
  console.log('✓ Composite Profile correctly assigned Critical #DC2626 with IMMEDIATE intervention actions')

  console.log('\n=== [2] Testing Real Database Neon Integration for EWS ===')
  const existingClasses = await db.select().from(courseClasses).limit(1)
  if (existingClasses.length === 0) {
    console.log('No classes found in DB to test database integration. Skipping DB part.')
    return
  }

  const testClass = existingClasses[0]
  console.log(`Analyzing Class ID: ${testClass.id} (Code: ${testClass.code})`)

  const classOverview = await ewsService.getClassEwsOverview(testClass.id)
  console.log(`Class EWS Summary for '${classOverview.className}' (${classOverview.courseName}):`)
  console.log(`- Total Enrolled Students: ${classOverview.totalEnrolledStudents}`)
  console.log(`- Safe Students (#16A34A): ${classOverview.safeStudentsCount}`)
  console.log(`- Warning Students (#D97706): ${classOverview.warningStudentsCount}`)
  console.log(`- Critical Students (#DC2626): ${classOverview.criticalStudentsCount}`)
  console.log(`- Average Risk Score: ${classOverview.riskSummary.averageCompositeRisk}`)
  console.log(`- At Risk Percentage: ${classOverview.riskSummary.atRiskPercentage}%`)
  console.log(`- Class Macro Interventions:`, classOverview.recommendedClassInterventions)

  if (classOverview.students.length > 0) {
    const topStudent = classOverview.students[0]
    console.log(`\nSample Student EWS Profile: ${topStudent.studentName} (${topStudent.studentNim || '-'})`)
    console.log(`- Risk Level: ${topStudent.overallRiskLevel} (${topStudent.riskLabel}) - Color: ${topStudent.riskColor}`)
    console.log(`- Composite Score: ${topStudent.compositeRiskScore} / 100`)
    console.log(`- Attendance: ${topStudent.attendance.attendancePercentage}% (${topStudent.attendance.riskLevel})`)
    console.log(`- Assignments: Missing ${topStudent.assignments.missingCount}, Late ${topStudent.assignments.lateCount}`)
    console.log(`- Exams: Combined Avg ${topStudent.exams.combinedExamAverage ?? 'Belum ada nilai'}`)
    console.log(`- Urgency: ${topStudent.interventionRecommendations.urgency}`)
    console.log(`- Lecturer Actions:`, topStudent.interventionRecommendations.lecturerActions)
    console.log(`- Program Admin Actions:`, topStudent.interventionRecommendations.programAdminActions)
  }

  console.log('\n=== [3] Testing Department EWS Overview ===')
  const deptOverview = await ewsService.getDepartmentEwsOverview()
  console.log(`Department Summary for ${deptOverview.termName}:`)
  console.log(`- Total Classes Analyzed: ${deptOverview.totalClassesAnalyzed}`)
  console.log(`- Total Students Analyzed: ${deptOverview.totalStudentsAnalyzed}`)
  console.log(`- Overall Safe: ${deptOverview.overallSafeCount}`)
  console.log(`- Overall Warning: ${deptOverview.overallWarningCount}`)
  console.log(`- Overall Critical: ${deptOverview.overallCriticalCount}`)
  console.log(`- Overall At-Risk Percentage: ${deptOverview.overallAtRiskPercentage}%`)
  console.log(`- High Risk Classes: ${deptOverview.highRiskClasses.length} kelas`)

  console.log('\n=== ALL EWS ENGINE & TELEMETRY TESTS PASSED SUCCESSFULLY! ===')
  process.exit(0)
}

runEwsTests().catch((err) => {
  console.error('EWS Test failed with error:', err)
  process.exit(1)
})
