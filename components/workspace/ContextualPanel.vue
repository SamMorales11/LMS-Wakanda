<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useAttendanceStore } from '~/stores/useAttendanceStore'
import { useAssignmentStore } from '~/stores/useAssignmentStore'
import QrCodeModal from './QrCodeModal.vue'
import ManualAttendanceModal from './ManualAttendanceModal.vue'

const authStore = useAuthStore()
const academicStore = useAcademicStore()
const attendanceStore = useAttendanceStore()
const assignmentStore = useAssignmentStore()

const selectedSession = computed(() => academicStore.selectedSession)
const selectedSessionNum = computed(() => academicStore.selectedSessionNumber)
const selectedClass = computed(() => academicStore.selectedClass)

// Local UI state
const studentPinInput = ref('')
const actionSuccess = ref<string | null>(null)
const actionError = ref<string | null>(null)
const isQrModalOpen = ref(false)
const isManualModalOpen = ref(false)

// Muat data presensi setiap kali sesi atau kelas berubah
const loadAttendanceData = async () => {
  actionSuccess.value = null
  actionError.value = null

  if (selectedSession.value?.id) {
    await attendanceStore.fetchSessionOverview(
      selectedSession.value.id,
      academicStore.selectedClassId || undefined
    )
  }

  if (academicStore.selectedClassId) {
    if (authStore.isStudent) {
      await attendanceStore.fetchStudentSummary(academicStore.selectedClassId)
    }
  }
}

watch(
  () => [selectedSession.value?.id, academicStore.selectedClassId],
  () => {
    loadAttendanceData()
  },
  { immediate: true }
)

// Dosen: Buka Presensi
const handleOpenSession = async (durationMinutes: number = 15) => {
  if (!selectedSession.value?.id) return
  actionSuccess.value = null
  actionError.value = null

  try {
    const token = await attendanceStore.openSession(selectedSession.value.id, durationMinutes)
    if (token) {
      actionSuccess.value = `Sesi presensi aktif! PIN: ${token.formattedToken}`
    }
  } catch (err: any) {
    actionError.value = err.message || 'Gagal membuka sesi presensi'
  }
}

// Dosen: Tutup Presensi
const handleCloseSession = async () => {
  if (!selectedSession.value?.id) return
  actionSuccess.value = null
  actionError.value = null

  try {
    await attendanceStore.closeSession(selectedSession.value.id)
    actionSuccess.value = 'Sesi presensi berhasil ditutup'
  } catch (err: any) {
    actionError.value = err.message || 'Gagal menutup sesi presensi'
  }
}

// Mahasiswa: Check-In
const handleStudentCheckIn = async () => {
  actionSuccess.value = null
  actionError.value = null

  const pin = studentPinInput.value.trim().replace('-', '')
  if (pin.length < 6) {
    actionError.value = 'Silakan masukkan 6 digit token PIN presensi yang valid.'
    return
  }

  try {
    const res = await attendanceStore.checkIn(pin, selectedSession.value?.id)
    if (res.success) {
      actionSuccess.value = res.message
      studentPinInput.value = ''
      if (academicStore.selectedClassId) {
        await attendanceStore.fetchStudentSummary(academicStore.selectedClassId)
      }
    }
  } catch (err: any) {
    actionError.value = err.message || 'Presensi gagal. Periksa kembali PIN Anda.'
  }
}

// Format input PIN otomatis menjadi xxx-xxx
const handlePinInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/[^0-9]/g, '').slice(0, 6)
  if (raw.length > 3) {
    studentPinInput.value = `${raw.slice(0, 3)}-${raw.slice(3)}`
  } else {
    studentPinInput.value = raw
  }
}

// Hitung persentase kehadiran & status UAS
const attendancePercentage = computed(() => {
  if (attendanceStore.studentSummary) {
    return attendanceStore.studentSummary.attendancePercentage
  }
  return 0
})

const isEligibleForUAS = computed(() => {
  if (attendanceStore.studentSummary) {
    return attendanceStore.studentSummary.isEligibleForFinalExam
  }
  return attendancePercentage.value >= 75
})

const attendedSessionsCount = computed(() => {
  return attendanceStore.studentSummary?.attendedSessions ?? 0
})

const totalSessionsCount = computed(() => {
  return attendanceStore.studentSummary?.totalSessions ?? 16
})

