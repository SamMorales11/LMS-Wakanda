<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'

const authStore = useAuthStore()
const academicStore = useAcademicStore()

const selectedSession = computed(() => academicStore.selectedSession)
const selectedSessionNum = computed(() => academicStore.selectedSessionNumber)

// State Token Presensi
const studentTokenInput = ref('')
const attendanceFeedback = ref<string | null>(null)
const attendanceError = ref<string | null>(null)
const isTokenGenerated = ref(false)
const generatedToken = ref('849-216')
const tokenRemainingSeconds = ref(900) // 15 menit
const isAttended = ref(false)

// Generate Token (Dosen)
const handleGenerateToken = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000).toString()
  generatedToken.value = `${randomNum.slice(0, 3)}-${randomNum.slice(3)}`
  isTokenGenerated.value = true
  attendanceFeedback.value = `Token presensi untuk Pertemuan ${selectedSessionNum.value} berhasil diaktifkan!`
}

// Submit Token (Mahasiswa)
const handleStudentSubmitToken = () => {
  attendanceFeedback.value = null
  attendanceError.value = null

  if (!studentTokenInput.value.trim()) {
    attendanceError.value = 'Silakan masukkan 6 digit token presensi.'
    return
  }

  // Simulasi validasi presensi
  isAttended.value = true
  attendanceFeedback.value = `Kehadiran Pertemuan ${selectedSessionNum.value} berhasil diverifikasi! Tercatat pada ${new Date().toLocaleTimeString()} WIB.`
  studentTokenInput.value = ''
}

// Sample Upcoming Deadlines
const upcomingDeadlines = [
  {
    id: 1,
    title: 'UTS (Pertemuan 8): Evaluasi Tengah Semester',
    course: 'IF302 - Web Full-Stack',
    type: 'EXAM',
    due: '20 Okt 2026',
    daysLeft: 5,
    urgent: true,
    badge: 'Ujian UTS'
  },
  {
    id: 2,
    title: 'Tugas 1: Implementasi Clean Architecture',
    course: 'IF302 - Web Full-Stack',
    type: 'ASSIGNMENT',
    due: '18 Okt 2026',
    daysLeft: 3,
    urgent: true,
    badge: 'Tugas'
  },
  {
    id: 3,
    title: 'Kuis 1: Pola Repository & Zod Validation',
    course: 'IF302 - Web Full-Stack',
    type: 'QUIZ',
    due: '25 Okt 2026',
    daysLeft: 10,
    urgent: false,
    badge: 'Kuis'
  },
  {
    id: 4,
    title: 'UAS (Pertemuan 16): Presentasi Proyek Akhir',
    course: 'IF302 - Web Full-Stack',
    type: 'FINAL',
    due: '15 Jan 2027',
    daysLeft: 80,
    urgent: false,
    badge: 'Ujian UAS'
  }
]
</script>

