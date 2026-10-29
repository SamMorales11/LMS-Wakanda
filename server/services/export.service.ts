import ExcelJS from 'exceljs'
import type {
  ClassGradebookDto,
  StudentGradeBreakdownDto,
  AttendanceMatrixReportDto,
  StudentAttendanceMatrixRowDto,
  AttendanceMatrixCellDto,
  AcademicReportMetadata,
  LetterGrade
} from '~/types'
import { gradebookService, type GradebookService } from './gradebook.service'
import {
  gradebookRepository,
  type IGradebookRepository,
  type ClassGradeAssessmentData
} from '../repositories/gradebook.repository'
import { classRepository, type IClassRepository } from '../repositories/class.repository'
import { courseRepository, type ICourseRepository } from '../repositories/course.repository'
import { attendanceRepository, type IAttendanceRepository } from '../repositories/attendance.repository'
import { NotFoundError, BadRequestError } from '../utils/errors'

export class ExportService {
  constructor(
    private readonly gradebookSvc: GradebookService = gradebookService,
    private readonly gradebookRepo: IGradebookRepository = gradebookRepository,
    private readonly classRepo: IClassRepository = classRepository,
    private readonly courseRepo: ICourseRepository = courseRepository,
    private readonly attendanceRepo: IAttendanceRepository = attendanceRepository
  ) {}

  /**
   * Mengumpulkan metadata akademik resmi kelas untuk kop surat & header laporan
   */
  public async getAcademicMetadata(classId: string): Promise<AcademicReportMetadata> {
    const classDetail = await this.classRepo.findDetailById(classId)
    if (!classDetail) {
      throw new NotFoundError(`Kelas dengan ID '${classId}' tidak ditemukan`)
    }

    const course = await this.courseRepo.findById(classDetail.courseId)
    const primaryLecturer = classDetail.lecturers.find((l) => l.isPrimary) || classDetail.lecturers[0]

    const now = new Date()
    const indonesianMonths = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const formattedDate = `${now.getDate()} ${indonesianMonths[now.getMonth()]} ${now.getFullYear()}`

    return {
      institutionName: 'KEMENTERIAN PENDIDIKAN TINGGI, RISET, DAN TEKNOLOGI',
      institutionSubName: 'INSTITUT TEKNOLOGI WAKANDA',
      facultyName: 'FAKULTAS REKAYASA SISTEM CERDAS & KOMPUTASI',
      programName: course?.programName || 'S1 Teknik Informatika',
      campusAddress: 'Kompleks Riset Terpadu Vibranium Valley Kav. 01-04, Wakanda City 13000',
      campusContact: 'Telp: (021) 888-WAKANDA | Surel: baak@wakanda.ac.id | Web: https://lms.wakanda.ac.id',
      academicYear: classDetail.termName || '2026/2027 - Semester Ganjil',
      termName: classDetail.termName || 'Semester Ganjil 2026/2027',
      courseCode: classDetail.courseCode || course?.code || 'IF101',
      courseName: classDetail.courseName || course?.name || 'Algoritma & Pemrograman',
      credits: course?.credits ?? 3,
      classCode: classDetail.code,
      schedule: `${classDetail.scheduleDay || 'SENIN'}, ${classDetail.scheduleStart ? classDetail.scheduleStart.slice(0, 5) : '08:00'} - ${classDetail.scheduleEnd ? classDetail.scheduleEnd.slice(0, 5) : '10:30'} WIB`,
      room: classDetail.room || 'Ruang Teori ITW-302',
      lecturerName: primaryLecturer?.name || 'Dr. Shuri, M.Kom.',
      lecturerNidn: primaryLecturer?.nimNidn || '198805122015042001',
      headOfDepartmentName: 'Dr. Ir. Okoye Wakande, M.T.',
      headOfDepartmentNidn: '197503152000032001',
      generatedAt: formattedDate
    }
  }