// Tenggat Terdekat Dinamis (Amber Alert #D97706)
const dynamicDeadlines = computed(() => {
  const list: Array<{
    id: string | number
    title: string
    course: string
    type: string
    due: string
    daysLeft: number
    urgent: boolean
    badge: string
  }> = []

  const courseName = selectedClass.value?.courseCode || 'MK'

  // 1. Ambil dari tugas-tugas aktif kelas
  assignmentStore.assignments.forEach(a => {
    const dueTime = new Date(a.dueDate).getTime()
    const diffDays = Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24))
    const daysLeft = Math.max(0, diffDays)
    const urgent = daysLeft <= 3

    list.push({
      id: a.id,
      title: a.title,
      course: courseName,
      type: 'ASSIGNMENT',
      due: new Date(a.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      daysLeft,
      urgent,
      badge: 'Tugas'
    })
  })

  // 2. Tambahkan milestone ujian evaluasi semester
  if (list.length < 3) {
    list.push({
      id: 'uts-8',
      title: 'UTS (Pertemuan 8): Evaluasi Tengah Semester',
      course: courseName,
      type: 'EXAM',
      due: '20 Okt 2026',
      daysLeft: 5,
      urgent: true,
      badge: 'Ujian UTS'
    })
    list.push({
      id: 'uas-16',
      title: 'UAS (Pertemuan 16): Presentasi Proyek Akhir',
      course: courseName,
      type: 'FINAL',
      due: '15 Jan 2027',
      daysLeft: 78,
      urgent: false,
      badge: 'Ujian UAS'
    })
  }

  return list.sort((a, b) => a.daysLeft - b.daysLeft)
})
</script>

