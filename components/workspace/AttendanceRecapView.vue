<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAttendanceStore } from '~/stores/useAttendanceStore'
import type { StudentAttendanceSummaryDto, ApiResponse } from '~/types'

const academicStore = useAcademicStore()
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()

const currentClass = computed(() => academicStore.selectedClassDetail || academicStore.selectedClass)
const sessions = computed(() => academicStore.sessions)

// State Rekap Dosen
const classRecap = ref<{
  classId: string
  totalSessions: number
  students: StudentAttendanceSummaryDto[]
} | null>(null)

const isLoading = ref(false)
const searchQuery = ref('')

const loadRecapData = async () => {
  if (!currentClass.value?.id) return
  isLoading.value = true

  try {
    if (authStore.isLecturer || authStore.isAdmin) {
      const res = await $fetch<ApiResponse<{
        classId: string
        totalSessions: number
        students: StudentAttendanceSummaryDto[]
      }>>(`/api/attendance/classes/${currentClass.value.id}/recap`)

      if (res.success && res.data) {
        classRecap.value = res.data
      }
    } else {
      await attendanceStore.fetchStudentSummary(currentClass.value.id)
    }
  } catch (err) {
    console.warn('[AttendanceRecapView] Gagal memuat data rekap presensi:', err)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => currentClass.value?.id,
  () => {
    loadRecapData()
  },
  { immediate: true }
)

onMounted(() => {
  loadRecapData()
})

// Filter Mahasiswa (Dosen)
const filteredStudents = computed(() => {
  if (!classRecap.value?.students) return []
  if (!searchQuery.value.trim()) return classRecap.value.students

  const q = searchQuery.value.toLowerCase()
  return classRecap.value.students.filter(
    s => (s.studentName || '').toLowerCase().includes(q) || (s.studentNim || '').toLowerCase().includes(q)
  )
})

// Metrik Kelas Keseluruhan (Dosen)
const classMetrics = computed(() => {
  if (!classRecap.value?.students || classRecap.value.students.length === 0) {
    return { total: 0, eligible: 0, notEligible: 0, avgPct: 0 }
  }

  const total = classRecap.value.students.length
  let eligible = 0
  let totalPct = 0

  classRecap.value.students.forEach(s => {
    if (s.isEligibleForFinalExam) eligible++
    totalPct += s.attendancePercentage
  })

  return {
    total,
    eligible,
    notEligible: total - eligible,
    avgPct: Math.round((totalPct / total) * 10) / 10
  }
})

// Helper status sesi untuk matriks tabel dosen
const getStudentSessionStatus = (st: StudentAttendanceSummaryDto, sessionNum: number) => {
  const sessionObj = sessions.value.find(s => s.sessionNumber === sessionNum)
  if (!sessionObj) return null

  const log = st.sessionLogs.find(l => l.sessionId === sessionObj.id)
  return log ? log.status : null
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header Banner -->
    <div class="p-6 rounded-3xl bg-academic-navy text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 font-mono text-xs font-semibold border border-teal-400/30">
            {{ currentClass?.courseCode || 'KODE MK' }} • Kelas {{ currentClass?.code || 'A' }}
          </span>
          <span class="text-xs text-slate-300 font-inter">Semester Aktif 2026/2027</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-extrabold font-jakarta">
          Rekapitulasi Presensi Semester & Kelayakan UAS
        </h2>
        <p class="text-xs text-slate-300 font-inter max-w-xl">
          Standar kelayakan mengikuti Ujian Akhir Semester (UAS) di Institut Teknologi Wakanda minimal <strong>75.0% kehadiran</strong> (minimal 12 dari 16 pertemuan).
        </p>
      </div>

      <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 min-w-[130px]">
        <span class="text-[10px] text-teal-300 uppercase font-mono font-bold block">Syarat Minimal</span>
        <span class="text-2xl font-black font-mono text-white block mt-0.5">75.0%</span>
        <span class="text-[10px] text-slate-300 font-inter block">Kurikulum 16 Sesi</span>
      </div>
    </div>

    <!-- TAMPILAN KHUSUS MAHASISWA -->
    <div v-if="authStore.isStudent" class="space-y-6">
      <!-- Kartu Status Kehadiran Personal -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Metric 1: Persentase Kehadiran -->
        <div class="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <span class="text-xs font-semibold text-slate-500 font-jakarta block">Persentase Kehadiran Anda</span>
          <div class="flex items-baseline gap-2">
            <span
              class="text-3xl font-black font-mono"
              :class="attendanceStore.studentSummary?.isEligibleForFinalExam ? 'text-semantic-success' : 'text-amber-alert'"
            >
              {{ attendanceStore.studentSummary?.attendancePercentage?.toFixed(1) || '0.0' }}%
            </span>
            <span class="text-xs text-slate-400 font-mono">/ 100%</span>
          </div>
          <!-- Progress Bar -->
          <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="attendanceStore.studentSummary?.isEligibleForFinalExam ? 'bg-semantic-success' : 'bg-amber-alert'"
              :style="{ width: `${attendanceStore.studentSummary?.attendancePercentage || 0}%` }"
            ></div>
          </div>
        </div>

        <!-- Metric 2: Rasio Pertemuan -->
        <div class="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <span class="text-xs font-semibold text-slate-500 font-jakarta block">Kehadiran Sesi Kuliah</span>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black font-mono text-academic-navy">
              {{ attendanceStore.studentSummary?.attendedSessions || 0 }}
            </span>
            <span class="text-xs text-slate-400 font-mono">/ 16 Pertemuan</span>
          </div>
          <p class="text-[11px] text-slate-500 font-inter">
            Hadir: {{ attendanceStore.studentSummary?.presentCount || 0 }} • Terlambat: {{ attendanceStore.studentSummary?.lateCount || 0 }}
          </p>
        </div>

        <!-- Metric 3: Kelayakan Ikut UAS -->
        <div class="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <span class="text-xs font-semibold text-slate-500 font-jakarta block">Status Kelayakan UAS</span>
          <div>
            <span
              v-if="attendanceStore.studentSummary?.isEligibleForFinalExam"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-semantic-success font-bold font-mono text-xs border border-emerald-200"
            >
              ✓ MEMENUHI SYARAT UAS
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-bold font-mono text-xs border border-amber-200"
            >
              ⚠️ BELUM MEMENUHI SYARAT (&lt; 75%)
            </span>
          </div>
          <p class="text-[11px] text-slate-500 font-inter">
            {{ attendanceStore.studentSummary?.isEligibleForFinalExam ? 'Anda berhak mengikuti Ujian Akhir Semester.' : 'Tingkatkan kehadiran sesi berikutnya agar mencapai minimal 75%.' }}
          </p>
        </div>
      </div>

      <!-- Tabel Detail 16 Sesi Mahasiswa -->
      <div class="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
        <h3 class="text-sm font-bold text-academic-navy font-jakarta">
          Riwayat Kehadiran 16 Sesi Pertemuan
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left font-inter">
            <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th class="py-3 px-4">Pertemuan</th>
                <th class="py-3 px-4">Topik Sesi</th>
                <th class="py-3 px-4">Tipe</th>
                <th class="py-3 px-4">Metode</th>
                <th class="py-3 px-4">Waktu Presensi (Server)</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="s in sessions" :key="s.id" class="hover:bg-slate-50/50 transition">
                <td class="py-3 px-4 font-mono font-bold text-academic-navy">
                  P-{{ s.sessionNumber }}
                </td>
                <td class="py-3 px-4 font-jakarta font-medium text-slate-800 max-w-xs truncate">
                  {{ s.title }}
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                    {{ s.sessionType === 'MIDTERM_EXAM' ? 'UTS' : (s.sessionType === 'FINAL_EXAM' ? 'UAS' : 'REGULER') }}
                  </span>
                </td>
                <td class="py-3 px-4 font-mono text-slate-500">
                  <template v-if="attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)">
                    {{ attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)?.checkInMethod }}
                  </template>
                  <span v-else class="text-slate-300">-</span>
                </td>
                <td class="py-3 px-4 font-mono text-slate-500">
                  <template v-if="attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)">
                    {{ new Date(attendanceStore.studentSummary!.sessionLogs.find(l => l.sessionId === s.id)!.checkInTime).toLocaleString('id-ID') }}
                  </template>
                  <span v-else class="text-slate-300">-</span>
                </td>
                <td class="py-3 px-4 text-center">
                  <template v-if="attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)">
                    <span
                      class="px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] uppercase text-white inline-block min-w-[70px]"
                      :class="{
                        'bg-semantic-success': attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)?.status === 'PRESENT',
                        'bg-amber-alert': attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)?.status === 'LATE',
                        'bg-blue-600': attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)?.status === 'PERMIT',
                        'bg-purple-600': attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)?.status === 'SICK',
                        'bg-semantic-danger': attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)?.status === 'ABSENT'
                      }"
                    >
                      {{ attendanceStore.studentSummary?.sessionLogs.find(l => l.sessionId === s.id)?.status }}
                    </span>
                  </template>
                  <span v-else class="text-slate-400 font-mono text-[11px]">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAMPILAN KHUSUS DOSEN / ADMIN (MATRIKS KELAS 16 PERTEMUAN) -->
    <div v-else class="space-y-6">
      <!-- Metrik Bar Kelas -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span class="text-[11px] text-slate-500 font-inter">Total Mahasiswa</span>
          <p class="text-2xl font-black font-mono text-academic-navy">{{ classMetrics.total }}</p>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span class="text-[11px] text-semantic-success font-inter">Memenuhi Syarat UAS (≥ 75%)</span>
          <p class="text-2xl font-black font-mono text-semantic-success">{{ classMetrics.eligible }}</p>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span class="text-[11px] text-semantic-danger font-inter">Belum Memenuhi (&lt; 75%)</span>
          <p class="text-2xl font-black font-mono text-semantic-danger">{{ classMetrics.notEligible }}</p>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span class="text-[11px] text-slate-500 font-inter">Rata-rata Kehadiran</span>
          <p class="text-2xl font-black font-mono text-scholarly-teal">{{ classMetrics.avgPct }}%</p>
        </div>
      </div>

      <!-- Matriks Presensi Tabel -->
      <div class="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 class="text-sm font-bold text-academic-navy font-jakarta">
              Matriks Presensi 16 Pertemuan Kelas
            </h3>
            <p class="text-xs text-slate-500 font-inter">
              Pemantauan kehadiran mahasiswa per sesi dan evaluasi kelayakan mengikuti UAS.
            </p>
          </div>

          <!-- Search Box -->
          <div class="w-full sm:w-64">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama atau NIM..."
              class="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal text-xs font-inter"
            />
          </div>
        </div>

        <!-- Tabel Matriks -->
        <div class="overflow-x-auto border border-slate-200 rounded-2xl">
          <table class="w-full text-xs text-left font-inter">
            <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th class="py-3 px-3 sticky left-0 bg-slate-50 z-10 min-w-[160px]">Mahasiswa</th>
                <th
                  v-for="i in 16"
                  :key="i"
                  class="py-3 px-1.5 text-center font-mono font-bold"
                  :class="i === 8 ? 'bg-amber-50 text-amber-800' : (i === 16 ? 'bg-blue-50 text-academic-navy' : '')"
                >
                  P-{{ i }}
                </th>
                <th class="py-3 px-3 text-center">Hadir</th>
                <th class="py-3 px-3 text-center">Persen</th>
                <th class="py-3 px-3 text-center">Status UAS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="st in filteredStudents" :key="st.studentId" class="hover:bg-slate-50/50 transition">
                <!-- Info Mahasiswa -->
                <td class="py-2.5 px-3 sticky left-0 bg-white z-10 font-jakarta">
                  <p class="font-bold text-academic-navy truncate max-w-[150px]">{{ st.studentName || 'Mahasiswa' }}</p>
                  <p class="text-[10px] text-slate-400 font-mono">{{ st.studentNim || '-' }}</p>
                </td>

                <!-- 16 Sesi Status Columns -->
                <td
                  v-for="i in 16"
                  :key="i"
                  class="py-2.5 px-1 text-center font-mono text-[11px]"
                  :class="i === 8 ? 'bg-amber-50/30' : (i === 16 ? 'bg-blue-50/30' : '')"
                >
                  <span
                    v-if="getStudentSessionStatus(st, i) === 'PRESENT'"
                    title="Hadir"
                    class="text-semantic-success font-black"
                  >
                    ✓
                  </span>
                  <span
                    v-else-if="getStudentSessionStatus(st, i) === 'LATE'"
                    title="Terlambat"
                    class="text-amber-alert font-bold"
                  >
                    ⏱
                  </span>
                  <span
                    v-else-if="getStudentSessionStatus(st, i) === 'PERMIT' || getStudentSessionStatus(st, i) === 'SICK'"
                    title="Izin / Sakit"
                    class="text-blue-600 font-bold"
                  >
                    📋
                  </span>
                  <span
                    v-else-if="getStudentSessionStatus(st, i) === 'ABSENT'"
                    title="Alfa"
                    class="text-semantic-danger font-bold"
                  >
                    ✗
                  </span>
                  <span v-else class="text-slate-300">-</span>
                </td>

                <!-- Attended Count -->
                <td class="py-2.5 px-3 text-center font-mono font-bold text-academic-navy">
                  {{ st.attendedSessions }} / 16
                </td>

                <!-- Percentage -->
                <td class="py-2.5 px-3 text-center font-mono font-bold">
                  <span :class="st.isEligibleForFinalExam ? 'text-semantic-success' : 'text-semantic-danger'">
                    {{ st.attendancePercentage.toFixed(1) }}%
                  </span>
                </td>

                <!-- UAS Status Badge -->
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider inline-block min-w-[70px]"
                    :class="st.isEligibleForFinalExam
                      ? 'bg-emerald-100 text-semantic-success border border-emerald-200'
                      : 'bg-red-100 text-semantic-danger border border-red-200'"
                  >
                    {{ st.isEligibleForFinalExam ? 'Memenuhi' : 'Gagal' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
