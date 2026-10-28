<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGradebookStore } from '~/stores/useGradebookStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import type { StudentGradeBreakdownDto } from '~/types'

const props = defineProps<{
  isOpen: boolean
  student: StudentGradeBreakdownDto | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const gradebookStore = useGradebookStore()
const academicStore = useAcademicStore()

const overrideFinalScore = ref<number | null>(null)
const overrideAttendance = ref<number | null>(null)
const overrideAssignment = ref<number | null>(null)
const overrideQuiz = ref<number | null>(null)
const overrideMidterm = ref<number | null>(null)
const overrideFinalExam = ref<number | null>(null)
const reasonText = ref('')
const adjustMode = ref<'direct_final' | 'components'>('direct_final')

const initForm = () => {
  if (props.student) {
    overrideFinalScore.value = props.student.finalGrade.numericScore
    overrideAttendance.value = props.student.attendance.score
    overrideAssignment.value = props.student.assignment.averageScore
    overrideQuiz.value = props.student.quiz.averageScore
    overrideMidterm.value = props.student.midtermExam.score ?? 0
    overrideFinalExam.value = props.student.finalExam.score ?? 0
    reasonText.value = ''
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) initForm()
  },
  { immediate: true }
)

const isValidReason = computed(() => {
  return reasonText.value.trim().length >= 5
})