<template>
  <aside class="w-full lg:w-80 xl:w-96 bg-white border-l border-slate-200/80 flex flex-col h-full shrink-0 shadow-xs overflow-y-auto p-5 space-y-6">
    <!-- PANEL 1: PRESENSI CEPAT SESI (Quick Attendance) -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-semantic-success animate-pulse"></span>
          <h3 class="text-sm font-bold text-academic-navy font-jakarta">
            Presensi Sesi {{ selectedSessionNum }}
          </h3>
        </div>
        <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-scholarly-teal border border-teal-200">
          {{ selectedSession?.sessionType === 'MIDTERM_EXAM' ? 'UTS' : (selectedSession?.sessionType === 'FINAL_EXAM' ? 'UAS' : 'REGULAR') }}
        </span>
      </div>

      <!-- Presensi Card Container -->
      <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 space-y-3.5">
        <div class="text-xs font-inter text-slate-600 flex items-center justify-between">
          <span>Status Sesi:</span>
          <span class="font-bold text-semantic-success flex items-center gap-1 font-mono text-[11px]">
            ● Terjadwal Aktif
          </span>
        </div>

        <!-- Role: Dosen (Generator Token) -->
        <div v-if="authStore.isLecturer || authStore.isAdmin" class="space-y-3">
          <div v-if="!isTokenGenerated" class="space-y-2">
            <p class="text-[11px] text-slate-500 font-inter">
              Sebagai Dosen Pengampu, Anda dapat mengaktifkan token presensi dinamis untuk sesi ini:
            </p>
            <button
              type="button"
              @click="handleGenerateToken"
              class="w-full py-2.5 px-3 rounded-xl bg-scholarly-teal hover:bg-teal-700 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-2 font-jakarta"
            >
              <span>🔑 Buat Token Presensi Sesi</span>
            </button>
          </div>

          <div v-else class="space-y-2.5 text-center">
            <span class="text-[11px] text-slate-500 font-inter block">Bagikan Token Ini ke Mahasiswa:</span>
            <div class="p-3 bg-white rounded-xl border border-teal-300 font-mono text-2xl font-black text-academic-navy tracking-widest shadow-inner">
              {{ generatedToken }}
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
              <span>Batas Berlaku:</span>
              <span class="text-amber-alert font-bold">14:59 Menit</span>
            </div>
            <button
              type="button"
              @click="isTokenGenerated = false"
              class="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
            >
              Tutup Presensi
            </button>
          </div>
        </div>

        <!-- Role: Mahasiswa (Input Token) -->
        <div v-else class="space-y-3">
          <div v-if="!isAttended" class="space-y-2.5">
            <label class="block text-xs font-semibold text-slate-700 font-jakarta">
              Masukkan 6-Digit Token Perkuliahan:
            </label>
            <div class="flex gap-2">
              <input
                v-model="studentTokenInput"
                type="text"
                maxlength="7"
                placeholder="mis. 849-216"
                class="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal text-center font-mono font-bold text-sm tracking-wider"
              />
              <button
                type="button"
                @click="handleStudentSubmitToken"
                class="px-4 py-2 rounded-xl bg-academic-navy hover:bg-blue-900 text-white text-xs font-semibold transition shrink-0 font-jakarta"
              >
                Kirim
              </button>
            </div>
            <p class="text-[10px] text-slate-400 font-inter">
              Token diberikan oleh Dosen Pengampu saat sesi tatap muka berlangsung.
            </p>
          </div>

          <div v-else class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
            <div class="w-7 h-7 rounded-full bg-semantic-success text-white flex items-center justify-center font-bold text-xs mx-auto">
              ✓
            </div>
            <p class="text-xs font-bold text-semantic-success font-jakarta">Presensi Terverifikasi</p>
            <p class="text-[10px] text-slate-500 font-inter">Anda tercatat HADIR pada sesi ini.</p>
          </div>
        </div>

        <!-- Feedback Alert -->
        <div v-if="attendanceFeedback" class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-semantic-success text-[11px] font-medium font-inter">
          {{ attendanceFeedback }}
        </div>
        <div v-if="attendanceError" class="p-2.5 rounded-xl bg-red-50 border border-red-200 text-semantic-danger text-[11px] font-medium font-inter">
          {{ attendanceError }}
        </div>

        <!-- Rekap Persentase Kehadiran -->
        <div class="pt-2 border-t border-slate-200/80 space-y-2">
          <div class="flex items-center justify-between text-xs font-inter">
            <span class="text-slate-600 font-medium">Rekap Kehadiran:</span>
            <span class="font-bold text-academic-navy font-mono">15 / 16 Sesi (93.75%)</span>
          </div>

          <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-semantic-success rounded-full" style="width: 93.75%;"></div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-500 font-inter">
            <span>Syarat Min. UAS: 75%</span>
            <span class="text-semantic-success font-semibold">Memenuhi Syarat UAS</span>
          </div>
        </div>
      </div>
    </section>

    <!-- PANEL 2: TENGGAT TERDEKAT (Upcoming Deadlines) -->
    <section class="space-y-3.5">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-academic-navy font-jakarta flex items-center gap-2">
          <span>⏰</span>
          <span>Tenggat Terdekat</span>
        </h3>
        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
          {{ upcomingDeadlines.length }} Agenda
        </span>
      </div>

      <div class="space-y-2.5">
        <div
          v-for="item in upcomingDeadlines"
          :key="item.id"
          class="p-3 rounded-2xl border transition space-y-1.5 font-inter"
          :class="item.urgent
            ? 'bg-amber-50/50 border-amber-200/80 hover:border-amber-400'
            : 'bg-alabaster-slate border-slate-200 hover:border-slate-300'"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
              :class="item.urgent ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-200 text-slate-700'"
            >
              {{ item.badge }}
            </span>
            <span
              class="text-[10px] font-mono font-bold"
              :class="item.urgent ? 'text-amber-alert' : 'text-slate-500'"
            >
              {{ item.daysLeft }} hari lagi
            </span>
          </div>

          <h4 class="text-xs font-bold text-deep-ink font-jakarta leading-snug line-clamp-2">
            {{ item.title }}
          </h4>

          <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>{{ item.course }}</span>
            <span class="font-mono text-slate-600">{{ item.due }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- PANEL 3: DOSEN PENGAMPU & KONSULTASI AKADEMIK -->
    <section class="p-4 rounded-2xl bg-teal-50/40 border border-teal-200/60 space-y-3">
      <div class="flex items-center gap-2 text-xs font-bold text-scholarly-teal font-jakarta">
        <span>👨‍🏫</span>
        <span>Jam Konsultasi Pengampu</span>
      </div>

      <div class="text-xs font-inter space-y-1 text-slate-700">
        <p class="font-bold text-academic-navy">Dr. T'Challa, M.T.</p>
        <p class="text-[11px] text-slate-500 font-mono">tchalla.dosen@itw.ac.id</p>
        <p class="text-[11px] text-slate-600 pt-1">
          🗓️ <strong>Senin & Rabu:</strong> 13.00 - 15.00 WIB
        </p>
        <p class="text-[11px] text-slate-600">
          📍 Gedung Sains & Teknologi Ruang 402
        </p>
      </div>
    </section>
  </aside>
</template>
