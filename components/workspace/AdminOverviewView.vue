<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'
import { useEwsStore } from '~/stores/useEwsStore'

const academicStore = useAcademicStore()
const ewsStore = useEwsStore()

onMounted(async () => {
  await ewsStore.fetchDepartmentSummary()
})

const department = computed(() => ewsStore.departmentSummary)

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

const classRows = computed(() => {
  if (department.value?.classes?.length) {
    return department.value.classes.map(item => {
      const cls = academicStore.classes.find(c => c.id === item.classId)
      return {
        ...item,
        scheduleDay: cls?.scheduleDay,
        scheduleStart: cls?.scheduleStart,
        scheduleEnd: cls?.scheduleEnd
      }
    })
  }

  // Fallback ke daftar kelas aktif bila ringkasan departemen belum tersedia.
  return academicStore.classes.map(item => ({
    classId: item.id,
    classCode: item.code,
    courseCode: item.courseCode || '',
    courseName: item.courseName || '',
    lecturerName: item.lecturerName || null,
    totalStudents: item.capacity || 0,
    safeCount: 0,
    warningCount: 0,
    criticalCount: 0,
    averageRiskScore: 0,
    atRiskPercentage: 0,
    scheduleDay: item.scheduleDay,
    scheduleStart: item.scheduleStart,
    scheduleEnd: item.scheduleEnd
  }))
})

const totalCapacity = computed(() =>
  academicStore.classes.reduce((sum, item) => sum + (item.capacity || 0), 0)
)

const atRiskTotal = computed(() => {
  const summary = department.value
  if (summary) return summary.overallWarningCount + summary.overallCriticalCount
  return 0
})

const safePercent = (row: { safeCount: number; totalStudents: number }) => {
  const total = row.totalStudents > 0 ? row.totalStudents : 1
  return ((row.safeCount / total) * 100)
}

const warningPercent = (row: { warningCount: number; totalStudents: number }) => {
  const total = row.totalStudents > 0 ? row.totalStudents : 1
  return ((row.warningCount / total) * 100)
}