const handleSave = async () => {
  if (!props.student || !isValidReason.value) return
  const classId = academicStore.selectedClassId
  if (!classId) return

  const payload: any = {
    studentId: props.student.studentId,
    reason: reasonText.value.trim()
  }

  if (adjustMode.value === 'direct_final') {
    payload.numericScore = overrideFinalScore.value ?? props.student.finalGrade.numericScore
  } else {
    payload.attendanceScore = overrideAttendance.value ?? undefined
    payload.assignmentScore = overrideAssignment.value ?? undefined
    payload.quizScore = overrideQuiz.value ?? undefined
    payload.midtermScore = overrideMidterm.value ?? undefined
    payload.finalExamScore = overrideFinalExam.value ?? undefined
  }

  await gradebookStore.adjustGrade(classId, payload)
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen && student"
    class="fixed inset-0 z-50 bg-deep-ink/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none overflow-y-auto"
  >
    <div class="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-auto">
      <!-- Header Modal -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-blue-50 text-academic-navy border border-blue-200">
            Penyesuaian Nilai Manual & Audit Trail
          </span>
          <h3 class="text-lg font-bold text-academic-navy font-jakarta mt-1">
            Penyesuaian Nilai: {{ student.studentName }}
          </h3>
          <p class="text-xs text-slate-500 font-inter">
            NIM: <span class="font-mono font-bold text-slate-700">{{ student.studentNim || '-' }}</span> • Nilai Saat Ini: <span class="font-mono font-bold text-scholarly-teal">{{ student.finalGrade.numericScore }} ({{ student.finalGrade.letterGrade }})</span>
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

      <!-- Mode Selector -->
      <div class="flex rounded-xl bg-slate-100 p-1 text-xs font-jakarta font-bold">
        <button
          type="button"
          @click="adjustMode = 'direct_final'"
          class="flex-1 py-1.5 rounded-lg transition"
          :class="adjustMode === 'direct_final' ? 'bg-white text-academic-navy shadow-xs' : 'text-slate-500 hover:text-slate-800'"
        >
          Override Nilai Akhir (NA)
        </button>
        <button
          type="button"
          @click="adjustMode = 'components'"
          class="flex-1 py-1.5 rounded-lg transition"
          :class="adjustMode === 'components' ? 'bg-white text-academic-navy shadow-xs' : 'text-slate-500 hover:text-slate-800'"
        >
          Override Per Komponen
        </button>
      </div>

      <!-- Form Direct Final Score -->
      <div v-if="adjustMode === 'direct_final'" class="space-y-3">
        <label class="block text-xs font-bold text-slate-700 font-jakarta">
          Nilai Akhir Baru (0.00 - 100.00):
        </label>
        <div class="relative">
          <input
            type="number"
            v-model.number="overrideFinalScore"
            min="0"
            max="100"
            step="0.1"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-base font-bold text-academic-navy focus:ring-2 focus:ring-scholarly-teal focus:border-scholarly-teal bg-white"
          />
          <span class="absolute right-4 top-2.5 text-xs text-slate-400 font-inter">Skala 100</span>
        </div>
      </div>

      <!-- Form Per Komponen -->
      <div v-else class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block font-medium text-slate-600 mb-1">Presensi (0-100):</label>
          <input
            type="number"
            v-model.number="overrideAttendance"
            min="0"
            max="100"
            class="w-full p-2 rounded-lg border border-slate-300 font-mono text-sm bg-white"
          />
        </div>
        <div>
          <label class="block font-medium text-slate-600 mb-1">Rata-rata Tugas:</label>
          <input
            type="number"
            v-model.number="overrideAssignment"
            min="0"
            max="100"
            class="w-full p-2 rounded-lg border border-slate-300 font-mono text-sm bg-white"
          />
        </div>
        <div>
          <label class="block font-medium text-slate-600 mb-1">Rata-rata Kuis:</label>
          <input
            type="number"
            v-model.number="overrideQuiz"
            min="0"
            max="100"
            class="w-full p-2 rounded-lg border border-slate-300 font-mono text-sm bg-white"
          />
        </div>
        <div>
          <label class="block font-medium text-slate-600 mb-1">Skor UTS:</label>
          <input
            type="number"
            v-model.number="overrideMidterm"
            min="0"
            max="100"
            class="w-full p-2 rounded-lg border border-slate-300 font-mono text-sm bg-white"
          />
        </div>
        <div class="col-span-2">
          <label class="block font-medium text-slate-600 mb-1">Skor UAS:</label>
          <input
            type="number"
            v-model.number="overrideFinalExam"
            min="0"
            max="100"
            class="w-full p-2 rounded-lg border border-slate-300 font-mono text-sm bg-white"
          />
        </div>
      </div>

      <!-- Input Wajib: Alasan Perubahan (Audit Trail) -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <label class="font-bold text-slate-700 font-jakarta flex items-center gap-1">
            <span>Alasan Perubahan Nilai</span>
            <span class="text-semantic-danger">* (Wajib Audit Trail)</span>
          </label>
          <span class="text-[10px] font-mono" :class="isValidReason ? 'text-semantic-success' : 'text-slate-400'">
            Min. 5 karakter ({{ reasonText.trim().length }})
          </span>
        </div>
        <textarea
          v-model="reasonText"
          rows="3"
          placeholder="Contoh: Koreksi revisi tugas mandiri dan remidi kuis sesi 12 sesuai permohonan mahasiswa..."
          class="w-full p-3 rounded-xl border border-slate-300 font-inter text-xs text-deep-ink focus:ring-2 focus:ring-scholarly-teal focus:border-scholarly-teal bg-white"
        ></textarea>
        <span class="text-[10px] text-slate-400 font-inter block">
          Alasan ini akan dicatat permanen ke tabel <code class="font-mono text-slate-600">grade_audit_logs</code> lengkap dengan akun pengubah dan IP address.
        </span>
      </div>

      <!-- Footer Tombol Aksi -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 font-jakarta transition"
        >
          Batal
        </button>

        <button
          type="button"
          @click="handleSave"
          :disabled="!isValidReason || gradebookStore.isAdjusting"
          class="px-5 py-2.5 rounded-xl bg-academic-navy hover:bg-blue-900 active:scale-95 text-white font-bold text-xs font-jakarta transition shadow-md disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
        >
          <span v-if="gradebookStore.isAdjusting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>Simpan Penyesuaian</span>
        </button>
      </div>
    </div>
  </div>
</template>
