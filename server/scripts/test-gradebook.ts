import 'dotenv/config'
import assert from 'node:assert'
import { gradebookService, DEFAULT_GRADE_WEIGHTS } from '../services/gradebook.service'
import { db, courseClasses, users, classEnrollments, finalGrades, gradeAuditLogs } from '../database'
import { eq } from 'drizzle-orm'

async function runGradebookTests() {
  console.log('=== [1] Testing Letter Grade & Grade Point Conversion Logic ===')

  // A >= 85.0
  const gradeA = gradebookService.convertScoreToLetterAndPoint(85.0, false)
  assert.strictEqual(gradeA.letterGrade, 'A')
  assert.strictEqual(gradeA.gradePoint, 4.0)

  const gradeAHigh = gradebookService.convertScoreToLetterAndPoint(98.5, false)
  assert.strictEqual(gradeAHigh.letterGrade, 'A')
  assert.strictEqual(gradeAHigh.gradePoint, 4.0)

  // AB: 80.0 - 84.99
  const gradeAB = gradebookService.convertScoreToLetterAndPoint(82.4, false)
  assert.strictEqual(gradeAB.letterGrade, 'AB')
  assert.strictEqual(gradeAB.gradePoint, 3.5)

  // B: 70.0 - 79.99
  const gradeB = gradebookService.convertScoreToLetterAndPoint(74.0, false)
  assert.strictEqual(gradeB.letterGrade, 'B')
  assert.strictEqual(gradeB.gradePoint, 3.0)

  // BC: 65.0 - 69.99
  const gradeBC = gradebookService.convertScoreToLetterAndPoint(67.5, false)
  assert.strictEqual(gradeBC.letterGrade, 'BC')
  assert.strictEqual(gradeBC.gradePoint, 2.5)

  // C: 55.0 - 64.99
  const gradeC = gradebookService.convertScoreToLetterAndPoint(58.0, false)
  assert.strictEqual(gradeC.letterGrade, 'C')
  assert.strictEqual(gradeC.gradePoint, 2.0)

  // D: 45.0 - 54.99
  const gradeD = gradebookService.convertScoreToLetterAndPoint(48.2, false)
  assert.strictEqual(gradeD.letterGrade, 'D')
  assert.strictEqual(gradeD.gradePoint, 1.0)

  // E: < 45.0
  const gradeE = gradebookService.convertScoreToLetterAndPoint(42.0, false)
  assert.strictEqual(gradeE.letterGrade, 'E')
  assert.strictEqual(gradeE.gradePoint, 0.0)

  // CRITICAL RULE: Kehadiran < 75.0% otomatis E (0.00) walaupun nilai 95.0
  const gradeDisqualified = gradebookService.convertScoreToLetterAndPoint(95.0, true)
  assert.strictEqual(gradeDisqualified.letterGrade, 'E', 'Harus otomatis E jika kehadiran < 75%')
  assert.strictEqual(gradeDisqualified.gradePoint, 0.0, 'Grade point harus 0.00 jika kehadiran < 75%')
  console.log('✓ Letter grade conversions and < 75% attendance disqualification verified!')

  console.log('\n=== [2] Testing Class Grade Weights & Database Integration ===')
  // Fetch an existing class
  const existingClasses = await db.select().from(courseClasses).limit(1)
  if (existingClasses.length === 0) {
    console.log('No classes found in DB to test database integration. Skipping DB part.')
    return
  }

  const testClass = existingClasses[0]
  console.log(`Using class ID: ${testClass.id} (Code: ${testClass.code})`)

  // Find a lecturer user
  const lecturers = await db.select().from(users).where(eq(users.role, 'lecturer')).limit(1)
  const lecturerId = lecturers.length > 0 ? lecturers[0].id : testClass.id

  // Configure weights (10 + 20 + 15 + 25 + 30 = 100%)
  const newWeights = [
    { componentName: 'ATTENDANCE' as const, weightPercentage: 10.0, description: 'Presensi' },
    { componentName: 'ASSIGNMENT' as const, weightPercentage: 20.0, description: 'Tugas' },
    { componentName: 'QUIZ' as const, weightPercentage: 15.0, description: 'Kuis' },
    { componentName: 'MIDTERM_EXAM' as const, weightPercentage: 25.0, description: 'UTS' },
    { componentName: 'FINAL_EXAM' as const, weightPercentage: 30.0, description: 'UAS' }
  ]

  const configured = await gradebookService.configureGradeWeights(testClass.id, { weights: newWeights }, lecturerId)
  assert.strictEqual(configured.length, 5)
  console.log('✓ Grade weights configured successfully (100.00% total)')

  // Invalid weights total test
  try {
    await gradebookService.configureGradeWeights(testClass.id, {
      weights: [
        { componentName: 'ATTENDANCE' as const, weightPercentage: 10.0 },
        { componentName: 'ASSIGNMENT' as const, weightPercentage: 10.0 },
        { componentName: 'QUIZ' as const, weightPercentage: 10.0 },
        { componentName: 'MIDTERM_EXAM' as const, weightPercentage: 10.0 },
        { componentName: 'FINAL_EXAM' as const, weightPercentage: 10.0 }
      ]
    }, lecturerId)
    assert.fail('Should have failed because weights sum to 50% instead of 100%')
  } catch (err: any) {
    assert.match(err.message, /100\.00%/)
    console.log('✓ Invalid weight sum rejected successfully:', err.message)
  }

  console.log('\n=== [3] Testing Gradebook Calculation & Persistence ===')
  const gradebook = await gradebookService.calculateAndPersistClassGradebook(testClass.id, lecturerId)
  console.log(`Class Gradebook for '${gradebook.className}' (${gradebook.courseName}):`)
  console.log(`- Total Students: ${gradebook.totalStudents}`)
  console.log(`- Average Final Score: ${gradebook.averageFinalScore}`)
  console.log(`- Grade Distribution:`, gradebook.gradeDistribution)

  if (gradebook.students.length > 0) {
    const student = gradebook.students[0]
    console.log(`Sample Student: ${student.studentName} (${student.studentNim})`)
    console.log(`- Attendance: ${student.attendance.attendancePercentage}% (Score: ${student.attendance.score})`)
    console.log(`- Assignment Avg: ${student.assignment.averageScore}`)
    console.log(`- Quiz Avg: ${student.quiz.averageScore}`)
    console.log(`- UTS Score: ${student.midtermExam.score}`)
    console.log(`- UAS Score: ${student.finalExam.score}`)
    console.log(`- NA: ${student.finalGrade.numericScore}`)
    console.log(`- Letter: ${student.finalGrade.letterGrade} (IP: ${student.finalGrade.gradePoint})`)

    console.log('\n=== [4] Testing Manual Grade Adjustment & Audit Logging ===')
    const adjustResult = await gradebookService.adjustStudentGradeManual(
      testClass.id,
      {
        studentId: student.studentId,
        numericScore: 88.5,
        reason: 'Penyesuaian nilai partisipasi praktikum mandiri dan remidi kuis'
      },
      lecturerId,
      '127.0.0.1'
    )

    console.log('Manual Adjustment Result:', {
      studentName: adjustResult.auditLog.studentName,
      previousScore: adjustResult.auditLog.previousScore,
      newScore: adjustResult.auditLog.newScore,
      previousLetter: adjustResult.auditLog.previousLetter,
      newLetter: adjustResult.auditLog.newLetter,
      reason: adjustResult.auditLog.reason
    })

    assert.strictEqual(adjustResult.finalGrade.numericScore, 88.5)
    assert.strictEqual(adjustResult.auditLog.newScore, 88.5)
    assert.strictEqual(adjustResult.auditLog.newLetter, 'E') // Disqualified because attendance was 0%
    assert.strictEqual(adjustResult.auditLog.reason, 'Penyesuaian nilai partisipasi praktikum mandiri dan remidi kuis')

    // Test adjustment WITH attendance >= 75%
    const adjustEligibleResult = await gradebookService.adjustStudentGradeManual(
      testClass.id,
      {
        studentId: student.studentId,
        attendanceScore: 90.0,
        numericScore: 88.5,
        reason: 'Koreksi presensi sakit dengan surat dokter dan input nilai tugas mandiri'
      },
      lecturerId,
      '127.0.0.1'
    )

    console.log('Adjustment with Valid Attendance Result:', {
      newScore: adjustEligibleResult.auditLog.newScore,
      newLetter: adjustEligibleResult.auditLog.newLetter,
      gradePoint: adjustEligibleResult.finalGrade.gradePoint
    })

    assert.strictEqual(adjustEligibleResult.auditLog.newLetter, 'A', 'Nilai 88.5 dengan presensi 90% harus mendapatkan huruf mutu A')
    assert.strictEqual(adjustEligibleResult.finalGrade.gradePoint, 4.0)
    console.log('✓ Manual adjustment with attendance >= 75% yields letter A (4.00)!')

    // Verify audit logs fetch
    const auditLogs = await gradebookService.getClassAuditLogs(testClass.id)
    assert.ok(auditLogs.length > 0)
    console.log(`✓ Audit log verified! Found ${auditLogs.length} audit trail records.`)

    console.log('\n=== [5] Testing Class Grade Status Update ===')
    const statusUpdate = await gradebookService.updateClassGradeStatus(testClass.id, 'PUBLISHED', lecturerId)
    console.log(`✓ Status updated: ${statusUpdate.status} (${statusUpdate.updatedCount} records updated)`)
  }

  console.log('\n=== ALL GRADEBOOK ENGINE TESTS PASSED! ===')
  process.exit(0)
}

runGradebookTests().catch((err) => {
  console.error('Test failed with error:', err)
  process.exit(1)
})