<template>
  <aside class="w-full lg:w-80 xl:w-96 bg-white border-l border-slate-200/90 flex flex-col h-full shrink-0 shadow-none overflow-y-auto p-4 sm:p-5 space-y-6">
    <!-- PANEL 1: PRESENSI CEPAT SESI (Attendance Engine) -->
    <section class="space-y-3.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class="w-2.5 h-2.5 rounded-full"
            :class="attendanceStore.hasActiveToken ? 'bg-emerald-500' : 'bg-slate-300'"
          ></span>
          <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] font-jakarta">
            Presensi Sesi {{ selectedSessionNum }}
          </h3>
        </div>
        <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-teal-50 text-[#0D9488] border border-teal-200">
          {{ selectedSession?.sessionType === 'MIDTERM_EXAM' ? 'UTS' : (selectedSession?.sessionType === 'FINAL_EXAM' ? 'UAS' : 'REGULER') }}
        </span>
      </div>

      <!-- Presensi Card Container -->
      <div class="p-3.5 rounded-sm bg-[#F8FAFC] border border-slate-200 space-y-3">
        <div class="text-xs font-inter text-slate-600 flex items-center justify-between">
          <span>Status Sesi:</span>
          <span
            class="font-bold flex items-center gap-1 font-mono text-[11px]"
            :class="attendanceStore.hasActiveToken ? 'text-emerald-600' : 'text-slate-500'"
          >
            ● {{ attendanceStore.hasActiveToken ? 'Presensi Terbuka' : 'Presensi Ditutup' }}
          </span>
        </div>

        <!-- Role 1: DOSEN (Generator PIN 6-Digit & QR Code Dinamis) -->
        <div v-if="authStore.isLecturer" class="space-y-3">
          <!-- State 1: Belum Ada Token Aktif -->
          <div v-if="!attendanceStore.hasActiveToken" class="space-y-2.5">
            <p class="text-[11px] text-slate-600 font-inter">
              Buka presensi sesi perkuliahan dengan token PIN 6-digit & QR Code dinamis:
            </p>
            <button
              type="button"
              @click="handleOpenSession(15)"
              :disabled="attendanceStore.isOpeningSession"
              class="w-full py-2.5 px-3 rounded-sm bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 font-jakarta disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            >
              <svg v-if="attendanceStore.isOpeningSession" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span v-else>Buka Presensi Sesi (15 Menit)</span>
            </button>
          </div>

          <!-- State 2: Token Sedang Aktif -->
          <div v-else class="space-y-2.5 text-center">
            <span class="text-[11px] text-slate-500 font-inter block">Bagikan Token Ini ke Mahasiswa:</span>

            <!-- 6-digit PIN in Monospace -->
            <div class="p-2.5 bg-white rounded-sm border border-teal-300 font-mono text-2xl font-black text-[#1E3A8A] tracking-widest">
              {{ attendanceStore.activeToken?.formattedToken }}
            </div>

            <!-- Batas Waktu Countdown -->
            <div class="flex items-center justify-between text-[11px] font-mono px-1">
              <span class="text-slate-500">Sisa Berlaku:</span>
              <span class="text-[#D97706] font-bold bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                {{ attendanceStore.formattedRemainingTime }}
              </span>
            </div>

            <!-- Tombol Aksi Dosen -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                @click="isQrModalOpen = true"
                class="py-2 px-2.5 rounded-sm bg-[#1E3A8A] hover:bg-blue-900 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 font-jakarta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <span>Tampilkan QR</span>
              </button>
              <button
                type="button"
                @click="handleCloseSession"
                class="py-2 px-2.5 rounded-sm bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold transition font-jakarta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                Tutup Presensi
              </button>
            </div>
          </div>

          <!-- Summary Kehadiran Cepat Dosen -->
          <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-inter">
            <span class="text-slate-600">Mahasiswa Hadir:</span>
            <div class="flex items-center gap-2">
              <span class="font-bold text-[#1E3A8A] font-mono">
                {{ attendanceStore.sessionOverview?.presentCount ?? 0 }} / {{ attendanceStore.sessionOverview?.totalEnrolled ?? 0 }}
              </span>
              <button
                type="button"
                @click="isManualModalOpen = true"
                class="text-[10px] text-[#0D9488] hover:underline font-bold font-jakarta"
              >
                Kelola
              </button>
            </div>
          </div>
        </div>

        <!-- Role 2: ADMINISTRATOR (Monitoring & Audit Kehadiran Sesi) -->
        <div v-else-if="authStore.isAdmin" class="space-y-3">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] font-mono pb-1 border-b border-slate-200">
              <span class="text-slate-500">Status Token:</span>
              <span
                class="font-bold px-1.5 py-0.5 rounded-sm text-[10px]"
                :class="attendanceStore.hasActiveToken
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'"
              >
                {{ attendanceStore.hasActiveToken ? 'Token Aktif' : 'Tidak Ada Token' }}
              </span>
            </div>

            <!-- Token Display jika aktif -->
            <div v-if="attendanceStore.hasActiveToken" class="p-2 bg-white rounded-sm border border-slate-200 text-center space-y-1">
              <span class="text-[10px] text-slate-500 font-mono block">Token Sesi Saat Ini:</span>
              <p class="font-mono text-xl font-black text-[#1E3A8A] tracking-wider">
                {{ attendanceStore.activeToken?.formattedToken }}
              </p>
              <p class="text-[10px] font-mono text-[#D97706]">
                Sisa waktu: {{ attendanceStore.formattedRemainingTime }}
              </p>
            </div>

            <p v-else class="text-[11px] text-slate-500 font-inter">
              Token presensi diinisiasi oleh Dosen Pengampu saat kelas berlangsung.
            </p>
          </div>

          <!-- Summary Audit Kehadiran untuk Admin -->
          <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-inter">
            <span class="text-slate-600">Total Hadir:</span>
            <div class="flex items-center gap-2">
              <span class="font-bold text-[#1E3A8A] font-mono">
                {{ attendanceStore.sessionOverview?.presentCount ?? 0 }} / {{ attendanceStore.sessionOverview?.totalEnrolled ?? 0 }}
              </span>
              <button
                type="button"
                @click="isManualModalOpen = true"
                class="text-[10px] text-[#0D9488] hover:underline font-bold font-jakarta"
              >
                Audit Manual
              </button>
            </div>
          </div>
        </div>

        <!-- Role 3: MAHASISWA (Check-In Presensi PIN / QR) -->
        <div v-else class="space-y-3">
          <!-- State: Mahasiswa Belum Hadir -->
          <div v-if="!attendanceStore.isStudentAttended" class="space-y-2.5">
            <label class="block text-xs font-bold text-slate-700 font-jakarta">
              Masukkan 6-Digit Token Perkuliahan:
            </label>
            <div class="flex gap-2">
              <input
                :value="studentPinInput"
                @input="handlePinInput"
                type="text"
                maxlength="7"
                placeholder="849-216"
                class="flex-1 px-3 py-2 rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-center font-mono font-bold text-sm tracking-wider bg-white"
              />
              <button
                type="button"
                @click="handleStudentCheckIn"
                :disabled="attendanceStore.isCheckingIn"
                class="px-4 py-2 rounded-sm bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold transition shrink-0 font-jakarta disabled:opacity-50 flex items-center justify-center min-w-[70px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <svg v-if="attendanceStore.isCheckingIn" class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span v-else>Kirim</span>
              </button>
            </div>
            <p class="text-[10px] text-slate-500 font-inter">
              PIN 6-digit diberikan Dosen Pengampu saat sesi tatap muka berlangsung.
            </p>
          </div>

          <!-- State: Mahasiswa Sudah Hadir -->
          <div v-else class="p-3 rounded-sm bg-emerald-50 border border-emerald-200 text-center space-y-1">
            <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p class="text-xs font-bold text-emerald-700 font-jakarta">Presensi Terverifikasi</p>
            <p class="text-[10px] text-slate-600 font-inter">
              Status: <strong class="font-mono text-[#0F172A]">{{ attendanceStore.currentStudentSessionLog?.status }}</strong>
              (Strict Server Timestamp)
            </p>
          </div>
        </div>

        <!-- Feedback Alert -->
        <div v-if="actionSuccess || attendanceStore.feedback" class="p-2.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium font-inter">
          {{ actionSuccess || attendanceStore.feedback }}
        </div>
        <div v-if="actionError || attendanceStore.error" class="p-2.5 rounded-sm bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium font-inter">
          {{ actionError || attendanceStore.error }}
        </div>

        <!-- Rekap Persentase Kehadiran Semester — hanya relevan bagi mahasiswa -->
        <div v-if="authStore.isStudent" class="pt-2.5 border-t border-slate-200 space-y-2">
          <div class="flex items-center justify-between text-xs font-inter">
            <span class="text-slate-600 font-medium">Rekap Kehadiran:</span>
            <span class="font-bold text-[#1E3A8A] font-mono">
              {{ attendedSessionsCount }} / {{ totalSessionsCount }} Sesi ({{ attendancePercentage.toFixed(1) }}%)
            </span>
          </div>

          <!-- Progress Bar Otomatis -->
          <div class="w-full h-2 bg-slate-200 rounded-sm overflow-hidden">
            <div
              class="h-full rounded-sm transition-all duration-500"
              :class="isEligibleForUAS ? 'bg-emerald-600' : 'bg-[#D97706]'"
              :style="{ width: `${Math.min(100, Math.max(0, attendancePercentage))}%` }"
            ></div>
          </div>

          <!-- Indikator Kelayakan UAS 75% -->
          <div class="flex items-center justify-between text-[10px] text-slate-500 font-inter">
            <span>Syarat Min. UAS: 75%</span>
            <span
              class="font-semibold px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase"
              :class="isEligibleForUAS
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'"
            >
              {{ isEligibleForUAS ? 'Memenuhi Syarat UAS' : 'Belum Memenuhi Syarat' }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- PANEL 2: TENGGAT TERDEKAT (Amber Alert #D97706) -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] font-jakarta flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Tenggat Terdekat</span>
        </h3>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-amber-50 text-amber-900 border border-amber-300 font-bold">
          {{ dynamicDeadlines.length }} Agenda
        </span>
      </div>

      <div class="space-y-2">
        <div
          v-for="item in dynamicDeadlines"
          :key="item.id"
          class="p-3 rounded-sm border transition space-y-1.5 font-inter"
          :class="item.urgent
            ? 'bg-amber-50/70 border-amber-300 border-l-3 border-l-[#D97706] text-amber-950'
            : 'bg-[#F8FAFC] border-slate-200 border-l-3 border-l-[#1E3A8A] hover:border-slate-300'"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase"
              :class="item.urgent ? 'bg-amber-200/90 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-700'"
            >
              {{ item.badge }}
            </span>
            <span
              class="text-[10px] font-mono font-bold flex items-center gap-1"
              :class="item.urgent ? 'text-[#D97706] font-black' : 'text-slate-500'"
            >
              <span v-if="item.urgent" class="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
              {{ item.daysLeft }} hari lagi
            </span>
          </div>

          <h4 class="text-xs font-bold font-jakarta leading-snug line-clamp-2" :class="item.urgent ? 'text-amber-950' : 'text-[#0F172A]'">
            {{ item.title }}
          </h4>

          <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/70">
            <span class="font-mono">{{ item.course }}</span>
            <span class="font-mono text-slate-600 font-medium">{{ item.due }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal QR Code Dinamis (Dosen) -->
    <QrCodeModal
      :is-open="isQrModalOpen"
      :token="attendanceStore.activeToken"
      :session-number="selectedSessionNum"
      :session-title="selectedSession?.title"
      :remaining-formatted="attendanceStore.formattedRemainingTime"
      @close="isQrModalOpen = false"
    />

    <!-- Modal Manajemen Presensi Manual (Dosen & Admin) -->
    <ManualAttendanceModal
      :is-open="isManualModalOpen"
      :overview="attendanceStore.sessionOverview"
      @close="isManualModalOpen = false"
      @updated="loadAttendanceData"
    />
  </aside>
</template>
