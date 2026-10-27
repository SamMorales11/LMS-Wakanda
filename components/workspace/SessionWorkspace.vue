<script setup lang="ts">
import { computed } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'
import type { ClassSessionDto } from '~/types'

const academicStore = useAcademicStore()

const currentClass = computed(() => academicStore.selectedClassDetail || academicStore.selectedClass)
const sessions = computed(() => academicStore.sessions)
const selectedSession = computed(() => academicStore.selectedSession)
const selectedSessionNum = computed(() => academicStore.selectedSessionNumber)

// Dosen Pengampu
const primaryLecturer = computed(() => {
  if (academicStore.selectedClassDetail?.lecturers && academicStore.selectedClassDetail.lecturers.length > 0) {
    return academicStore.selectedClassDetail.lecturers[0]
  }
  return {
    name: "Dr. T'Challa, M.T.",
    nimNidn: '0010048801',
    email: 'tchalla.dosen@itw.ac.id'
  }
})

// Format tanggal sesi perkuliahan
const formatSessionDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// Styling badge per tipe sesi
const getSessionBadgeClass = (session: ClassSessionDto, isSelected: boolean) => {
  if (session.sessionType === 'MIDTERM_EXAM') {
    return isSelected
      ? 'bg-amber-alert text-white ring-2 ring-amber-500 shadow-md'
      : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
  }
  if (session.sessionType === 'FINAL_EXAM') {
    return isSelected
      ? 'bg-academic-navy text-white ring-2 ring-blue-900 shadow-md'
      : 'bg-blue-50 text-academic-navy border border-blue-300 hover:bg-blue-100'
  }
  return isSelected
    ? 'bg-scholarly-teal text-white ring-2 ring-teal-600 shadow-md'
    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- State Loading -->
    <div v-if="academicStore.isDetailLoading" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
      <div class="w-8 h-8 border-3 border-scholarly-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-slate-500 font-inter">Memuat detail struktur 16 pertemuan kelas...</p>
    </div>

    <!-- State Kosong / Belum ada kelas dipilih -->
    <div v-else-if="!currentClass" class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
      <div class="w-16 h-16 rounded-2xl bg-teal-50 text-scholarly-teal flex items-center justify-center mx-auto text-2xl font-bold">
        📚
      </div>
      <h3 class="text-lg font-bold text-academic-navy font-jakarta">Pilih Kelas Perkuliahan</h3>
      <p class="text-xs text-slate-500 font-inter max-w-md mx-auto">
        Silakan pilih salah satu kelas paralel dari daftar sidebar di sebelah kiri untuk melihat struktur 16 pertemuan perkuliahan.
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Header Banner Kelas Aktif -->
      <section class="bg-gradient-to-r from-academic-navy via-blue-900 to-academic-navy rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 bg-scholarly-teal/20 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30 font-mono text-xs font-semibold">
                {{ currentClass.courseCode || 'KODE MK' }}
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono text-xs font-bold">
                Kelas {{ currentClass.code }} (Rombel)
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-xs">
                Kapasitas: {{ currentClass.capacity || 40 }} Mahasiswa
              </span>
            </div>

            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight font-jakarta">
              {{ currentClass.courseName || currentClass.code }}
            </h2>

            <div class="flex flex-wrap items-center gap-4 text-xs text-slate-200 font-inter pt-1">
              <div class="flex items-center gap-1.5">
                <span class="text-teal-300">👤</span>
                <span>Dosen: <strong class="text-white">{{ primaryLecturer.name }}</strong> (NIDN: {{ primaryLecturer.nimNidn || '-' }})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-teal-300">📍</span>
                <span>{{ currentClass.room || 'Lab Komputasi' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-teal-300">🗓️</span>
                <span>{{ currentClass.scheduleDay || 'Senin' }}, {{ currentClass.scheduleStart || '08:00' }} - {{ currentClass.scheduleEnd || '10:30' }} WIB</span>
              </div>
            </div>
          </div>

          <!-- Quick Class Metric -->
          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0 text-center min-w-[140px]">
            <span class="text-[11px] text-slate-300 font-inter block">Total Kurikulum</span>
            <span class="text-2xl font-black font-mono text-white mt-0.5 block">16 Pertemuan</span>
            <span class="text-[10px] text-teal-300 font-inter block mt-1">UTS (Sesi 8) • UAS (Sesi 16)</span>
          </div>
        </div>
      </section>

      <!-- Navigator Tab 16 Pertemuan Perkuliahan -->
      <section class="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="text-base font-bold text-academic-navy font-jakarta">
              Struktur Sesi Kurikulum (16 Pertemuan)
            </h3>
            <p class="text-xs text-slate-500 font-inter">
              Pilih pertemuan di bawah ini untuk melihat silabus, materi ajar, dan status kehadiran:
            </p>
          </div>

          <!-- Legend -->
          <div class="flex items-center gap-3 text-[11px] font-inter">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-scholarly-teal"></span>
              <span class="text-slate-600">Tatap Muka (1-7 & 9-15)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-amber-alert"></span>
              <span class="text-slate-600 font-medium">Sesi 8 (UTS)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-academic-navy"></span>
              <span class="text-slate-600 font-medium">Sesi 16 (UAS)</span>
            </div>
          </div>
        </div>

        <!-- 16 Pertemuan Grid / Ribbon Selector -->
        <div class="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-1.5 sm:gap-2">
          <button
            v-for="s in sessions"
            :key="s.id"
            type="button"
            @click="academicStore.selectSession(s.sessionNumber)"
            class="flex flex-col items-center justify-center p-2 rounded-xl transition text-center relative group"
            :class="getSessionBadgeClass(s, selectedSessionNum === s.sessionNumber)"
          >
            <span class="text-[10px] uppercase font-mono font-bold leading-none">
              P-{{ s.sessionNumber }}
            </span>
            <span class="text-[9px] font-mono mt-1 opacity-90 truncate max-w-full">
              {{ s.sessionType === 'MIDTERM_EXAM' ? 'UTS' : (s.sessionType === 'FINAL_EXAM' ? 'UAS' : 'KULIAH') }}
            </span>
          </button>
        </div>
      </section>

      <!-- Detail Pertemuan Terpilih (Active Session View) -->
      <section v-if="selectedSession" class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">
        <!-- Top Session Meta Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase"
                :class="{
                  'bg-amber-100 text-amber-800 border border-amber-300': selectedSession.sessionType === 'MIDTERM_EXAM',
                  'bg-blue-100 text-academic-navy border border-blue-300': selectedSession.sessionType === 'FINAL_EXAM',
                  'bg-teal-50 text-scholarly-teal border border-teal-200': selectedSession.sessionType === 'REGULAR'
                }"
              >
                {{ selectedSession.sessionType === 'MIDTERM_EXAM' ? 'Ujian Tengah Semester (UTS)' : (selectedSession.sessionType === 'FINAL_EXAM' ? 'Ujian Akhir Semester (UAS)' : 'Sesi Perkuliahan Tatap Muka') }}
              </span>
              <span class="text-xs text-slate-400 font-mono">Pertemuan Ke-{{ selectedSession.sessionNumber }} dari 16</span>
            </div>

            <h3 class="text-xl sm:text-2xl font-bold text-academic-navy font-jakarta">
              {{ selectedSession.title }}
            </h3>
          </div>

          <div class="text-left sm:text-right font-inter text-xs space-y-0.5">
            <span class="text-slate-500 block">Jadwal Pelaksanaan</span>
            <span class="font-bold text-slate-800 block font-jakarta">
              {{ formatSessionDate(selectedSession.sessionDate) }}
            </span>
            <span class="font-mono text-scholarly-teal block">
              ⏰ {{ selectedSession.startTime || '08:00' }} - {{ selectedSession.endTime || '10:30' }} WIB
            </span>
          </div>
        </div>

        <!-- Silabus & Topik Perkuliahan -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Topik Bahasan & Rencana Pembelajaran Semester
          </h4>
          <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 text-slate-700 text-sm font-inter leading-relaxed">
            <p v-if="selectedSession.topicDescription">
              {{ selectedSession.topicDescription }}
            </p>
            <p v-else-if="selectedSession.sessionType === 'MIDTERM_EXAM'">
              Evaluasi Ujian Tengah Semester (UTS) mencakup seluruh kompetensi dan capaian pembelajaran materi Pertemuan 1 hingga 7. Mahasiswa wajib hadir tepat waktu dengan token presensi ujian terverifikasi.
            </p>
            <p v-else-if="selectedSession.sessionType === 'FINAL_EXAM'">
              Evaluasi Ujian Akhir Semester (UAS) / Sidang Proyek Akhir mencakup seluruh implementasi arsitektur sistem, kode sumber, dan dokumentasi teknis yang dikembangkan sepanjang semester.
            </p>
            <p v-else>
              Sesi perkuliahan ke-{{ selectedSession.sessionNumber }} berfokus pada pendalaman teori, studi kasus rekayasa perangkat lunak, demonstrasi praktikum lab komputasi, serta latihan mandiri terstruktur.
            </p>
          </div>
        </div>

        <!-- Modul & Materi Ajar Pembelajaran -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Bahan Ajar & Dokumen Modul (Fase 1)
            </h4>
            <span class="text-[11px] text-scholarly-teal font-medium font-inter">Tersedia 3 Materi</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-4 rounded-2xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2 group cursor-pointer">
              <div class="flex items-center justify-between">
                <div class="w-8 h-8 rounded-lg bg-teal-50 text-scholarly-teal flex items-center justify-center font-bold text-sm">
                  📑
                </div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">PDF Slide</span>
              </div>
              <h5 class="text-xs font-bold text-academic-navy font-jakarta group-hover:text-scholarly-teal transition">
                Slide Presentasi P-{{ selectedSession.sessionNumber }}
              </h5>
              <p class="text-[11px] text-slate-500 font-inter">
                Ringkasan materi perkuliahan dan arsitektur sistem komputasi.
              </p>
            </div>

            <div class="p-4 rounded-2xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2 group cursor-pointer">
              <div class="flex items-center justify-between">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-academic-navy flex items-center justify-center font-bold text-sm">
                  💻
                </div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">Lab Code</span>
              </div>
              <h5 class="text-xs font-bold text-academic-navy font-jakarta group-hover:text-scholarly-teal transition">
                Repositori Contoh Kode Lab
              </h5>
              <p class="text-[11px] text-slate-500 font-inter">
                Studi kasus implementasi Clean Architecture & Drizzle ORM.
              </p>
            </div>

            <div class="p-4 rounded-2xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2 group cursor-pointer">
              <div class="flex items-center justify-between">
                <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                  🎥
                </div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">Video Rekaman</span>
              </div>
              <h5 class="text-xs font-bold text-academic-navy font-jakarta group-hover:text-scholarly-teal transition">
                Rekaman Perkuliahan Dosen
              </h5>
              <p class="text-[11px] text-slate-500 font-inter">
                Video penjelasan konsep utama sesi oleh Dr. T'Challa.
              </p>
            </div>
          </div>
        </div>

        <!-- Bobot Komponen Penilaian Sesi Terkait -->
        <div class="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/60 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-scholarly-teal text-white flex items-center justify-center font-bold text-lg shrink-0">
              ⚖️
            </div>
            <div>
              <h5 class="text-xs font-bold text-academic-navy font-jakarta">
                Bobot Evaluasi Kelas Terintegrasi (Total 100%)
              </h5>
              <p class="text-[11px] text-slate-600 font-inter">
                Setiap sesi terhubung langsung ke skema bobot penilaian otomatis database Neon.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white text-scholarly-teal border border-teal-200">
              Kehadiran: 10%
            </span>
            <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white text-scholarly-teal border border-teal-200">
              UTS: 25%
            </span>
            <span class="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white text-scholarly-teal border border-teal-200">
              UAS: 30%
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