const criticalPercent = (row: { criticalCount: number; totalStudents: number }) => {
  const total = row.totalStudents > 0 ? row.totalStudents : 1
  return ((row.criticalCount / total) * 100)
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Ringkasan Metrik Lintas Kelas dengan Micro-Accent Borders -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <!-- KPI 1: Kelas Aktif (Academic Navy) -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 border-t-2 border-t-[#1E3A8A] space-y-1">
        <span class="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">Kelas Aktif</span>
        <p class="text-2xl font-black font-mono text-[#1E3A8A]">{{ academicStore.classes.length }}</p>
      </div>

      <!-- KPI 2: Kapasitas Mahasiswa (Scholarly Teal) -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 border-t-2 border-t-[#0D9488] space-y-1">
        <span class="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">Kapasitas Total</span>
        <p class="text-2xl font-black font-mono text-[#0D9488]">{{ totalCapacity }}</p>
      </div>

      <!-- KPI 3: Mahasiswa Berisiko (Danger Red) -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 border-t-2 border-t-[#DC2626] space-y-1">
        <span class="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">Mahasiswa Berisiko</span>
        <p class="text-2xl font-black font-mono text-[#DC2626]">{{ atRiskTotal }}</p>
      </div>

      <!-- KPI 4: Rata-rata Risiko (Amber Alert) -->
      <div class="p-4 rounded-sm bg-white border border-slate-200 border-t-2 border-t-[#D97706] space-y-1">
        <span class="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider">Rata-rata Risiko</span>
        <p class="text-2xl font-black font-mono text-[#D97706]">
          {{ department?.averageDepartmentRisk ?? 0 }}
        </p>
      </div>
    </section>

    <!-- Tabel Status Per Kelas dengan Bar Proporsi Risiko Visual -->
    <section class="bg-white rounded-sm border border-slate-200 space-y-4 overflow-hidden">
      <div class="px-5 pt-5 pb-1 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 class="text-sm font-extrabold text-[#0F172A] font-jakarta">Status Akademik per Kelas</h3>
          <p class="text-[11px] text-slate-500 font-inter mt-0.5">
            {{ department?.termName || academicStore.activeTerm?.name || 'Semester Aktif' }} &middot; Agregat risiko kelas berbasis telemetri perkuliahan.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Legend Bar Proporsi -->
          <div class="hidden sm:flex items-center gap-2 text-[10px] font-mono">
            <span class="flex items-center gap-1 text-slate-600">
              <span class="w-2.5 h-2.5 rounded-xs" style="background-color: #16A34A"></span>
              Aman
            </span>
            <span class="flex items-center gap-1 text-slate-600">
              <span class="w-2.5 h-2.5 rounded-xs" style="background-color: #D97706"></span>
              Waspada
            </span>
            <span class="flex items-center gap-1 text-slate-600">
              <span class="w-2.5 h-2.5 rounded-xs" style="background-color: #DC2626"></span>
              Kritis
            </span>
          </div>
          <span
            v-if="ewsStore.isLoading"
            class="text-[11px] font-mono text-slate-400"
          >Memuat...</span>
        </div>
      </div>

      <div class="overflow-x-auto border-t border-slate-200">
        <table class="w-full text-xs text-left font-inter">
          <thead class="bg-slate-50 text-slate-700 font-mono font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th class="py-2.5 px-5">Mata Kuliah</th>
              <th class="py-2.5 px-3">Kelas</th>
              <th class="py-2.5 px-4 min-w-[200px] whitespace-nowrap">Jadwal Perkuliahan</th>
              <th class="py-2.5 px-3 text-center">Mahasiswa</th>
              <th class="py-2.5 px-3 text-center text-[#16A34A]">Aman</th>
              <th class="py-2.5 px-3 text-center text-[#D97706]">Waspada</th>
              <th class="py-2.5 px-3 text-center text-[#DC2626]">Kritis</th>
              <th class="py-2.5 px-4 text-center">Proporsi Risiko</th>
              <th class="py-2.5 px-5 text-right">Skor Rata-rata</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr v-for="row in classRows" :key="row.classId" class="hover:bg-slate-50/70 transition">
              <td class="py-2.5 px-5">
                <p class="font-bold text-[#0F172A] font-jakarta truncate max-w-[220px]">{{ row.courseName || row.courseCode }}</p>
                <p class="text-[10px] text-slate-400 font-mono">{{ row.courseCode }}</p>
              </td>
              <td class="py-2.5 px-3 font-mono text-slate-600 font-semibold">{{ row.classCode }}</td>

              <!-- Jadwal Perkuliahan -->
              <td class="py-2.5 px-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                  <span class="font-semibold text-[#1E3A8A]">{{ formatDay(row.scheduleDay) }}</span>
                  <span class="text-slate-400">&middot;</span>
                  <span>{{ formatTime(row.scheduleStart, '08:00') }} - {{ formatTime(row.scheduleEnd, '10:00') }}</span>
                </span>
              </td>

              <td class="py-2.5 px-3 text-center font-mono text-slate-800 font-bold">{{ row.totalStudents }}</td>
              <td class="py-2.5 px-3 text-center font-mono text-[#16A34A] font-bold">{{ row.safeCount }}</td>
              <td class="py-2.5 px-3 text-center font-mono text-[#D97706] font-bold">{{ row.warningCount }}</td>
              <td class="py-2.5 px-3 text-center font-mono text-[#DC2626] font-black">{{ row.criticalCount }}</td>
              <!-- Stacked Bar Proporsi Visual Presisi -->
              <td class="py-2.5 px-4">
                <div class="w-32 sm:w-40 mx-auto">
                  <div class="flex h-2.5 w-full rounded-xs overflow-hidden bg-slate-100 border border-slate-200">
                    <div
                      class="h-full transition-all duration-300"
                      :style="{ width: `${safePercent(row)}%`, backgroundColor: '#16A34A' }"
                      :title="`Aman: ${row.safeCount} mhs (${safePercent(row).toFixed(1)}%)`"
                    ></div>
                    <div
                      class="h-full transition-all duration-300"
                      :style="{ width: `${warningPercent(row)}%`, backgroundColor: '#D97706' }"
                      :title="`Waspada: ${row.warningCount} mhs (${warningPercent(row).toFixed(1)}%)`"
                    ></div>
                    <div
                      class="h-full transition-all duration-300"
                      :style="{ width: `${criticalPercent(row)}%`, backgroundColor: '#DC2626' }"
                      :title="`Kritis: ${row.criticalCount} mhs (${criticalPercent(row).toFixed(1)}%)`"
                    ></div>
                  </div>
                  <div class="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1 px-0.5">
                    <span class="text-[#16A34A] font-semibold">{{ safePercent(row).toFixed(0) }}%</span>
                    <span class="text-[#D97706] font-semibold">{{ warningPercent(row).toFixed(0) }}%</span>
                    <span class="text-[#DC2626] font-bold">{{ criticalPercent(row).toFixed(0) }}%</span>
                  </div>
                </div>
              </td>
              <td class="py-2.5 px-5 text-right font-mono text-slate-700 font-semibold">{{ row.averageRiskScore }}</td>
            </tr>

            <tr v-if="classRows.length === 0">
              <td colspan="9" class="py-8 text-center text-xs text-slate-400 font-inter">
                Belum ada kelas perkuliahan terdaftar pada semester aktif.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