  /**
   * Menghasilkan struktur data Matriks Presensi 16 Pertemuan untuk suatu kelas
   */
  public async getAttendanceMatrixData(classId: string): Promise<AttendanceMatrixReportDto> {
    const classDetail = await this.classRepo.findDetailById(classId)
    if (!classDetail) {
      throw new NotFoundError(`Kelas dengan ID '${classId}' tidak ditemukan`)
    }

    const course = await this.courseRepo.findById(classDetail.courseId)
    const primaryLecturer = classDetail.lecturers.find((l) => l.isPrimary) || classDetail.lecturers[0]

    const assessmentData = await this.gradebookRepo.findClassAssessmentData(classId)
    if (!assessmentData) {
      throw new NotFoundError(`Data penilaian kelas dengan ID '${classId}' tidak ditemukan`)
    }

    // Ambil daftar 16 sesi terurut
    const sessions = classDetail.sessions.sort((a, b) => a.sessionNumber - b.sessionNumber)
    const totalSessions = sessions.length > 0 ? sessions.length : 16

    // Map log presensi: key = `${studentId}_${sessionId}`
    const logMap = new Map<string, string>()
    for (const log of assessmentData.attendanceLogs) {
      logMap.set(`${log.studentId}_${log.sessionId}`, log.status)
    }

    // Bangun baris presensi per mahasiswa
    const studentRows: StudentAttendanceMatrixRowDto[] = assessmentData.enrolledStudents.map((student) => {
      let totalPresent = 0
      let totalLate = 0
      let totalPermit = 0
      let totalSick = 0
      let totalAbsent = 0

      const sessionCells: AttendanceMatrixCellDto[] = sessions.map((s) => {
        const rawStatus = logMap.get(`${student.studentId}_${s.id}`)
        let status: AttendanceMatrixCellDto['status'] = 'NONE'
        let statusCode: AttendanceMatrixCellDto['statusCode'] = '-'
        let statusLabel = 'Belum Dimulai'

        if (rawStatus === 'PRESENT') {
          status = 'PRESENT'
          statusCode = 'H'
          statusLabel = 'Hadir'
          totalPresent++
        } else if (rawStatus === 'LATE') {
          status = 'LATE'
          statusCode = 'T'
          statusLabel = 'Terlambat'
          totalLate++
        } else if (rawStatus === 'PERMIT') {
          status = 'PERMIT'
          statusCode = 'I'
          statusLabel = 'Izin'
          totalPermit++
        } else if (rawStatus === 'SICK') {
          status = 'SICK'
          statusCode = 'S'
          statusLabel = 'Sakit'
          totalSick++
        } else if (rawStatus === 'ABSENT') {
          status = 'ABSENT'
          statusCode = 'A'
          statusLabel = 'Alfa'
          totalAbsent++
        }

        return {
          sessionId: s.id,
          sessionNumber: s.sessionNumber,
          sessionDate: s.sessionDate,
          sessionType: s.sessionType,
          status,
          statusCode,
          statusLabel
        }
      })

      const totalAttended = totalPresent + totalLate
      const attendancePercentage = totalSessions > 0
        ? Math.round((totalAttended / totalSessions) * 10000) / 100
        : 0
      const isEligibleForUas = attendancePercentage >= 75.0

      return {
        studentId: student.studentId,
        studentName: student.name,
        studentNim: student.nimNidn,
        studentEmail: student.email,
        sessions: sessionCells,
        totalPresent,
        totalLate,
        totalPermit,
        totalSick,
        totalAbsent,
        totalAttended,
        attendancePercentage,
        isEligibleForUas
      }
    })

    // Urutkan mahasiswa berdasarkan NIM atau Nama
    studentRows.sort((a, b) => {
      if (a.studentNim && b.studentNim) {
        return a.studentNim.localeCompare(b.studentNim)
      }
      return a.studentName.localeCompare(b.studentName)
    })

    // Hitung rata-rata kelas & kelayakan
    const totalStudents = studentRows.length
    const eligibleCount = studentRows.filter((s) => s.isEligibleForUas).length
    const disqualifiedCount = totalStudents - eligibleCount
    const classAverageAttendance = totalStudents > 0
      ? Math.round((studentRows.reduce((acc, s) => acc + s.attendancePercentage, 0) / totalStudents) * 100) / 100
      : 0

    return {
      classId,
      className: classDetail.code,
      courseCode: classDetail.courseCode || course?.code || 'IF101',
      courseName: classDetail.courseName || course?.name || 'Algoritma & Pemrograman',
      credits: course?.credits ?? 3,
      termName: classDetail.termName || 'Semester Ganjil 2026/2027',
      lecturerName: primaryLecturer?.name || 'Dr. Shuri, M.Kom.',
      lecturerNidn: primaryLecturer?.nimNidn || '198805122015042001',
      totalSessions,
      sessions: sessions.map((s) => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        title: s.title,
        sessionDate: s.sessionDate,
        sessionType: s.sessionType,
        status: s.status
      })),
      students: studentRows,
      classAverageAttendance,
      eligibleCount,
      disqualifiedCount
    }
  }

  /**
   * Menghasilkan file Excel (.xlsx) Rekapitulasi Gradebook resmi Institut Teknologi Wakanda
   */
  public async generateGradebookExcel(classId: string): Promise<Buffer> {
    const [gradebook, metadata] = await Promise.all([
      this.gradebookSvc.getClassGradebook(classId),
      this.getAcademicMetadata(classId)
    ])

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Institut Teknologi Wakanda - Academic LMS'
    workbook.lastModifiedBy = metadata.lecturerName
    workbook.created = new Date()
    workbook.modified = new Date()

    // ------------------------------------------------------------------------
    // SHEET 1: REKAP NILAI AKHIR MAHASISWA
    // ------------------------------------------------------------------------
    const sheet = workbook.addWorksheet('Rekap Nilai Akhir', {
      views: [{ state: 'frozen', xSplit: 3, ySplit: 9 }],
      pageSetup: { orientation: 'landscape', paperSize: 9 } // A4 Landscape
    })

    // Header Styling Helpers
    const NAVY_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
    const SLATE_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    const SUBHEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }
    const ZEBRA_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    const BORDER_THIN: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    }

    // 1. Institution Title
    sheet.mergeCells('A1:R1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'INSTITUT TEKNOLOGI WAKANDA'
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = NAVY_FILL
    sheet.getRow(1).height = 30

    sheet.mergeCells('A2:R2')
    const subTitleCell = sheet.getCell('A2')
    subTitleCell.value = 'LAPORAN REKAPITULASI HASIL PENILAIAN AKADEMIK (GRADEBOOK)'
    subTitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFE2E8F0' } }
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    subTitleCell.fill = NAVY_FILL
    sheet.getRow(2).height = 20

    sheet.mergeCells('A3:R3')
    const addressCell = sheet.getCell('A3')
    addressCell.value = `${metadata.facultyName} | ${metadata.programName} | ${metadata.campusAddress}`
    addressCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF94A3B8' } }
    addressCell.alignment = { horizontal: 'center', vertical: 'middle' }
    addressCell.fill = NAVY_FILL
    sheet.getRow(3).height = 18

    // 2. Metadata Box (Rows 5 to 7)
    sheet.getCell('A5').value = 'Mata Kuliah'
    sheet.getCell('B5').value = `: [${metadata.courseCode}] ${metadata.courseName} (${metadata.credits} SKS)`
    sheet.getCell('A5').font = { bold: true, size: 10 }
    sheet.getCell('B5').font = { bold: true, size: 10, color: { argb: 'FF0F172A' } }

    sheet.getCell('I5').value = 'Kelas / Semester'
    sheet.getCell('J5').value = `: ${metadata.classCode} / ${metadata.termName}`
    sheet.getCell('I5').font = { bold: true, size: 10 }

    sheet.getCell('A6').value = 'Dosen Pengampu'
    sheet.getCell('B6').value = `: ${metadata.lecturerName} (NIDN: ${metadata.lecturerNidn || '-'})`
    sheet.getCell('A6').font = { bold: true, size: 10 }

    sheet.getCell('I6').value = 'Jadwal & Ruang'
    sheet.getCell('J6').value = `: ${metadata.schedule} | ${metadata.room}`
    sheet.getCell('I6').font = { bold: true, size: 10 }

    sheet.getCell('A7').value = 'Total Mahasiswa'
    sheet.getCell('B7').value = `: ${gradebook.totalStudents} Mahasiswa`
    sheet.getCell('A7').font = { bold: true, size: 10 }

    sheet.getCell('I7').value = 'Tanggal Ekspor'
    sheet.getCell('J7').value = `: ${metadata.generatedAt}`
    sheet.getCell('I7').font = { bold: true, size: 10 }

    // Map weights for table header descriptions
    const weightMap = new Map<string, number>()
    for (const w of gradebook.weights) {
      weightMap.set(w.componentName, w.weightPercentage)
    }
    const wAbsen = weightMap.get('ATTENDANCE') ?? 10
    const wTugas = weightMap.get('ASSIGNMENT') ?? 20
    const wKuis = weightMap.get('QUIZ') ?? 15
    const wUts = weightMap.get('MIDTERM_EXAM') ?? 25
    const wUas = weightMap.get('FINAL_EXAM') ?? 30

    // 3. Table Header Structure (Rows 9 & 10)
    sheet.getRow(9).height = 24
    sheet.getRow(10).height = 24

    // Top Level Header Row (Row 9)
    sheet.mergeCells('A9:A10')
    sheet.getCell('A9').value = 'No'

    sheet.mergeCells('B9:B10')
    sheet.getCell('B9').value = 'NIM'

    sheet.mergeCells('C9:C10')
    sheet.getCell('C9').value = 'Nama Mahasiswa'

    sheet.mergeCells('D9:D10')
    sheet.getCell('D9').value = 'Email'

    sheet.mergeCells('E9:F9')
    sheet.getCell('E9').value = `Presensi (${wAbsen}%)`

    sheet.mergeCells('G9:H9')
    sheet.getCell('G9').value = `Tugas (${wTugas}%)`

    sheet.mergeCells('I9:J9')
    sheet.getCell('I9').value = `Kuis (${wKuis}%)`

    sheet.mergeCells('K9:L9')
    sheet.getCell('K9').value = `UTS (${wUts}%)`

    sheet.mergeCells('M9:N9')
    sheet.getCell('M9').value = `UAS (${wUas}%)`

    sheet.mergeCells('O9:O10')
    sheet.getCell('O9').value = 'Nilai Akhir (NA)'

    sheet.mergeCells('P9:P10')
    sheet.getCell('P9').value = 'Indeks'

    sheet.mergeCells('Q9:Q10')
    sheet.getCell('Q9').value = 'Angka Mutu'

    sheet.mergeCells('R9:R10')
    sheet.getCell('R9').value = 'Status Kelulusan'

    // Sub Level Header Row (Row 10)
    sheet.getCell('E10').value = 'Skor'
    sheet.getCell('F10').value = 'Terbobot'
    sheet.getCell('G10').value = 'Rata-rata'
    sheet.getCell('H10').value = 'Terbobot'
    sheet.getCell('I10').value = 'Rata-rata'
    sheet.getCell('J10').value = 'Terbobot'
    sheet.getCell('K10').value = 'Skor'
    sheet.getCell('L10').value = 'Terbobot'
    sheet.getCell('M10').value = 'Skor'
    sheet.getCell('N10').value = 'Terbobot'

    // Apply Table Header Styles
    const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R']
    for (const col of headerCols) {
      const c9 = sheet.getCell(`${col}9`)
      const c10 = sheet.getCell(`${col}10`)

      c9.fill = SLATE_FILL
      c9.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      c9.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      c9.border = BORDER_THIN

      c10.fill = SUBHEADER_FILL
      c10.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } }
      c10.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      c10.border = BORDER_THIN
    }

    // 4. Data Rows (Starting at Row 11)
    let rowIndex = 11
    let studentNumber = 1

    for (const s of gradebook.students) {
      const row = sheet.getRow(rowIndex)
      row.height = 20
      const isZebra = studentNumber % 2 === 0

      // Values
      row.getCell(1).value = studentNumber
      row.getCell(2).value = s.studentNim || '-'
      row.getCell(3).value = s.studentName
      row.getCell(4).value = s.studentEmail
      row.getCell(5).value = s.attendance.score
      row.getCell(6).value = s.attendance.weightedScore
      row.getCell(7).value = s.assignment.averageScore
      row.getCell(8).value = s.assignment.weightedScore
      row.getCell(9).value = s.quiz.averageScore
      row.getCell(10).value = s.quiz.weightedScore
      row.getCell(11).value = s.midtermExam.score ?? 0
      row.getCell(12).value = s.midtermExam.weightedScore
      row.getCell(13).value = s.finalExam.score ?? 0
      row.getCell(14).value = s.finalExam.weightedScore
      row.getCell(15).value = s.finalGrade.numericScore
      row.getCell(16).value = s.finalGrade.letterGrade
      row.getCell(17).value = s.finalGrade.gradePoint

      // Status
      let statusText = 'LULUS'
      if (s.finalGrade.isAttendanceDisqualified) {
        statusText = 'DISKUALIFIKASI PRESENSI'
      } else if (s.finalGrade.letterGrade === 'E' || s.finalGrade.letterGrade === 'D') {
        statusText = 'TIDAK LULUS'
      }
      row.getCell(18).value = statusText

      // Formatting & Alignment
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
      row.getCell(2).font = { name: 'Consolas', size: 10 }
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' }
      row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' }

      // Number formatting for scores (Columns 5 to 15, 17)
      for (const colIdx of [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17]) {
        const cell = row.getCell(colIdx)
        cell.numFmt = '0.00'
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      }

      // Final Grade Bold
      row.getCell(15).font = { bold: true, name: 'Consolas', size: 10 }

      // Letter Grade Styling & Badge
      const letterCell = row.getCell(16)
      letterCell.alignment = { horizontal: 'center', vertical: 'middle' }
      letterCell.font = { bold: true, size: 10 }

      const lg = s.finalGrade.letterGrade
      if (lg === 'A' || lg === 'AB') {
        letterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } } // Light green
        letterCell.font = { bold: true, color: { argb: 'FF166534' } }
      } else if (lg === 'B' || lg === 'BC') {
        letterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } } // Light blue
        letterCell.font = { bold: true, color: { argb: 'FF1E40AF' } }
      } else if (lg === 'C') {
        letterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } } // Light amber
        letterCell.font = { bold: true, color: { argb: 'FF92400E' } }
      } else if (lg === 'D') {
        letterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } } // Light orange
        letterCell.font = { bold: true, color: { argb: 'FF9A3412' } }
      } else {
        letterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } } // Light red
        letterCell.font = { bold: true, color: { argb: 'FF991B1B' } }
      }

      // Status cell styling
      const statusCell = row.getCell(18)
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' }
      statusCell.font = { bold: true, size: 9 }
      if (statusText === 'LULUS') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
        statusCell.font = { bold: true, color: { argb: 'FF166534' } }
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
        statusCell.font = { bold: true, color: { argb: 'FF991B1B' } }
      }

      // Borders and zebra striping
      for (let c = 1; c <= 18; c++) {
        const cell = row.getCell(c)
        cell.border = BORDER_THIN
        if (isZebra && c !== 16 && c !== 18) {
          cell.fill = ZEBRA_FILL
        }
      }

      rowIndex++
      studentNumber++
    }

    // 5. Summary Footer Rows (Rata-rata, Nilai Tertinggi, Nilai Terendah)
    const summaryStartRow = rowIndex
    sheet.getRow(summaryStartRow).height = 22

    sheet.mergeCells(`A${summaryStartRow}:D${summaryStartRow}`)
    const avgLabel = sheet.getCell(`A${summaryStartRow}`)
    avgLabel.value = 'RATA-RATA KELAS'
    avgLabel.font = { bold: true, size: 10 }
    avgLabel.alignment = { horizontal: 'right', vertical: 'middle' }

    sheet.getCell(`O${summaryStartRow}`).value = gradebook.averageFinalScore ?? 0
    sheet.getCell(`O${summaryStartRow}`).numFmt = '0.00'
    sheet.getCell(`O${summaryStartRow}`).font = { bold: true, color: { argb: 'FF1E293B' } }
    sheet.getCell(`O${summaryStartRow}`).alignment = { horizontal: 'right', vertical: 'middle' }

    // Nilai Tertinggi
    const maxRow = summaryStartRow + 1
    sheet.getRow(maxRow).height = 20
    sheet.mergeCells(`A${maxRow}:D${maxRow}`)
    const maxLabel = sheet.getCell(`A${maxRow}`)
    maxLabel.value = 'NILAI TERTINGGI (MAKSIMUM)'
    maxLabel.font = { bold: true, size: 10 }
    maxLabel.alignment = { horizontal: 'right', vertical: 'middle' }

    sheet.getCell(`O${maxRow}`).value = gradebook.highestScore ?? 0
    sheet.getCell(`O${maxRow}`).numFmt = '0.00'
    sheet.getCell(`O${maxRow}`).font = { bold: true, color: { argb: 'FF166534' } }
    sheet.getCell(`O${maxRow}`).alignment = { horizontal: 'right', vertical: 'middle' }

    // Nilai Terendah
    const minRow = summaryStartRow + 2
    sheet.getRow(minRow).height = 20
    sheet.mergeCells(`A${minRow}:D${minRow}`)
    const minLabel = sheet.getCell(`A${minRow}`)
    minLabel.value = 'NILAI TERENDAH (MINIMUM)'
    minLabel.font = { bold: true, size: 10 }
    minLabel.alignment = { horizontal: 'right', vertical: 'middle' }

    sheet.getCell(`O${minRow}`).value = gradebook.lowestScore ?? 0
    sheet.getCell(`O${minRow}`).numFmt = '0.00'
    sheet.getCell(`O${minRow}`).font = { bold: true, color: { argb: 'FF991B1B' } }
    sheet.getCell(`O${minRow}`).alignment = { horizontal: 'right', vertical: 'middle' }

    // Apply footer borders
    for (let r = summaryStartRow; r <= minRow; r++) {
      for (let c = 1; c <= 18; c++) {
        const cell = sheet.getRow(r).getCell(c)
        cell.border = BORDER_THIN
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
      }
    }

    // Set Column Widths
    sheet.getColumn(1).width = 6   // No
    sheet.getColumn(2).width = 16  // NIM
    sheet.getColumn(3).width = 28  // Nama
    sheet.getColumn(4).width = 26  // Email
    sheet.getColumn(5).width = 12  // Presensi Skor
    sheet.getColumn(6).width = 12  // Presensi Bobot
    sheet.getColumn(7).width = 12  // Tugas Skor
    sheet.getColumn(8).width = 12  // Tugas Bobot
    sheet.getColumn(9).width = 12  // Kuis Skor
    sheet.getColumn(10).width = 12 // Kuis Bobot
    sheet.getColumn(11).width = 12 // UTS Skor
    sheet.getColumn(12).width = 12 // UTS Bobot
    sheet.getColumn(13).width = 12 // UAS Skor
    sheet.getColumn(14).width = 12 // UAS Bobot
    sheet.getColumn(15).width = 16 // NA
    sheet.getColumn(16).width = 12 // Indeks
    sheet.getColumn(17).width = 14 // IP
    sheet.getColumn(18).width = 24 // Status

    // ------------------------------------------------------------------------
    // SHEET 2: DISTRIBUSI NILAI & STATISTIK KELAS
    // ------------------------------------------------------------------------
    const statsSheet = workbook.addWorksheet('Distribusi & Bobot', {
      pageSetup: { orientation: 'portrait', paperSize: 9 }
    })

    statsSheet.mergeCells('A1:F1')
    statsSheet.getCell('A1').value = 'STATISTIK DISTRIBUSI NILAI & KONFIGURASI BOBOT'
    statsSheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    statsSheet.getCell('A1').fill = NAVY_FILL
    statsSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    statsSheet.getRow(1).height = 28

    // Tabel Bobot Penilaian
    statsSheet.getCell('A3').value = '1. Konfigurasi Bobot Penilaian Kelas'
    statsSheet.getCell('A3').font = { bold: true, size: 11, color: { argb: 'FF0F172A' } }

    statsSheet.getCell('A4').value = 'Komponen Evaluasi'
    statsSheet.getCell('B4').value = 'Bobot (%)'
    statsSheet.getCell('C4').value = 'Deskripsi Komponen'
    for (const c of ['A', 'B', 'C']) {
      const cell = statsSheet.getCell(`${c}4`)
      cell.fill = SLATE_FILL
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.border = BORDER_THIN
    }

    let wRow = 5
    for (const w of gradebook.weights) {
      statsSheet.getCell(`A${wRow}`).value = w.componentName
      statsSheet.getCell(`B${wRow}`).value = `${w.weightPercentage}%`
      statsSheet.getCell(`C${wRow}`).value = w.description || '-'
      statsSheet.getCell(`A${wRow}`).border = BORDER_THIN
      statsSheet.getCell(`B${wRow}`).border = BORDER_THIN
      statsSheet.getCell(`C${wRow}`).border = BORDER_THIN
      wRow++
    }

    // Tabel Distribusi Nilai Huruf
    const dStart = wRow + 2
    statsSheet.getCell(`A${dStart}`).value = '2. Distribusi Indeks Huruf Mutu Standar ITW'
    statsSheet.getCell(`A${dStart}`).font = { bold: true, size: 11, color: { argb: 'FF0F172A' } }

    const dHeaderRow = dStart + 1
    statsSheet.getCell(`A${dHeaderRow}`).value = 'Indeks'
    statsSheet.getCell(`B${dHeaderRow}`).value = 'Rentang Skor'
    statsSheet.getCell(`C${dHeaderRow}`).value = 'Bobot Mutu (IP)'
    statsSheet.getCell(`D${dHeaderRow}`).value = 'Jumlah Mahasiswa'
    statsSheet.getCell(`E${dHeaderRow}`).value = 'Persentase (%)'
    for (const c of ['A', 'B', 'C', 'D', 'E']) {
      const cell = statsSheet.getCell(`${c}${dHeaderRow}`)
      cell.fill = SLATE_FILL
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.border = BORDER_THIN
      cell.alignment = { horizontal: 'center' }
    }

    const standardGrades: { letter: LetterGrade; range: string; ip: number }[] = [
      { letter: 'A', range: '≥ 85.00', ip: 4.0 },
      { letter: 'AB', range: '80.00 - 84.99', ip: 3.5 },
      { letter: 'B', range: '70.00 - 79.99', ip: 3.0 },
      { letter: 'BC', range: '65.00 - 69.99', ip: 2.5 },
      { letter: 'C', range: '55.00 - 64.99', ip: 2.0 },
      { letter: 'D', range: '45.00 - 54.99', ip: 1.0 },
      { letter: 'E', range: '< 45.00 atau Kehadiran < 75%', ip: 0.0 }
    ]

    let distRow = dHeaderRow + 1
    for (const g of standardGrades) {
      const count = gradebook.gradeDistribution[g.letter] || 0
      const pct = gradebook.totalStudents > 0
        ? Math.round((count / gradebook.totalStudents) * 1000) / 10
        : 0

      statsSheet.getCell(`A${distRow}`).value = g.letter
      statsSheet.getCell(`B${distRow}`).value = g.range
      statsSheet.getCell(`C${distRow}`).value = g.ip.toFixed(2)
      statsSheet.getCell(`D${distRow}`).value = count
      statsSheet.getCell(`E${distRow}`).value = `${pct}%`

      statsSheet.getCell(`A${distRow}`).alignment = { horizontal: 'center' }
      statsSheet.getCell(`B${distRow}`).alignment = { horizontal: 'center' }
      statsSheet.getCell(`C${distRow}`).alignment = { horizontal: 'center' }
      statsSheet.getCell(`D${distRow}`).alignment = { horizontal: 'right' }
      statsSheet.getCell(`E${distRow}`).alignment = { horizontal: 'right' }

      for (const c of ['A', 'B', 'C', 'D', 'E']) {
        statsSheet.getCell(`${c}${distRow}`).border = BORDER_THIN
      }
      distRow++
    }

    statsSheet.getColumn(1).width = 20
    statsSheet.getColumn(2).width = 24
    statsSheet.getColumn(3).width = 30
    statsSheet.getColumn(4).width = 20
    statsSheet.getColumn(5).width = 18

    // Generate output buffer
    const arrayBuffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Menghasilkan file Excel (.xlsx) Matriks Presensi 16 Pertemuan resmi Institut Teknologi Wakanda
   */
  public async generateAttendanceMatrixExcel(classId: string): Promise<Buffer> {
    const [matrix, metadata] = await Promise.all([
      this.getAttendanceMatrixData(classId),
      this.getAcademicMetadata(classId)
    ])

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Institut Teknologi Wakanda - Academic LMS'
    workbook.lastModifiedBy = metadata.lecturerName
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Matriks Presensi 16 Sesi', {
      views: [{ state: 'frozen', xSplit: 3, ySplit: 8 }],
      pageSetup: { orientation: 'landscape', paperSize: 9 }
    })

    const NAVY_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
    const SLATE_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    const ZEBRA_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    const BORDER_THIN: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    }

    // 1. Title Banner
    sheet.mergeCells('A1:AA1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'INSTITUT TEKNOLOGI WAKANDA'
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = NAVY_FILL
    sheet.getRow(1).height = 30

    sheet.mergeCells('A2:AA2')
    const subTitle = sheet.getCell('A2')
    subTitle.value = 'MATRIKS REKAPITULASI PRESENSI 16 PERTEMUAN KULIAH'
    subTitle.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFE2E8F0' } }
    subTitle.alignment = { horizontal: 'center', vertical: 'middle' }
    subTitle.fill = NAVY_FILL
    sheet.getRow(2).height = 20

    // 2. Metadata Box
    sheet.getCell('A4').value = 'Mata Kuliah'
    sheet.getCell('B4').value = `: [${metadata.courseCode}] ${metadata.courseName} (${metadata.credits} SKS)`
    sheet.getCell('A4').font = { bold: true, size: 10 }
    sheet.getCell('B4').font = { bold: true, size: 10 }

    sheet.getCell('J4').value = 'Kelas / Semester'
    sheet.getCell('K4').value = `: ${metadata.classCode} / ${metadata.termName}`
    sheet.getCell('J4').font = { bold: true, size: 10 }

    sheet.getCell('A5').value = 'Dosen Pengampu'
    sheet.getCell('B5').value = `: ${metadata.lecturerName} (NIDN: ${metadata.lecturerNidn || '-'})`
    sheet.getCell('A5').font = { bold: true, size: 10 }

    sheet.getCell('J5').value = 'Rata-rata Presensi'
    sheet.getCell('K5').value = `: ${matrix.classAverageAttendance}%`
    sheet.getCell('J5').font = { bold: true, size: 10 }

    sheet.getCell('A6').value = 'Total Mahasiswa'
    sheet.getCell('B6').value = `: ${matrix.students.length} Mahasiswa (Layak UAS: ${matrix.eligibleCount}, Tidak Layak: ${matrix.disqualifiedCount})`
    sheet.getCell('A6').font = { bold: true, size: 10 }

    sheet.getCell('J6').value = 'Tanggal Unduh'
    sheet.getCell('K6').value = `: ${metadata.generatedAt}`
    sheet.getCell('J6').font = { bold: true, size: 10 }

    // 3. Header Rows (Row 8)
    const headerRow = sheet.getRow(8)
    headerRow.height = 28

    const headers: { col: number; name: string; width: number }[] = [
      { col: 1, name: 'No', width: 6 },
      { col: 2, name: 'NIM', width: 16 },
      { col: 3, name: 'Nama Mahasiswa', width: 26 },
      // Pertemuan 1 - 16
      ...Array.from({ length: 16 }, (_, i) => ({
        col: 4 + i,
        name: `P${String(i + 1).padStart(2, '0')}`,
        width: 6
      })),
      { col: 20, name: 'H', width: 6 },
      { col: 21, name: 'T', width: 6 },
      { col: 22, name: 'I', width: 6 },
      { col: 23, name: 'S', width: 6 },
      { col: 24, name: 'A', width: 6 },
      { col: 25, name: 'Total Masuk', width: 12 },
      { col: 26, name: '% Hadir', width: 12 },
      { col: 27, name: 'Kelayakan UAS', width: 22 }
    ]

    for (const h of headers) {
      const cell = headerRow.getCell(h.col)
      cell.value = h.name
      cell.fill = SLATE_FILL
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = BORDER_THIN
      sheet.getColumn(h.col).width = h.width
    }

    // 4. Data Rows
    let rIdx = 9
    let studentNumber = 1

    for (const s of matrix.students) {
      const row = sheet.getRow(rIdx)
      row.height = 20
      const isZebra = studentNumber % 2 === 0

      row.getCell(1).value = studentNumber
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

      row.getCell(2).value = s.studentNim || '-'
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
      row.getCell(2).font = { name: 'Consolas', size: 9 }

      row.getCell(3).value = s.studentName
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' }

      // 16 Session Codes
      for (let sessIdx = 0; sessIdx < 16; sessIdx++) {
        const cell = row.getCell(4 + sessIdx)
        const sessData = s.sessions[sessIdx]
        const code = sessData ? sessData.statusCode : '-'
        cell.value = code
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.font = { bold: true, size: 9 }

        if (code === 'H') {
          cell.font = { bold: true, color: { argb: 'FF16A34A' } } // Green
        } else if (code === 'T') {
          cell.font = { bold: true, color: { argb: 'FFD97706' } } // Amber
        } else if (code === 'I') {
          cell.font = { bold: true, color: { argb: 'FF2563EB' } } // Blue
        } else if (code === 'S') {
          cell.font = { bold: true, color: { argb: 'FF7C3AED' } } // Purple
        } else if (code === 'A') {
          cell.font = { bold: true, color: { argb: 'FFDC2626' } } // Red
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
        } else {
          cell.font = { color: { argb: 'FF94A3B8' } }
        }
      }

      // Totals
      row.getCell(20).value = s.totalPresent
      row.getCell(20).alignment = { horizontal: 'center', vertical: 'middle' }

      row.getCell(21).value = s.totalLate
      row.getCell(21).alignment = { horizontal: 'center', vertical: 'middle' }

      row.getCell(22).value = s.totalPermit
      row.getCell(22).alignment = { horizontal: 'center', vertical: 'middle' }

      row.getCell(23).value = s.totalSick
      row.getCell(23).alignment = { horizontal: 'center', vertical: 'middle' }

      row.getCell(24).value = s.totalAbsent
      row.getCell(24).alignment = { horizontal: 'center', vertical: 'middle' }
      if (s.totalAbsent > 0) {
        row.getCell(24).font = { bold: true, color: { argb: 'FFDC2626' } }
      }

      row.getCell(25).value = s.totalAttended
      row.getCell(25).alignment = { horizontal: 'center', vertical: 'middle' }
      row.getCell(25).font = { bold: true }

      row.getCell(26).value = `${s.attendancePercentage}%`
      row.getCell(26).alignment = { horizontal: 'right', vertical: 'middle' }
      row.getCell(26).font = { bold: true, name: 'Consolas', size: 9 }

      // Kelayakan UAS
      const elCell = row.getCell(27)
      const elText = s.isEligibleForUas ? 'MEMENUHI SYARAT' : 'TIDAK MEMENUHI (<75%)'
      elCell.value = elText
      elCell.alignment = { horizontal: 'center', vertical: 'middle' }
      elCell.font = { bold: true, size: 9 }

      if (s.isEligibleForUas) {
        elCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
        elCell.font = { bold: true, color: { argb: 'FF166534' } }
      } else {
        elCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
        elCell.font = { bold: true, color: { argb: 'FF991B1B' } }
      }

      for (let c = 1; c <= 27; c++) {
        const cell = row.getCell(c)
        cell.border = BORDER_THIN
        if (isZebra && !cell.fill) {
          cell.fill = ZEBRA_FILL
        }
      }

      rIdx++
      studentNumber++
    }

    // 5. Total per session row
    const totalSessRow = sheet.getRow(rIdx)
    totalSessRow.height = 22
    sheet.mergeCells(`A${rIdx}:C${rIdx}`)
    totalSessRow.getCell(1).value = 'TOTAL HADIR PER SESI'
    totalSessRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
    totalSessRow.getCell(1).font = { bold: true, size: 9 }

    for (let sessIdx = 0; sessIdx < 16; sessIdx++) {
      const sessCol = 4 + sessIdx
      const presentCount = matrix.students.filter((s) => {
        const code = s.sessions[sessIdx]?.statusCode
        return code === 'H' || code === 'T'
      }).length
      const cell = totalSessRow.getCell(sessCol)
      cell.value = presentCount
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.font = { bold: true, size: 9 }
    }

    for (let c = 1; c <= 27; c++) {
      const cell = totalSessRow.getCell(c)
      cell.border = BORDER_THIN
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    }

    // 6. Legend Box
    const legRow = rIdx + 2
    sheet.getCell(`A${legRow}`).value = 'Keterangan Kode Presensi:'
    sheet.getCell(`A${legRow}`).font = { bold: true, size: 10 }

    const legData = [
      'H = Hadir (Tepat Waktu)',
      'T = Terlambat (Dalam Toleransi)',
      'I = Izin Resmi',
      'S = Sakit (Surat Dokter)',
      'A = Alfa / Tanpa Keterangan',
      '* Catatan Ketentuan Akademik: Kehadiran minimal 75.0% adalah syarat mutlak mengikuti Ujian Akhir Semester (UAS).'
    ]
    legData.forEach((text, i) => {
      const cell = sheet.getCell(`A${legRow + 1 + i}`)
      cell.value = text
      cell.font = { size: 9, italic: i === legData.length - 1, color: { argb: i === legData.length - 1 ? 'FFDC2626' : 'FF475569' } }
    })

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Menghasilkan dokumen cetak resmi (HTML/CSS) Transkrip Rekapitulasi Nilai Kelas
   */
  public async generateGradebookHtml(classId: string): Promise<string> {
    const [gradebook, metadata] = await Promise.all([
      this.gradebookSvc.getClassGradebook(classId),
      this.getAcademicMetadata(classId)
    ])

    const weightMap = new Map<string, number>()
    for (const w of gradebook.weights) {
      weightMap.set(w.componentName, w.weightPercentage)
    }

    const studentsRowsHtml = gradebook.students.map((s, idx) => {
      let statusBadge = ''
      if (s.finalGrade.isAttendanceDisqualified) {
        statusBadge = '<span class="badge badge-danger">DISKUALIFIKASI PRESENSI</span>'
      } else if (s.finalGrade.letterGrade === 'E' || s.finalGrade.letterGrade === 'D') {
        statusBadge = '<span class="badge badge-danger">TIDAK LULUS</span>'
      } else {
        statusBadge = '<span class="badge badge-success">LULUS</span>'
      }

      const letterGradeClass = ['A', 'AB'].includes(s.finalGrade.letterGrade)
        ? 'grade-a'
        : ['B', 'BC'].includes(s.finalGrade.letterGrade)
        ? 'grade-b'
        : s.finalGrade.letterGrade === 'C'
        ? 'grade-c'
        : 'grade-e'

      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center font-mono">${s.studentNim || '-'}</td>
          <td class="text-left font-semibold">${s.studentName}</td>
          <td class="text-right font-mono">${s.attendance.score.toFixed(2)}</td>
          <td class="text-right font-mono">${s.assignment.averageScore.toFixed(2)}</td>
          <td class="text-right font-mono">${s.quiz.averageScore.toFixed(2)}</td>
          <td class="text-right font-mono">${(s.midtermExam.score ?? 0).toFixed(2)}</td>
          <td class="text-right font-mono">${(s.finalExam.score ?? 0).toFixed(2)}</td>
          <td class="text-right font-mono font-bold text-navy">${s.finalGrade.numericScore.toFixed(2)}</td>
          <td class="text-center font-bold ${letterGradeClass}">${s.finalGrade.letterGrade}</td>
          <td class="text-right font-mono">${s.finalGrade.gradePoint.toFixed(2)}</td>
          <td class="text-center">${statusBadge}</td>
        </tr>
      `
    }).join('')

    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transkrip Nilai Kelas - ${metadata.courseCode} ${metadata.classCode} - ITW</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0F172A;
      --slate: #334155;
      --light-slate: #F8FAFC;
      --border: #CBD5E1;
      --green: #16A34A;
      --red: #DC2626;
      --amber: #D97706;
      --blue: #2563EB;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      color: #1e293b;
      background: #e2e8f0;
      line-height: 1.4;
      padding: 24px;
    }
    .sheet-container {
      max-width: 1100px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    /* Toolbar aksi untuk preview browser */
    .action-toolbar {
      max-width: 1100px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0F172A;
      padding: 12px 20px;
      border-radius: 8px;
      color: #fff;
    }
    .action-toolbar .title {
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-group {
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: #2563EB;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1D4ED8;
    }
    .btn-secondary {
      background: #334155;
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    /* KOP SURAT RESMI INSTITUT TEKNOLOGI WAKANDA */
    .kop-surat {
      display: flex;
      align-items: center;
      gap: 20px;
      border-bottom: 3px double #0F172A;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .kop-logo {
      width: 76px;
      height: 76px;
      flex-shrink: 0;
    }
    .kop-text {
      flex: 1;
      text-align: center;
    }
    .kop-ministry {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #0F172A;
    }
    .kop-institution {
      font-size: 16pt;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #0F172A;
      margin: 2px 0;
    }
    .kop-faculty {
      font-size: 10pt;
      font-weight: 600;
      color: #334155;
    }
    .kop-address {
      font-size: 8.5pt;
      color: #64748B;
      margin-top: 4px;
    }

    /* DOCUMENT TITLE */
    .doc-title-container {
      text-align: center;
      margin-bottom: 24px;
    }
    .doc-title {
      font-size: 14pt;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #0F172A;
    }
    .doc-subtitle {
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      margin-top: 2px;
    }

    /* METADATA GRID */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 24px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 9.5pt;
    }
    .meta-item {
      display: flex;
    }
    .meta-label {
      width: 150px;
      font-weight: 600;
      color: #475569;
    }
    .meta-val {
      flex: 1;
      color: #0F172A;
      font-weight: 500;
    }

    /* MAIN TABLE */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 9pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #CBD5E1;
      padding: 6px 8px;
    }
    table.data-table th {
      background: #0F172A;
      color: #ffffff;
      font-weight: 600;
      text-align: center;
      vertical-align: middle;
      font-size: 8.5pt;
    }
    table.data-table tr:nth-child(even) td {
      background-color: #F8FAFC;
    }
    .font-mono {
      font-family: 'JetBrains Mono', Consolas, monospace;
    }
    .font-semibold {
      font-weight: 600;
    }
    .font-bold {
      font-weight: 700;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-navy { color: #0F172A; }

    /* BADGES */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .badge-success { background: #DCFCE7; color: #166534; }
    .badge-danger { background: #FEE2E2; color: #991B1B; }
    .grade-a { color: #166534; }
    .grade-b { color: #1E40AF; }
    .grade-c { color: #92400E; }
    .grade-e { color: #991B1B; }

    /* SUMMARY BOXES */
    .summary-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      font-size: 9pt;
    }
    .summary-card {
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      overflow: hidden;
    }
    .summary-card-header {
      background: #1E293B;
      color: #ffffff;
      padding: 6px 12px;
      font-weight: 600;
      font-size: 9pt;
    }
    .summary-card-body {
      padding: 10px 14px;
      background: #ffffff;
    }

    /* SIGNATURE BLOCK */
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 280px;
      text-align: center;
      font-size: 9.5pt;
    }
    .sig-date {
      margin-bottom: 8px;
    }
    .sig-title {
      font-weight: 600;
      color: #334155;
      margin-bottom: 70px;
    }
    .sig-name {
      font-weight: 700;
      text-decoration: underline;
      color: #0F172A;
    }
    .sig-nidn {
      font-size: 8.5pt;
      color: #64748B;
      margin-top: 2px;
    }

    /* PRINT STYLES */
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .sheet-container {
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .action-toolbar {
        display: none !important;
      }
      table.data-table th {
        background: #0F172A !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .badge, .summary-card-header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar -->
  <div class="action-toolbar">
    <div class="title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      Laporan Transkrip Nilai Akademik Resmi Institut Teknologi Wakanda
    </div>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Cetak Dokumen
      </button>
      <a class="btn btn-secondary" href="/api/reports/classes/${classId}/gradebook?format=xlsx" download>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Unduh Excel (.xlsx)
      </a>
    </div>
  </div>

  <div class="sheet-container">
    <!-- KOP SURAT -->
    <div class="kop-surat">
      <div class="kop-logo">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" fill="#0F172A" stroke="#2563EB" stroke-width="4"/>
          <path d="M50 18L76 82H63L50 48L37 82H24L50 18Z" fill="#FFFFFF"/>
          <polygon points="50,28 67,78 57,78 50,56 43,78 33,78" fill="#2563EB"/>
          <circle cx="50" cy="50" r="10" fill="#38BDF8"/>
        </svg>
      </div>
      <div class="kop-text">
        <div class="kop-ministry">${metadata.institutionName}</div>
        <div class="kop-institution">${metadata.institutionSubName}</div>
        <div class="kop-faculty">${metadata.facultyName} | ${metadata.programName}</div>
        <div class="kop-address">${metadata.campusAddress} | ${metadata.campusContact}</div>
      </div>
    </div>

    <!-- DOCUMENT TITLE -->
    <div class="doc-title-container">
      <div class="doc-title">DAFTAR NILAI AKHIR SEMESTER (TRANSKRIP KELAS)</div>
      <div class="doc-subtitle">TAHUN AKADEMIK: ${metadata.academicYear.toUpperCase()}</div>
    </div>

    <!-- METADATA GRID -->
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Mata Kuliah</span>
        <span class="meta-val">: [${metadata.courseCode}] ${metadata.courseName} (${metadata.credits} SKS)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Kelas / Semester</span>
        <span class="meta-val">: ${metadata.classCode} / ${metadata.termName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Dosen Pengampu</span>
        <span class="meta-val">: ${metadata.lecturerName} (NIDN: ${metadata.lecturerNidn || '-'})</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Jadwal / Ruang</span>
        <span class="meta-val">: ${metadata.schedule} / ${metadata.room}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Program Studi</span>
        <span class="meta-val">: ${metadata.programName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Tanggal Cetak</span>
        <span class="meta-val">: ${metadata.generatedAt}</span>
      </div>
    </div>

    <!-- MAIN DATA TABLE -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 35px;">No</th>
          <th style="width: 100px;">NIM</th>
          <th>Nama Mahasiswa</th>
          <th style="width: 65px;">Presensi<br><small>(${weightMap.get('ATTENDANCE') ?? 10}%)</small></th>
          <th style="width: 65px;">Tugas<br><small>(${weightMap.get('ASSIGNMENT') ?? 20}%)</small></th>
          <th style="width: 65px;">Kuis<br><small>(${weightMap.get('QUIZ') ?? 15}%)</small></th>
          <th style="width: 65px;">UTS<br><small>(${weightMap.get('MIDTERM_EXAM') ?? 25}%)</small></th>
          <th style="width: 65px;">UAS<br><small>(${weightMap.get('FINAL_EXAM') ?? 30}%)</small></th>
          <th style="width: 75px;">Nilai Akhir<br><small>(NA)</small></th>
          <th style="width: 55px;">Huruf<br><small>Mutu</small></th>
          <th style="width: 55px;">Angka<br><small>Mutu</small></th>
          <th style="width: 110px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${studentsRowsHtml}
      </tbody>
    </table>

    <!-- SUMMARY SECTION -->
    <div class="summary-section">
      <!-- Bobot Penilaian -->
      <div class="summary-card">
        <div class="summary-card-header">Bobot Komponen Penilaian</div>
        <div class="summary-card-body">
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
            ${gradebook.weights.map(w => `
              <tr>
                <td style="padding: 3px 0; color: #475569;">${w.componentName}</td>
                <td style="padding: 3px 0; font-weight: 700; text-align: right;">${w.weightPercentage}%</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>

      <!-- Statistik Kelas -->
      <div class="summary-card">
        <div class="summary-card-header">Ringkasan Statistik Kelas</div>
        <div class="summary-card-body">
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
            <tr>
              <td style="padding: 3px 0; color: #475569;">Total Mahasiswa Terdaftar</td>
              <td style="padding: 3px 0; font-weight: 700; text-align: right;">${gradebook.totalStudents} Orang</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #475569;">Rata-rata Nilai Akhir (NA)</td>
              <td style="padding: 3px 0; font-weight: 700; text-align: right;">${(gradebook.averageFinalScore ?? 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #475569;">Nilai Tertinggi (Maksimum)</td>
              <td style="padding: 3px 0; font-weight: 700; text-align: right; color: #166534;">${(gradebook.highestScore ?? 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #475569;">Nilai Terendah (Minimum)</td>
              <td style="padding: 3px 0; font-weight: 700; text-align: right; color: #991B1B;">${(gradebook.lowestScore ?? 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <!-- SIGNATURE SECTION -->
    <div class="signature-section">
      <div class="sig-col">
        <div class="sig-date">&nbsp;</div>
        <div class="sig-title">Ketua Program Studi ${metadata.programName}</div>
        <div class="sig-name">${metadata.headOfDepartmentName}</div>
        <div class="sig-nidn">NIDN: ${metadata.headOfDepartmentNidn || '-'}</div>
      </div>

      <div class="sig-col">
        <div class="sig-date">Wakanda City, ${metadata.generatedAt}</div>
        <div class="sig-title">Dosen Pengampu Mata Kuliah</div>
        <div class="sig-name">${metadata.lecturerName}</div>
        <div class="sig-nidn">NIDN: ${metadata.lecturerNidn || '-'}</div>
      </div>
    </div>
  </div>

</body>
</html>
    `.trim()
  }

  /**
   * Menghasilkan dokumen cetak resmi (HTML/CSS) Berita Acara Perkuliahan dan Presensi Kelas
   */
  public async generateBeritaAcaraHtml(classId: string): Promise<string> {
    const [matrix, metadata] = await Promise.all([
      this.getAttendanceMatrixData(classId),
      this.getAcademicMetadata(classId)
    ])

    const sessionRowsHtml = matrix.sessions.map((s) => {
      // Hitung kehadiran sesi ini
      const presentCount = matrix.students.filter((st) => {
        const cell = st.sessions.find((c) => c.sessionId === s.id)
        return cell && (cell.statusCode === 'H' || cell.statusCode === 'T')
      }).length

      const absentCount = matrix.students.length - presentCount
      const pct = matrix.students.length > 0
        ? Math.round((presentCount / matrix.students.length) * 1000) / 10
        : 0

      const isExam = s.sessionNumber === 8 || s.sessionNumber === 16 || s.sessionType !== 'REGULAR'
      const examBadge = s.sessionNumber === 8
        ? '<span class="badge badge-amber">UTS</span> '
        : s.sessionNumber === 16
        ? '<span class="badge badge-red">UAS</span> '
        : ''

      return `
        <tr>
          <td class="text-center font-bold">${s.sessionNumber}</td>
          <td class="text-center font-mono">${s.sessionDate || '-'}</td>
          <td class="text-left">
            ${examBadge}<strong>${s.title}</strong>
          </td>
          <td class="text-center">${isExam ? 'Ujian Daring / Luring' : 'Tatap Muka & Praktikum'}</td>
          <td class="text-center font-mono font-bold text-green">${presentCount}</td>
          <td class="text-center font-mono font-bold text-red">${absentCount}</td>
          <td class="text-right font-mono">${pct}%</td>
          <td class="text-center paraf-cell">&nbsp;</td>
        </tr>
      `
    }).join('')

    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Berita Acara Perkuliahan - ${metadata.courseCode} ${metadata.classCode} - ITW</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10.5pt;
      color: #1e293b;
      background: #e2e8f0;
      line-height: 1.4;
      padding: 24px;
    }
    .sheet-container {
      max-width: 1050px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }
    .action-toolbar {
      max-width: 1050px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0F172A;
      padding: 12px 20px;
      border-radius: 8px;
      color: #fff;
    }
    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary { background: #2563EB; color: #ffffff; }
    .btn-secondary { background: #334155; color: #ffffff; }

    /* KOP SURAT */
    .kop-surat {
      display: flex;
      align-items: center;
      gap: 20px;
      border-bottom: 3px double #0F172A;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .kop-logo { width: 72px; height: 72px; flex-shrink: 0; }
    .kop-text { flex: 1; text-align: center; }
    .kop-ministry { font-size: 11pt; font-weight: 700; color: #0F172A; }
    .kop-institution { font-size: 15pt; font-weight: 800; letter-spacing: 1px; color: #0F172A; }
    .kop-faculty { font-size: 9.5pt; font-weight: 600; color: #334155; }
    .kop-address { font-size: 8.5pt; color: #64748B; margin-top: 4px; }

    .doc-title-container { text-align: center; margin-bottom: 20px; }
    .doc-title { font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #0F172A; }
    .doc-number { font-size: 9pt; color: #475569; margin-top: 3px; font-family: 'JetBrains Mono', monospace; }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 24px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 9pt;
    }
    .meta-item { display: flex; }
    .meta-label { width: 140px; font-weight: 600; color: #475569; }
    .meta-val { flex: 1; color: #0F172A; font-weight: 500; }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 8.5pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #CBD5E1;
      padding: 5px 8px;
    }
    table.data-table th {
      background: #0F172A;
      color: #ffffff;
      font-weight: 600;
      text-align: center;
    }
    table.data-table tr:nth-child(even) td { background-color: #F8FAFC; }

    .font-mono { font-family: 'JetBrains Mono', Consolas, monospace; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-green { color: #16A34A; }
    .text-red { color: #DC2626; }
    .paraf-cell { width: 75px; }

    .badge {
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 700;
    }
    .badge-amber { background: #FEF3C7; color: #92400E; }
    .badge-red { background: #FEE2E2; color: #991B1B; }

    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .sig-col { width: 280px; text-align: center; font-size: 9pt; }
    .sig-title { font-weight: 600; color: #334155; margin-bottom: 60px; }
    .sig-name { font-weight: 700; text-decoration: underline; color: #0F172A; }
    .sig-nidn { font-size: 8pt; color: #64748B; margin-top: 2px; }

    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet-container { box-shadow: none; padding: 0; }
      .action-toolbar { display: none !important; }
      table.data-table th {
        background: #0F172A !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar -->
  <div class="action-toolbar">
    <div style="font-weight: 600; font-size: 14px;">
      Berita Acara Perkuliahan dan Presensi Kelas (16 Pertemuan) - ITW
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn btn-primary" onclick="window.print()">Cetak Dokumen</button>
      <a class="btn btn-secondary" href="/api/reports/classes/${classId}/attendance-matrix?format=xlsx" download>Unduh Matriks (.xlsx)</a>
    </div>
  </div>

  <div class="sheet-container">
    <!-- KOP SURAT -->
    <div class="kop-surat">
      <div class="kop-logo">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" fill="#0F172A" stroke="#2563EB" stroke-width="4"/>
          <path d="M50 18L76 82H63L50 48L37 82H24L50 18Z" fill="#FFFFFF"/>
          <circle cx="50" cy="50" r="10" fill="#38BDF8"/>
        </svg>
      </div>
      <div class="kop-text">
        <div class="kop-ministry">${metadata.institutionName}</div>
        <div class="kop-institution">${metadata.institutionSubName}</div>
        <div class="kop-faculty">${metadata.facultyName} | ${metadata.programName}</div>
        <div class="kop-address">${metadata.campusAddress}</div>
      </div>
    </div>

    <!-- TITLE -->
    <div class="doc-title-container">
      <div class="doc-title">BERITA ACARA PERKULIAHAN &amp; PRESENSI KELAS</div>
      <div class="doc-number">NOMOR DOKUMEN: BAP/ITW/${metadata.courseCode}/${metadata.classCode}/${new Date().getFullYear()}</div>
    </div>

    <!-- METADATA -->
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Mata Kuliah</span>
        <span class="meta-val">: [${metadata.courseCode}] ${metadata.courseName} (${metadata.credits} SKS)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Kelas / Semester</span>
        <span class="meta-val">: ${metadata.classCode} / ${metadata.termName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Dosen Pengampu</span>
        <span class="meta-val">: ${metadata.lecturerName} (NIDN: ${metadata.lecturerNidn || '-'})</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Jadwal & Ruang</span>
        <span class="meta-val">: ${metadata.schedule} | ${metadata.room}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Total Pertemuan</span>
        <span class="meta-val">: 16 Pertemuan (1-7 Tatap Muka, 8 UTS, 9-15 Tatap Muka, 16 UAS)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Rata-rata Presensi</span>
        <span class="meta-val">: ${matrix.classAverageAttendance}% (Mahasiswa Layak UAS: ${matrix.eligibleCount}/${matrix.students.length})</span>
      </div>
    </div>

    <!-- TABLE 16 SESSIONS -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 35px;">Ke</th>
          <th style="width: 85px;">Tanggal</th>
          <th>Pokok Bahasan / Materi Pembelajaran</th>
          <th style="width: 130px;">Bentuk Pembelajaran</th>
          <th style="width: 50px;">Hadir</th>
          <th style="width: 50px;">Absen</th>
          <th style="width: 60px;">% Hadir</th>
          <th style="width: 75px;">Paraf Dosen</th>
        </tr>
      </thead>
      <tbody>
        ${sessionRowsHtml}
      </tbody>
    </table>

    <!-- SIGNATURE SECTION -->
    <div class="signature-section">
      <div class="sig-col">
        <div class="sig-title">Ketua Program Studi ${metadata.programName}</div>
        <div class="sig-name">${metadata.headOfDepartmentName}</div>
        <div class="sig-nidn">NIDN: ${metadata.headOfDepartmentNidn || '-'}</div>
      </div>

      <div class="sig-col">
        <div style="margin-bottom: 6px; font-size: 8.5pt;">Wakanda City, ${metadata.generatedAt}</div>
        <div class="sig-title" style="margin-bottom: 54px;">Dosen Pengampu Mata Kuliah</div>
        <div class="sig-name">${metadata.lecturerName}</div>
        <div class="sig-nidn">NIDN: ${metadata.lecturerNidn || '-'}</div>
      </div>
    </div>
  </div>

</body>
</html>
    `.trim()
  }
}

export const exportService = new ExportService()
