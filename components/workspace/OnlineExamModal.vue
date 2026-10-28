<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuizStore } from '~/stores/useQuizStore'
import { useAuthStore } from '~/stores/useAuthStore'

const quizStore = useQuizStore()
const authStore = useAuthStore()

// Local timer interval
let timerInterval: ReturnType<typeof setInterval> | null = null
let autoSaveInterval: ReturnType<typeof setInterval> | null = null

// State Konfirmasi Submit Modal
const showConfirmSubmit = ref(false)

// Inisialisasi Timer saat sesi aktif
const startTimers = () => {
  stopTimers()

  // 1-second tick timer
  timerInterval = setInterval(() => {
    if (quizStore.remainingSeconds > 0) {
      quizStore.tickSecond()
      if (quizStore.remainingSeconds <= 0) {
        handleTimeUp()
      }
    }
  }, 1000)

  // 25-second periodic auto-save
  autoSaveInterval = setInterval(() => {
    if (quizStore.activeSession && !quizStore.isSubmitting) {
      quizStore.autoSaveAll()
    }
  }, 25000)
}

const stopTimers = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
}

// Timeout auto-close handler
const handleTimeUp = async () => {
  stopTimers()
  try {
    await quizStore.submitFinalExam(true)
  } catch (err) {
    console.warn('[OnlineExamModal] Waktu habis, penutupan otomatis:', err)
  }
}

onMounted(() => {
  if (quizStore.activeSession) {
    startTimers()
  }
})

onUnmounted(() => {
  stopTimers()
})

watch(
  () => quizStore.activeSession,
  (newSession) => {
    if (newSession) {
      startTimers()
    } else {
      stopTimers()
    }
  }
)

const currentQ = computed(() => quizStore.currentQuestion)
const currentIndex = computed(() => quizStore.currentQuestionIndex)
const totalQ = computed(() => quizStore.totalQuestions)

const currentAnswerState = computed(() => {
  if (!currentQ.value) return null
  return quizStore.localAnswers[currentQ.value.id] || null
})

const isCurrentDoubtful = computed(() => {
  return Boolean(currentAnswerState.value?.isDoubtful)
})

const handleSelectOption = (optionId: string) => {
  if (!currentQ.value) return
  quizStore.selectMcqOption(currentQ.value.id, optionId)
}

const handleEssayChange = (event: Event) => {
  if (!currentQ.value) return
  const target = event.target as HTMLTextAreaElement
  quizStore.updateEssayAnswer(currentQ.value.id, target.value)
}

const handleToggleDoubtful = () => {
  if (!currentQ.value) return
  quizStore.toggleDoubtful(currentQ.value.id)
}

const handleNext = () => {
  quizStore.autoSaveAll()
  quizStore.nextQuestion()
}

const handlePrev = () => {
  quizStore.autoSaveAll()
  quizStore.prevQuestion()
}

const handleNavClick = (idx: number) => {
  quizStore.autoSaveAll()
  quizStore.goToQuestion(idx)
}

const confirmAndSubmit = async () => {
  showConfirmSubmit.value = false
  stopTimers()
  await quizStore.submitFinalExam(false)
}

const getQuestionStatusClass = (questionId: string, idx: number) => {
  const ans = quizStore.localAnswers[questionId]
  const isSelected = idx === currentIndex.value

  const hasAnswer = ans && (
    (ans.selectedOptionId !== null && ans.selectedOptionId !== undefined && ans.selectedOptionId !== '') ||
    (ans.essayAnswer !== null && ans.essayAnswer !== undefined && ans.essayAnswer.trim() !== '')
  )

  const isDoubtful = ans && ans.isDoubtful

  if (isSelected) {
    return 'ring-2 ring-offset-2 ring-academic-navy font-black text-white bg-academic-navy'
  }
  if (isDoubtful) {
    // Amber Alert #D97706
    return 'bg-amber-500 text-white font-bold border-amber-600 shadow-sm'
  }
  if (hasAnswer) {
    return 'bg-scholarly-teal text-white font-bold border-teal-700'
  }
  return 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
}
</script>

