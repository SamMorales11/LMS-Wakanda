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

const classRows = computed(() => {
  if (department.value?.classes?.length) {
    return department.value.classes
  }

  // Fallback ke daftar kelas aktif bila ringkasan departemen belum tersedia.
  return academicStore.classes.map(item => ({
    classId: item.id,
    classCode: item.code,
    courseCode: item.courseCode || '',
    courseName: item.courseName || '',
    lecturerName: null,
    totalStudents: item.capacity || 0,
    safeCount: 0,
    warningCount: 0,
    criticalCount: 0,
    averageRiskScore: 0,
    atRiskPercentage: 0
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
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Ringkasan Metrik Lintas Kelas -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1">
        <span class="text-[11px] text-slate-500 font-inter">Rombel Aktif</span>
        <p class="text-2xl font-black font-mono text-academic-navy">{{ academicStore.classes.length }}</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1">
        <span class="text-[11px] text-slate-500 font-inter">Kapasitas Mahasiswa</span>
        <p class="text-2xl font-black font-mono text-academic-navy">{{ totalCapacity }}</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1">
        <span class="text-[11px] text-slate-500 font-inter">Mahasiswa Berisiko</span>
        <p class="text-2xl font-black font-mono text-semantic-danger">{{ atRiskTotal }}</p>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1">
        <span class="text-[11px] text-slate-500 font-inter">Rata-rata Risiko</span>
        <p class="text-2xl font-black font-mono text-scholarly-teal">
          {{ department?.averageDepartmentRisk ?? 0 }}
        </p>
      </div>
    </section>

    <!-- Tabel Status Per Kelas -->
    <section class="bg-white rounded-2xl border border-slate-200/90 space-y-4">
      <div class="px-5 pt-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 class="text-sm font-bold text-academic-navy font-jakarta">Status Akademik per Kelas</h3>
          <p class="text-[11px] text-slate-500 font-inter mt-0.5">
            {{ department?.termName || academicStore.activeTerm?.name || 'Semester aktif' }} · Ringkasan risiko agregat, bukan data individual mahasiswa.
          </p>
        </div>
        <span
          v-if="ewsStore.isLoading"
          class="text-[11px] font-mono text-slate-400"
        >Memuat...</span>
      </div>

      <div class="overflow-x-auto border-t border-slate-100">
        <table class="w-full text-xs text-left font-inter">
          <thead class="bg-slate-50 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th class="py-2.5 px-5">Mata Kuliah</th>
              <th class="py-2.5 px-3">Kelas</th>
              <th class="py-2.5 px-3 text-center">Mahasiswa</th>
              <th class="py-2.5 px-3 text-center">Aman</th>
              <th class="py-2.5 px-3 text-center">Waspada</th>
              <th class="py-2.5 px-3 text-center">Kritis</th>
              <th class="py-2.5 px-5 text-right">Risiko Rata-rata</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in classRows" :key="row.classId" class="hover:bg-slate-50/60 transition">
              <td class="py-2.5 px-5">
                <p class="font-semibold text-academic-navy truncate max-w-[220px]">{{ row.courseName || row.courseCode }}</p>
                <p class="text-[10px] text-slate-400 font-mono">{{ row.courseCode }}</p>
              </td>
              <td class="py-2.5 px-3 font-mono text-slate-600">{{ row.classCode }}</td>
              <td class="py-2.5 px-3 text-center font-mono text-slate-700">{{ row.totalStudents }}</td>
              <td class="py-2.5 px-3 text-center font-mono text-slate-600">{{ row.safeCount }}</td>
              <td class="py-2.5 px-3 text-center font-mono text-amber-alert">{{ row.warningCount }}</td>
              <td class="py-2.5 px-3 text-center font-mono text-semantic-danger font-bold">{{ row.criticalCount }}</td>
              <td class="py-2.5 px-5 text-right font-mono text-slate-600">{{ row.averageRiskScore }}</td>
            </tr>

            <tr v-if="classRows.length === 0">
              <td colspan="7" class="py-8 text-center text-xs text-slate-400 font-inter">
                Belum ada kelas perkuliahan terdaftar pada semester aktif.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
