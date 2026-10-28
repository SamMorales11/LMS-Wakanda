<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGradebookStore } from '~/stores/useGradebookStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import type { GradeComponent, GradeWeightItemDto } from '~/types'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const gradebookStore = useGradebookStore()
const academicStore = useAcademicStore()

// Local copy of weights for editing
const localWeights = ref<GradeWeightItemDto[]>([
  { componentName: 'ATTENDANCE', weightPercentage: 10, description: 'Presensi & Keaktifan' },
  { componentName: 'ASSIGNMENT', weightPercentage: 20, description: 'Tugas & Praktikum' },
  { componentName: 'QUIZ', weightPercentage: 15, description: 'Kuis Terstruktur' },
  { componentName: 'MIDTERM_EXAM', weightPercentage: 25, description: 'Ujian Tengah Semester (UTS)' },
  { componentName: 'FINAL_EXAM', weightPercentage: 30, description: 'Ujian Akhir Semester (UAS)' }
])

const initializeWeights = () => {
  if (gradebookStore.weights && gradebookStore.weights.length === 5) {
    localWeights.value = gradebookStore.weights.map((w) => ({
      componentName: w.componentName,
      weightPercentage: Number(w.weightPercentage),
      description: w.description
    }))
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) initializeWeights()
  },
  { immediate: true }
)

const totalPercentage = computed(() => {
  return localWeights.value.reduce((acc, curr) => acc + (Number(curr.weightPercentage) || 0), 0)
})

const isValidTotal = computed(() => {
  return Math.abs(totalPercentage.value - 100) < 0.01
})

const getComponentLabel = (name: GradeComponent) => {
  switch (name) {
    case 'ATTENDANCE':
      return 'Presensi & Keaktifan Perkuliahan'
    case 'ASSIGNMENT':
      return 'Tugas & Praktikum Mandiri'
    case 'QUIZ':
      return 'Kuis Terstruktur Mingguan'
    case 'MIDTERM_EXAM':
      return 'Ujian Tengah Semester (UTS - Sesi 8)'
    case 'FINAL_EXAM':
      return 'Ujian Akhir Semester (UAS - Sesi 16)'
    default:
      return name
  }
}

const handleSave = async () => {
  if (!isValidTotal.value) return
  const classId = academicStore.selectedClassId
  if (!classId) return

  await gradebookStore.updateWeights(classId, localWeights.value)
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-deep-ink/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none overflow-y-auto"
  >
    <div class="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto">
      <!-- Header Modal -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-teal-50 text-scholarly-teal border border-teal-200">
            Kebijakan Evaluasi Akademik
          </span>
          <h3 class="text-xl font-bold text-academic-navy font-jakarta mt-1">
            Konfigurasi Bobot Penilaian Kelas
          </h3>
          <p class="text-xs text-slate-500 font-inter mt-0.5">
            Sesuaikan alokasi persentase bobot. Seluruh 5 komponen wajib berjumlah tepat 100.00%.
          </p>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Akumulasi Total Bobot Banner -->
      <div
        class="p-4 rounded-2xl border flex items-center justify-between transition-colors shadow-inner"
        :class="isValidTotal ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold"
            :class="isValidTotal ? 'bg-semantic-success' : 'bg-amber-alert'"
          >
            <span v-if="isValidTotal">✓</span>
            <span v-else>!</span>
          </div>
          <div>
            <span class="text-xs font-bold font-jakarta block">
              {{ isValidTotal ? 'Total Bobot Valid & Sesuai PRD' : 'Total Bobot Wajib Tepat 100.00%' }}
            </span>
            <span class="text-[11px] font-inter opacity-80 block">
              {{ isValidTotal ? 'Kalkulasi nilai otomatis dapat dijalankan.' : 'Sesuaikan angka pada komponen di bawah hingga mencapai 100%.' }}
            </span>
          </div>
        </div>

        <div class="text-right">
          <span class="text-2xl font-black font-mono block">
            {{ totalPercentage.toFixed(1) }}%
          </span>
          <span class="text-[10px] font-inter opacity-70">Target: 100%</span>
        </div>
      </div>

      <!-- Input Komponen Bobot 5 Macam -->
      <div class="space-y-4">
        <div
          v-for="w in localWeights"
          :key="w.componentName"
          class="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition space-y-2"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <h4 class="text-xs font-bold text-deep-ink font-jakarta">
                {{ getComponentLabel(w.componentName) }}
              </h4>
              <span class="text-[10px] font-mono text-slate-400 uppercase">
                {{ w.componentName }}
              </span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <input
                type="number"
                v-model.number="w.weightPercentage"
                min="0"
                max="100"
                step="1"
                class="w-20 px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-academic-navy text-right focus:ring-2 focus:ring-scholarly-teal focus:border-scholarly-teal bg-white"
              />
              <span class="font-mono text-sm font-bold text-slate-500">%</span>
            </div>
          </div>

          <!-- Slider Interaktif -->
          <input
            type="range"
            v-model.number="w.weightPercentage"
            min="0"
            max="100"
            step="1"
            class="w-full accent-scholarly-teal h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <!-- Footer Tombol Aksi -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 font-jakarta transition"
        >
          Batal
        </button>

        <button
          type="button"
          @click="handleSave"
          :disabled="!isValidTotal || gradebookStore.isSavingWeights"
          class="px-6 py-2.5 rounded-xl bg-academic-navy hover:bg-blue-900 active:scale-95 text-white font-bold text-xs font-jakarta transition shadow-md disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
        >
          <span v-if="gradebookStore.isSavingWeights" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>Simpan & Terapkan Bobot</span>
        </button>
      </div>
    </div>
  </div>
</template>