<template>
  <div
    v-if="quizStore.isExamOpen"
    class="fixed inset-0 z-50 bg-deep-ink/80 backdrop-blur-md flex flex-col font-sans select-none overflow-hidden"
  >
    <!-- ============================================== -->
    <!-- TOP BAR / HEADER UJIAN                         -->
    <!-- ============================================== -->
    <header class="h-16 bg-academic-navy text-white px-4 sm:px-8 flex items-center justify-between border-b border-white/10 shrink-0 shadow-md">
      <!-- Info Ujian -->
      <div class="flex items-center space-x-3 min-w-0">
        <div class="p-2 rounded-xl bg-white/10 border border-white/20 shrink-0">
          <svg class="w-5 h-5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="truncate">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase" :class="quizStore.activeSession?.quizType === 'FINAL_EXAM' ? 'bg-red-500 text-white' : (quizStore.activeSession?.quizType === 'MIDTERM_EXAM' ? 'bg-amber-500 text-white' : 'bg-scholarly-teal text-white')">
              {{ quizStore.activeSession?.quizType || 'UJIAN DARING' }}
            </span>
            <span class="text-xs text-slate-300 font-inter hidden sm:inline">Mahasiswa: {{ authStore.displayName }}</span>
          </div>
          <h2 class="text-sm sm:text-base font-bold text-white font-jakarta truncate">
            {{ quizStore.activeSession?.quizTitle || 'Ujian Perkuliahan ITW' }}
          </h2>
        </div>
      </div>

      <!-- Countdown Timer Real-time di JetBrains Mono & Indikator Auto-Save -->
      <div class="flex items-center space-x-3 sm:space-x-6 shrink-0">
        <!-- Auto-save pulse -->
        <div class="hidden md:flex items-center gap-2 text-[11px] font-inter text-slate-300">
          <span
            class="w-2.5 h-2.5 rounded-full transition-colors duration-300"
            :class="quizStore.isAutoSaving ? 'bg-amber-400 animate-ping' : 'bg-semantic-success'"
          ></span>
          <span>{{ quizStore.isAutoSaving ? 'Menyimpan...' : (quizStore.lastSavedAt ? `Tersimpan: ${quizStore.lastSavedAt}` : 'Auto-save aktif') }}</span>
        </div>

        <!-- Timer Card -->
        <div
          class="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl border transition-colors shadow-inner"
          :class="quizStore.isTimeUrgent ? 'bg-semantic-danger/20 border-semantic-danger text-red-200 animate-pulse' : 'bg-white/10 border-white/20 text-white'"
        >
          <svg class="w-4 h-4 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex flex-col items-end">
            <span class="text-[9px] uppercase tracking-wider font-semibold text-slate-300 leading-none">Sisa Waktu</span>
            <span class="font-mono text-base sm:text-lg font-black tracking-tight leading-tight">
              {{ quizStore.formattedRemainingTime }}
            </span>
          </div>
        </div>

        <!-- Tombol Selesai Ujian -->
        <button
          type="button"
          @click="showConfirmSubmit = true"
          :disabled="quizStore.isSubmitting"
          class="px-4 py-2 rounded-xl bg-semantic-success hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm font-jakarta shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>Kumpulkan</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </header>

    <!-- ============================================== -->
    <!-- HASIL UJIAN PASCA-SUBMIT (POST-EXAM SUMMARY)    -->
    <!-- ============================================== -->
    <div
      v-if="quizStore.examResult"
      class="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-slate-900/90"
    >
      <div class="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 border border-slate-200">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-semantic-success mx-auto flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <span class="text-xs font-mono font-bold px-3 py-1 rounded-full bg-teal-50 text-scholarly-teal border border-teal-200">
            Status: {{ quizStore.examResult.status }}
          </span>
          <h3 class="text-2xl font-black text-academic-navy font-jakarta mt-3">
            Ujian Berhasil Dikumpulkan!
          </h3>
          <p class="text-xs text-slate-500 font-inter mt-1">
            Lembar jawaban Anda telah diterima server dan diverifikasi dengan Strict Server-Side Timestamp.
          </p>
        </div>

        <!-- Skor Instan Pilihan Ganda -->
        <div class="p-5 rounded-2xl bg-alabaster-slate border border-slate-200 space-y-2">
          <span class="text-[11px] text-slate-500 font-inter">Nilai Terkoreksi Otomatis (MCQ)</span>
          <div class="font-mono text-4xl font-black text-academic-navy">
            {{ quizStore.examResult.autoScore || quizStore.examResult.score || '0.00' }}
          </div>
          <span class="text-[11px] text-slate-400 font-inter block">
            {{ quizStore.examResult.status === 'GRADED' ? 'Seluruh soal selesai dinilai secara instan' : 'Soal esai masih dalam antrean penilaian dosen' }}
          </span>
        </div>

        <button
          type="button"
          @click="quizStore.closeExam()"
          class="w-full py-3 rounded-2xl bg-academic-navy hover:bg-blue-900 text-white font-bold text-sm font-jakarta transition shadow-md"
        >
          Kembali ke Ruang Kelas
        </button>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- KONTEN UTAMA: SOAL & PALET NAVIGASI             -->
    <!-- ============================================== -->
    <div v-else class="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      <!-- Kolom Kiri: Butir Soal Aktif -->
      <div class="flex-1 flex flex-col overflow-hidden bg-white">
        <!-- Sub-header Soal -->
        <div class="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold font-jakarta text-academic-navy">
              Soal Nomor {{ currentIndex + 1 }} dari {{ totalQ }}
            </span>
            <span class="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded bg-slate-200 text-slate-700">
              {{ currentQ?.type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Esai Reflektif' }}
            </span>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              +{{ currentQ?.points }} Poin
            </span>
          </div>

          <!-- Tombol Ragu-ragu (Amber Alert #D97706) -->
          <button
            type="button"
            @click="handleToggleDoubtful"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold font-jakarta transition flex items-center gap-1.5 border"
            :class="isCurrentDoubtful ? 'bg-amber-500 border-amber-600 text-white shadow-xs' : 'bg-white border-amber-400 text-amber-700 hover:bg-amber-50'"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ isCurrentDoubtful ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu-ragu' }}</span>
          </button>
        </div>

        <!-- Soal Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          <!-- Teks Pertanyaan -->
          <div class="p-5 rounded-2xl bg-alabaster-slate border border-slate-200 text-slate-800 font-inter text-sm sm:text-base leading-relaxed">
            <p class="whitespace-pre-wrap">{{ currentQ?.prompt }}</p>
          </div>

          <!-- Lembar Jawaban: Pilihan Ganda -->
          <div v-if="currentQ?.type === 'MULTIPLE_CHOICE'" class="space-y-3">
            <h4 class="text-xs font-bold font-jakarta uppercase tracking-wider text-slate-500">
              Pilih Satu Jawaban Terbaik:
            </h4>
            <div class="space-y-2.5">
              <label
                v-for="(opt, optIdx) in currentQ.options"
                :key="opt.id"
                class="flex items-start gap-3.5 p-4 rounded-2xl border transition cursor-pointer"
                :class="currentAnswerState?.selectedOptionId === opt.id ? 'bg-teal-50/70 border-scholarly-teal ring-2 ring-scholarly-teal/30' : 'bg-white border-slate-200 hover:border-slate-300'"
              >
                <input
                  type="radio"
                  :name="`question_${currentQ.id}`"
                  :value="opt.id"
                  :checked="currentAnswerState?.selectedOptionId === opt.id"
                  @change="handleSelectOption(opt.id)"
                  class="mt-1 text-scholarly-teal focus:ring-scholarly-teal"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {{ String.fromCharCode(65 + optIdx) }}
                    </span>
                    <span class="text-sm font-inter text-deep-ink leading-relaxed">
                      {{ opt.text }}
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Lembar Jawaban: Esai -->
          <div v-else-if="currentQ?.type === 'ESSAY'" class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold font-jakarta uppercase tracking-wider text-slate-500">
                Tulis Jawaban Analisis & Pemrograman:
              </h4>
              <span class="text-[11px] font-mono text-slate-400">
                {{ currentAnswerState?.essayAnswer ? currentAnswerState.essayAnswer.length : 0 }} karakter
              </span>
            </div>
            <textarea
              :value="currentAnswerState?.essayAnswer || ''"
              @input="handleEssayChange"
              rows="10"
              class="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs sm:text-sm text-deep-ink focus:ring-2 focus:ring-scholarly-teal focus:border-scholarly-teal transition placeholder:text-slate-400 bg-white"
              placeholder="Ketik jawaban penjelasan teknis atau potongan kode Anda di sini..."
            ></textarea>
          </div>
        </div>

        <!-- Footer Navigasi Soal (Prev / Next) -->
        <div class="p-4 sm:p-6 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <button
            type="button"
            @click="handlePrev"
            :disabled="currentIndex === 0"
            class="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm font-jakarta transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Soal Sebelumnya</span>
          </button>

          <span class="text-xs font-mono text-slate-500 font-semibold hidden sm:inline">
            {{ quizStore.answeredCount }} dari {{ totalQ }} soal terjawab
          </span>

          <button
            type="button"
            @click="handleNext"
            :disabled="currentIndex === totalQ - 1"
            class="px-5 py-2.5 rounded-xl bg-academic-navy hover:bg-blue-900 active:scale-95 text-white font-bold text-xs sm:text-sm font-jakarta transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 shadow-xs"
          >
            <span>Soal Selanjutnya</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Kolom Kanan: Palet Grid Nomor Soal -->
      <aside class="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shrink-0">
        <div class="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 class="text-sm font-bold text-academic-navy font-jakarta">
            Navigasi Nomor Soal
          </h3>
          <p class="text-[11px] text-slate-500 font-inter mt-0.5">
            Klik nomor untuk berpindah soal secara langsung.
          </p>
        </div>

        <!-- Grid Nomor Soal (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-5">
          <div class="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2.5">
            <button
              v-for="(q, idx) in quizStore.activeSession?.questions"
              :key="q.id"
              type="button"
              @click="handleNavClick(idx)"
              class="h-10 rounded-xl border text-xs font-mono transition-all flex items-center justify-center relative"
              :class="getQuestionStatusClass(q.id, idx)"
              :title="`Nomor ${idx + 1}`"
            >
              <span>{{ idx + 1 }}</span>
              <span
                v-if="quizStore.localAnswers[q.id]?.isDoubtful"
                class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white"
              ></span>
            </button>
          </div>
        </div>

        <!-- Legend Indikator Status -->
        <div class="p-4 border-t border-slate-200 bg-slate-50/80 space-y-2 font-inter text-[11px] text-slate-600">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-md bg-scholarly-teal shrink-0"></span>
            <span>Sudah Dijawab ({{ quizStore.answeredCount }})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0"></span>
            <span>Ragu-ragu (#D97706) ({{ quizStore.doubtfulCount }})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-md bg-white border border-slate-300 shrink-0"></span>
            <span>Belum Dijawab ({{ totalQ - quizStore.answeredCount }})</span>
          </div>
        </div>
      </aside>
    </div>

    <!-- ============================================== -->
    <!-- MODAL KONFIRMASI KUMPULKAN UJIAN               -->
    <!-- ============================================== -->
    <div
      v-if="showConfirmSubmit"
      class="fixed inset-0 z-60 bg-deep-ink/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
    >
      <div class="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center gap-3 text-academic-navy">
          <div class="p-3 rounded-2xl bg-teal-50 text-scholarly-teal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-bold font-jakarta text-academic-navy">
              Konfirmasi Pengumpulan Ujian
            </h3>
            <p class="text-xs text-slate-500 font-inter">Periksa kembali ringkasan lembar jawaban Anda.</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 font-inter text-xs">
          <div class="flex justify-between py-1.5">
            <span class="text-slate-500">Total Butir Soal:</span>
            <span class="font-mono font-bold text-deep-ink">{{ totalQ }} Soal</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-500">Sudah Terjawab:</span>
            <span class="font-mono font-bold text-semantic-success">{{ quizStore.answeredCount }} Soal</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-500">Ditandai Ragu-ragu:</span>
            <span class="font-mono font-bold text-amber-600">{{ quizStore.doubtfulCount }} Soal</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-500">Belum Terjawab:</span>
            <span class="font-mono font-bold text-semantic-danger">{{ totalQ - quizStore.answeredCount }} Soal</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showConfirmSubmit = false"
            class="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 font-jakarta transition"
          >
            Lanjutkan Mengerjakan
          </button>
          <button
            type="button"
            @click="confirmAndSubmit"
            class="px-5 py-2.5 rounded-xl bg-semantic-success hover:bg-emerald-600 text-white font-bold text-xs font-jakarta transition shadow-md"
          >
            Ya, Kumpulkan Sekarang
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
