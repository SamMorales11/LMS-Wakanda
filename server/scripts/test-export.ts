import 'dotenv/config'
import { db, courseClasses } from '../database'
import { exportService } from '../services/export.service'

async function runTest() {
  console.log('='.repeat(70))
  console.log('  🧪 PENGUJIAN OTOMATIS EXPORT SERVICE INSTITUT TEKNOLOGI WAKANDA')
  console.log('='.repeat(70))

  try {
    // 1. Ambil salah satu kelas dari database
    const classes = await db.select().from(courseClasses).limit(1)
    if (classes.length === 0) {
      console.error('❌ Tidak ada kelas perkuliahan ditemukan di database untuk pengujian.')
      process.exit(1)
    }

    const testClass = classes[0]
    const classId = testClass.id
    console.log(`\n[1/6] Menggunakan kelas uji: [ID: ${classId}, Code: ${testClass.code}]`)

    // 2. Metadata Akademik
    console.log('\n[2/6] Menguji getAcademicMetadata(classId)...')
    const metadata = await exportService.getAcademicMetadata(classId)
    console.log(`  ✓ Institusi: ${metadata.institutionSubName}`)
    console.log(`  ✓ Program Studi: ${metadata.programName}`)
    console.log(`  ✓ Mata Kuliah: [${metadata.courseCode}] ${metadata.courseName} (${metadata.credits} SKS)`)
    console.log(`  ✓ Dosen Pengampu: ${metadata.lecturerName} (NIDN: ${metadata.lecturerNidn})`)
    console.log(`  ✓ Tanggal Cetak: ${metadata.generatedAt}`)

    // 3. Matriks Presensi 16 Sesi
    console.log('\n[3/6] Menguji getAttendanceMatrixData(classId)...')
    const matrix = await exportService.getAttendanceMatrixData(classId)
    console.log(`  ✓ Total Sesi: ${matrix.totalSessions} pertemuan`)
    console.log(`  ✓ Total Mahasiswa: ${matrix.students.length} orang`)
    console.log(`  ✓ Rata-rata Presensi Kelas: ${matrix.classAverageAttendance}%`)
    console.log(`  ✓ Mahasiswa Layak UAS (>=75%): ${matrix.eligibleCount}`)
    console.log(`  ✓ Mahasiswa Terdiskualifikasi (<75%): ${matrix.disqualifiedCount}`)
    if (matrix.students.length > 0) {
      const sample = matrix.students[0]
      console.log(`  ✓ Sampel Mahasiswa: ${sample.studentName} (${sample.studentNim})`)
      console.log(`    - Total Hadir (H+T): ${sample.totalAttended}/${matrix.totalSessions} (${sample.attendancePercentage}%)`)
      console.log(`    - Kelayakan UAS: ${sample.isEligibleForUas ? 'MEMENUHI SYARAT' : 'TIDAK MEMENUHI'}`)
    }

    // 4. Generate Gradebook Excel (.xlsx)
    console.log('\n[4/6] Menguji generateGradebookExcel(classId)...')
    const gradebookBuffer = await exportService.generateGradebookExcel(classId)
    console.log(`  ✓ Buffer Excel Gradebook berhasil dibuat! Ukuran: ${gradebookBuffer.length} bytes`)
    // Verifikasi Magic Bytes ZIP / OpenXML: PK (0x50, 0x4B)
    const isZipHeader = gradebookBuffer[0] === 0x50 && gradebookBuffer[1] === 0x4B
    if (!isZipHeader) {
      throw new Error('Header buffer Excel tidak valid (bukan format XLSX/ZIP).')
    }
    console.log('  ✓ Verifikasi Magic Bytes XLSX valid: PK\\x03\\x04')

    // 5. Generate Matriks Presensi Excel (.xlsx)
    console.log('\n[5/6] Menguji generateAttendanceMatrixExcel(classId)...')
    const matrixBuffer = await exportService.generateAttendanceMatrixExcel(classId)
    console.log(`  ✓ Buffer Excel Matriks Presensi berhasil dibuat! Ukuran: ${matrixBuffer.length} bytes`)
    const isMatrixZip = matrixBuffer[0] === 0x50 && matrixBuffer[1] === 0x4B
    if (!isMatrixZip) {
      throw new Error('Header buffer Excel Matriks tidak valid (bukan format XLSX/ZIP).')
    }
    console.log('  ✓ Verifikasi Magic Bytes XLSX valid: PK\\x03\\x04')

    // 6. Generate Print Documents (HTML)
    console.log('\n[6/6] Menguji dokumen cetak siap pakai (HTML/CSS)...')
    const gradebookHtml = await exportService.generateGradebookHtml(classId)
    console.log(`  ✓ Dokumen Transkrip Nilai Kelas HTML: ${gradebookHtml.length} karakter`)
    if (!gradebookHtml.includes('KEMENTERIAN PENDIDIKAN TINGGI') || !gradebookHtml.includes('INSTITUT TEKNOLOGI WAKANDA')) {
      throw new Error('Kop surat ITW tidak ditemukan pada HTML Transkrip Nilai.')
    }
    if (!gradebookHtml.includes('DAFTAR NILAI AKHIR SEMESTER')) {
      throw new Error('Judul dokumen Transkrip Nilai tidak ditemukan.')
    }

    const beritaAcaraHtml = await exportService.generateBeritaAcaraHtml(classId)
    console.log(`  ✓ Dokumen Berita Acara Perkuliahan HTML: ${beritaAcaraHtml.length} karakter`)
    if (!beritaAcaraHtml.includes('BERITA ACARA PERKULIAHAN')) {
      throw new Error('Judul dokumen Berita Acara tidak ditemukan.')
    }
    if (!beritaAcaraHtml.includes('Paraf Dosen')) {
      throw new Error('Kolom Paraf Dosen tidak ditemukan pada Berita Acara.')
    }

    console.log('\n' + '='.repeat(70))
    console.log('  🎉 SEMUA PENGUJIAN EXPORT SERVICE BERHASIL 100% TANPA KESALAHAN!')
    console.log('='.repeat(70))
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Terjadi kesalahan pada pengujian:', err)
    process.exit(1)
  }
}

runTest()
