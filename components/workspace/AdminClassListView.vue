<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'

const academicStore = useAcademicStore()

const searchQuery = ref('')

const DAY_TRANSLATIONS: Record<string, string> = {
  monday: 'SENIN',
  tuesday: 'SELASA',
  wednesday: 'RABU',
  thursday: 'KAMIS',
  friday: 'JUMAT',
  saturday: 'SABTU',
  sunday: 'MINGGU'
}

const formatDay = (day?: string | null) => {
  if (!day) return 'SENIN'
  const clean = day.trim().toLowerCase()
  return DAY_TRANSLATIONS[clean] || day.toUpperCase()
}

const formatTime = (time?: string | null, fallback = '08:00') => {
  if (!time) return fallback
  return time.trim().slice(0, 5)
}

const filteredClasses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return academicStore.classes

  return academicStore.classes.filter((item) => {
    const courseCode = (item.courseCode || '').toLowerCase()
    const courseName = (item.courseName || '').toLowerCase()
    const classCode = item.code.toLowerCase()
    const lecturer = (item.lecturerName || '').toLowerCase()
    const room = (item.room || '').toLowerCase()
    const day = (item.scheduleDay || '').toLowerCase()
    const translatedDay = formatDay(item.scheduleDay).toLowerCase()

    return (
      courseCode.includes(q) ||
      courseName.includes(q) ||
      classCode.includes(q) ||
      lecturer.includes(q) ||
      room.includes(q) ||
      day.includes(q) ||
      translatedDay.includes(q)
    )
  })
})

const totalCapacity = computed(() =>
  academicStore.classes.reduce((sum, item) => sum + (item.capacity || 0), 0)
)
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 font-inter">
    <!-- Header Card Daftar Kelas Perkuliahan -->
    <section class="bg-white rounded-sm border border-slate-200 space-y-4 overflow-hidden">
      <!-- Title & Context -->
      <div class="px-5 pt-5 pb-1 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 class="text-sm font-extrabold text-[#0F172A] font-jakarta">Daftar Kelas Perkuliahan</h3>
          <p class="text-[11px] text-slate-500 mt-0.5">
            {{ academicStore.activeTerm?.name || 'Semester Aktif' }} &middot; Daftar kelas perkuliahan paralel, alokasi dosen pengampu, jadwal, ruangan, dan daya tampung mahasiswa.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-sm bg-slate-100 text-slate-700 border border-slate-200">
            Total Kuota: <strong class="text-[#0D9488]">{{ totalCapacity }}</strong> Mahasiswa
          </span>
        </div>
      </div>

      <!-- Controls Bar: Filter Counter + Search Input -->
      <div class="px-5 py-2.5 bg-slate-50/70 border-y border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-700">
            Daftar Kelas
          </span>
          <span class="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-[#0F172A] text-teal-300 font-bold">
            {{ filteredClasses.length }} / {{ academicStore.classes.length }} Kelas
          </span>
        </div>

        <div class="relative w-full sm:w-80">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari kelas, mata kuliah, dosen, jadwal, ruang..."
            class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]"
          />
          <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Tabel Daftar Kelas Perkuliahan -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left font-inter">
          <thead class="bg-slate-50 text-slate-700 font-mono font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-2.5 px-5">Mata Kuliah</th>
              <th class="py-2.5 px-3">Kelas</th>
              <th class="py-2.5 px-4">Dosen Pengampu</th>
              <th class="py-2.5 px-4 min-w-[200px] whitespace-nowrap">Jadwal Perkuliahan</th>
              <th class="py-2.5 px-3">Ruangan</th>
              <th class="py-2.5 px-3 text-center">Daya Tampung</th>
              <th class="py-2.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr v-for="cls in filteredClasses" :key="cls.id" class="hover:bg-slate-50/70 transition">
              <!-- Mata Kuliah -->
              <td class="py-2.5 px-5">
                <p class="font-bold text-[#0F172A] font-jakarta truncate max-w-[240px]">
                  {{ cls.courseName || 'Mata Kuliah' }}
                </p>
                <p class="text-[10px] text-slate-400 font-mono">
                  {{ cls.courseCode || '—' }}
                </p>
              </td>

              <!-- Kode Kelas -->
              <td class="py-2.5 px-3">
                <span class="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-sm bg-slate-100 text-slate-800 border border-slate-200">
                  {{ cls.code }}
                </span>
              </td>

              <!-- Dosen Pengampu -->
              <td class="py-2.5 px-4">
                <div v-if="cls.lecturerName" class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-xs bg-[#0D9488] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {{ cls.lecturerName.charAt(0) }}
                  </div>
                  <span class="font-medium text-slate-800 font-jakarta truncate max-w-[180px]">
                    {{ cls.lecturerName }}
                  </span>
                </div>
                <div v-else class="text-slate-400 italic text-[11px]">
                  Belum Ditugaskan
                </div>
              </td>

              <!-- Jadwal Perkuliahan (Satu baris horizontal tidak pernah turun ke bawah) -->
              <td class="py-2.5 px-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                  <span class="font-semibold text-[#1E3A8A]">{{ formatDay(cls.scheduleDay) }}</span>
                  <span class="text-slate-400">&middot;</span>
                  <span>{{ formatTime(cls.scheduleStart, '08:00') }} - {{ formatTime(cls.scheduleEnd, '10:00') }}</span>
                </span>
              </td>

              <!-- Ruangan -->
              <td class="py-2.5 px-3">
                <span class="font-mono text-slate-600 font-medium">
                  {{ cls.room || 'Lab Utama' }}
                </span>
              </td>

              <!-- Daya Tampung -->
              <td class="py-2.5 px-3 text-center">
                <span class="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-xs border border-slate-200">
                  {{ cls.capacity }} mhs
                </span>
              </td>

              <!-- Status -->
              <td class="py-2.5 px-4 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs font-mono text-[10px] font-semibold tracking-wider uppercase border"
                  :class="cls.isActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="cls.isActive ? 'bg-[#16A34A]' : 'bg-slate-400'"></span>
                  <span>{{ cls.isActive ? 'Aktif' : 'Non-aktif' }}</span>
                </span>
              </td>
            </tr>

            <tr v-if="filteredClasses.length === 0">
              <td colspan="7" class="py-10 text-center text-xs text-slate-400 font-inter">
                Tidak ada data kelas perkuliahan yang sesuai dengan kata kunci pencarian.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
