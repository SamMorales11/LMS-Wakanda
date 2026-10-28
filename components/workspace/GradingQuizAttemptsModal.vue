<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGradingStore } from '~/stores/useGradingStore'
import type { GradingQuizAttemptItemDto } from '~/types'

const props = defineProps<{
  isOpen: boolean
  quizId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const gradingStore = useGradingStore()

const activeAttempt = ref<GradingQuizAttemptItemDto | null>(null)
const essayScores = ref<Record<string, { score: number; feedback: string }>>({})
const generalFeedback = ref<string>('')

const loadAttempts = async () => {
  if (props.quizId) {
    activeAttempt.value = null
    await gradingStore.fetchCollectiveQuizAttempts(props.quizId)
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadAttempts()
  },
  { immediate: true }
)

const quizData = computed(() => gradingStore.currentQuizAttempts)
const attemptsList = computed(() => quizData.value?.attempts || [])

const selectAttempt = (att: GradingQuizAttemptItemDto) => {
  activeAttempt.value = att
  generalFeedback.value = att.generalFeedback || ''

  const scoresMap: Record<string, { score: number; feedback: string }> = {}
  for (const es of att.essayAnswers) {
    scoresMap[es.questionId] = {
      score: es.scoreAwarded !== null ? es.scoreAwarded : es.maxPoints,
      feedback: es.lecturerFeedback || ''
    }
  }
  essayScores.value = scoresMap
}

const handleSaveEssay = async () => {
  if (!activeAttempt.value) return

  const payloadAnswers = Object.entries(essayScores.value).map(([qId, val]) => ({
    questionId: qId,
    scoreAwarded: Number(val.score),
    lecturerFeedback: val.feedback.trim() || null
  }))

  await gradingStore.gradeQuizEssay(activeAttempt.value.attemptId, {
    answers: payloadAnswers,
    feedback: generalFeedback.value.trim() || null
  })
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-deep-ink/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 font-sans select-none overflow-hidden"
  >
    <div class="max-w-5xl w-full h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
      <!-- Header Modal -->
      <header class="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-academic-navy border border-blue-200">
              Evaluasi & Penilaian Ujian Daring
            </span>
            <span class="text-xs text-slate-400 font-inter">Kuis / UTS / UAS</span>
          </div>
          <h3 class="text-base sm:text-lg font-bold text-academic-navy font-jakarta mt-1">
            {{ quizData?.quizTitle || 'Daftar Pengerjaan Ujian Mahasiswa' }}
          </h3>
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
      </header>

      <!-- Main Layout -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
        <!-- Kolom Kiri: Daftar Mahasiswa Mengerjakan -->
        <div class="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/30">
          <div class="p-3 border-b border-slate-200 text-xs font-semibold text-slate-500 font-jakarta flex justify-between">
            <span>Percobaan ({{ attemptsList.length }})</span>
            <span>Rata-rata: {{ quizData?.averageScore ? quizData.averageScore.toFixed(1) : '-' }}</span>
          </div>

          <div class="flex-1 overflow-y-auto divide-y divide-slate-100">
            <div
              v-for="att in attemptsList"
              :key="att.attemptId"
              @click="selectAttempt(att)"
              class="p-3.5 hover:bg-white transition cursor-pointer flex items-start justify-between gap-2"
              :class="activeAttempt?.attemptId === att.attemptId ? 'bg-teal-50/80 border-l-4 border-scholarly-teal' : ''"
            >
              <div class="min-w-0 flex-1">
                <div class="font-bold text-xs text-deep-ink font-jakarta truncate">{{ att.studentName }}</div>
                <div class="font-mono text-[10px] text-slate-400">{{ att.studentNim || '-' }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] font-mono text-slate-500">
                    MCQ: {{ att.autoScore }}
                  </span>
                  <span v-if="att.totalScore !== null" class="text-[10px] font-mono font-bold text-academic-navy">
                    Total: {{ att.totalScore }}
                  </span>
                </div>
              </div>

              <div class="shrink-0 text-right">
                <span
                  class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
                  :class="att.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ att.status === 'GRADED' ? 'Selesai' : 'Perlu Koreksi' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Kolom Kanan: Rincian Soal Esai & Penilaian Manual -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-white space-y-5">
          <div v-if="!activeAttempt" class="h-full flex items-center justify-center text-center p-8 text-slate-400 font-inter text-xs">
            Pilih lembar ujian mahasiswa di sebelah kiri untuk memeriksa jawaban soal pilihan ganda & menilai soal esai.
          </div>

          <div v-else class="space-y-5">
            <!-- Header Mahasiswa -->
            <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-deep-ink font-jakarta">
                  {{ activeAttempt.studentName }}
                </h4>
                <p class="text-xs text-slate-500 font-inter">
                  NIM: <span class="font-mono font-bold">{{ activeAttempt.studentNim || '-' }}</span> • Skor Otomatis MCQ: <span class="font-mono font-bold text-scholarly-teal">{{ activeAttempt.autoScore }}</span>
                </p>
              </div>

              <div class="text-right">
                <span class="text-[10px] text-slate-400 font-inter block">Total Skor Ujian</span>
                <span class="text-2xl font-black font-mono text-academic-navy">
                  {{ activeAttempt.totalScore !== null ? activeAttempt.totalScore : activeAttempt.autoScore }}
                </span>
              </div>
            </div>

            <!-- Daftar Soal Esai yang Perlu Dinilai -->
            <div v-if="activeAttempt.essayAnswers.length === 0" class="p-6 rounded-2xl border border-slate-200 text-center text-slate-500 font-inter text-xs bg-slate-50/50">
              Ujian ini hanya berisi butir soal Pilihan Ganda (MCQ) dan telah dinilai secara otomatis oleh sistem.
            </div>

            <div v-else class="space-y-4">
              <h4 class="text-xs font-bold font-jakarta uppercase tracking-wider text-slate-600">
                Koreksi & Pembobotan Jawaban Soal Esai ({{ activeAttempt.essayAnswers.length }} Butir):
              </h4>

              <div
                v-for="es in activeAttempt.essayAnswers"
                :key="es.questionId"
                class="p-4 rounded-2xl border border-slate-200 space-y-3 bg-slate-50/50"
              >
                <div>
                  <div class="flex items-center justify-between text-xs font-bold font-jakarta text-slate-700">
                    <span>Pertanyaan:</span>
                    <span class="font-mono text-scholarly-teal">Maksimal: {{ es.maxPoints }} Poin</span>
                  </div>
                  <p class="text-xs text-slate-800 font-inter mt-1 whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200">
                    {{ es.prompt }}
                  </p>
                </div>

                <!-- Jawaban Mahasiswa -->
                <div>
                  <span class="text-[11px] font-bold text-slate-500 font-jakarta block mb-1">
                    Jawaban Mahasiswa:
                  </span>
                  <div class="p-3.5 rounded-xl bg-white border border-slate-200 font-mono text-xs text-deep-ink whitespace-pre-wrap">
                    {{ es.essayAnswer || '(Mahasiswa tidak mengisi jawaban)' }}
                  </div>
                </div>

                <!-- Input Nilai Esai -->
                <div class="flex items-center justify-between pt-2 border-t border-slate-200 gap-4">
                  <div class="flex-1">
                    <input
                      type="text"
                      v-model="essayScores[es.questionId].feedback"
                      placeholder="Catatan umpan balik esai..."
                      class="w-full p-2 rounded-xl border border-slate-300 font-inter text-xs bg-white"
                    />
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-xs font-bold font-jakarta text-slate-600">Nilai:</span>
                    <input
                      type="number"
                      v-model.number="essayScores[es.questionId].score"
                      min="0"
                      :max="es.maxPoints"
                      step="0.5"
                      class="w-20 p-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-right text-academic-navy bg-white"
                    />
                    <span class="font-mono text-xs text-slate-400">/ {{ es.maxPoints }}</span>
                  </div>
                </div>
              </div>

              <!-- Tombol Simpan Nilai Esai -->
              <div class="flex justify-end pt-2">
                <button
                  type="button"
                  @click="handleSaveEssay"
                  :disabled="gradingStore.isGrading"
                  class="px-6 py-2.5 rounded-xl bg-academic-navy hover:bg-blue-900 text-white text-xs font-bold font-jakarta transition shadow-md flex items-center gap-2"
                >
                  <span v-if="gradingStore.isGrading" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Simpan Penilaian Esai</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
