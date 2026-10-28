<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGradingStore } from '~/stores/useGradingStore'
import type { GradingSubmissionItemDto } from '~/types'

const props = defineProps<{
  isOpen: boolean
  assignmentId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const gradingStore = useGradingStore()

const activeSubmission = ref<GradingSubmissionItemDto | null>(null)
const inputScore = ref<number>(85)
const inputFeedback = ref<string>('')
const inputRubric = ref<string>('')
const inputRevision = ref<string>('')

const loadSubmissions = async () => {
  if (props.assignmentId) {
    activeSubmission.value = null
    await gradingStore.fetchCollectiveSubmissions(props.assignmentId)
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadSubmissions()
  },
  { immediate: true }
)

const submissionsData = computed(() => gradingStore.currentSubmissions)
const submissionsList = computed(() => submissionsData.value?.submissions || [])

const selectSubmission = (sub: GradingSubmissionItemDto) => {
  activeSubmission.value = sub
  inputScore.value = sub.score !== null ? sub.score : 85
  inputFeedback.value = sub.feedback || ''
  inputRubric.value = sub.rubricFeedback || ''
  inputRevision.value = sub.revisionNotes || ''
}

const handleSaveGrade = async (status: 'GRADED' | 'RESUBMISSION_REQUESTED' = 'GRADED') => {
  if (!activeSubmission.value) return

  await gradingStore.gradeSubmission(activeSubmission.value.submissionId, {
    score: inputScore.value,
    feedback: inputFeedback.value.trim() || null,
    rubricFeedback: inputRubric.value.trim() || null,
    revisionNotes: inputRevision.value.trim() || null,
    status
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
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-scholarly-teal border border-teal-200">
              Penilaian Tugas & Berkas Mahasiswa
            </span>
            <span class="text-xs text-slate-400 font-inter">Max Skor: {{ submissionsData?.maxScore || 100 }} Poin</span>
          </div>
          <h3 class="text-base sm:text-lg font-bold text-academic-navy font-jakarta mt-1">
            {{ submissionsData?.assignmentTitle || 'Daftar Pengumpulan Tugas' }}
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

      <!-- Main Two-Column Layout -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
        <!-- Kolom Kiri: Daftar Pengumpulan Mahasiswa -->
        <div class="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/30">
          <div class="p-3 border-b border-slate-200 text-xs font-semibold text-slate-500 font-jakarta flex justify-between">
            <span>Daftar Peserta ({{ submissionsList.length }})</span>
            <span>Terkumpul: {{ submissionsData?.submittedCount || 0 }}</span>
          </div>

          <div class="flex-1 overflow-y-auto divide-y divide-slate-100">
            <div
              v-for="sub in submissionsList"
              :key="sub.submissionId"
              @click="selectSubmission(sub)"
              class="p-3.5 hover:bg-white transition cursor-pointer flex items-start justify-between gap-2"
              :class="activeSubmission?.submissionId === sub.submissionId ? 'bg-teal-50/80 border-l-4 border-scholarly-teal' : ''"
            >
              <div class="min-w-0 flex-1">
                <div class="font-bold text-xs text-deep-ink font-jakarta truncate">{{ sub.studentName }}</div>
                <div class="font-mono text-[10px] text-slate-400">{{ sub.studentNim || '-' }}</div>
                <div class="flex items-center gap-1.5 mt-1">
                  <span
                    class="text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold"
                    :style="{ backgroundColor: `${sub.timingColor}20`, color: sub.timingColor }"
                  >
                    {{ sub.timingLabel }}
                  </span>
                  <span v-if="sub.score !== null" class="text-[10px] font-mono font-bold text-scholarly-teal">
                    Skor: {{ sub.score }}
                  </span>
                </div>
              </div>

              <div class="shrink-0 text-right">
                <span
                  class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
                  :class="sub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ sub.status === 'GRADED' ? 'Dinilai' : 'Pending' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Kolom Kanan: Rincian Berkas & Formulir Penilaian -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-white space-y-5">
          <div v-if="!activeSubmission" class="h-full flex items-center justify-center text-center p-8 text-slate-400 font-inter text-xs">
            Pilih salah satu mahasiswa dari daftar di sebelah kiri untuk melihat berkas dan memberikan penilaian.
          </div>

          <div v-else class="space-y-5">
            <!-- Header Mahasiswa Terpilih -->
            <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-deep-ink font-jakarta">
                  {{ activeSubmission.studentName }}
                </h4>
                <p class="text-xs text-slate-500 font-inter">
                  NIM: <span class="font-mono font-bold">{{ activeSubmission.studentNim || '-' }}</span> • Dikumpulkan: <span class="font-mono">{{ new Date(activeSubmission.submittedAt).toLocaleString('id-ID') }}</span>
                </p>
              </div>

              <!-- Signed Read URL Link -->
              <div v-if="activeSubmission.signedReadUrl">
                <a
                  :href="activeSubmission.signedReadUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-2 rounded-xl bg-scholarly-teal hover:bg-teal-700 text-white font-bold text-xs font-jakarta transition flex items-center gap-1.5 shadow-xs"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Buka Berkas PDF/ZIP</span>
                </a>
              </div>
            </div>

            <!-- Input Nilai & Umpan Balik -->
            <div class="p-5 rounded-2xl border border-slate-200 space-y-4 bg-slate-50/40">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-deep-ink font-jakarta uppercase tracking-wider">
                  Skor Penilaian (0 - 100):
                </label>
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    v-model.number="inputScore"
                    min="0"
                    max="100"
                    step="0.5"
                    class="w-24 px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-base font-bold text-academic-navy text-right focus:ring-2 focus:ring-scholarly-teal bg-white"
                  />
                  <span class="font-mono text-xs text-slate-400">/ 100</span>
                </div>
              </div>

              <!-- Rubrik -->
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-600 font-jakarta">Catatan Rubrik & Kriteria:</label>
                <textarea
                  v-model="inputRubric"
                  rows="2"
                  placeholder="Komentar rubrik kelengkapan algoritma, arsitektur kode, kerapian..."
                  class="w-full p-3 rounded-xl border border-slate-300 font-inter text-xs bg-white focus:ring-2 focus:ring-scholarly-teal"
                ></textarea>
              </div>

              <!-- Umpan Balik Umum -->
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-600 font-jakarta">Umpan Balik Dosen:</label>
                <textarea
                  v-model="inputFeedback"
                  rows="2"
                  placeholder="Apresiasi atau catatan perbaikan pemahaman..."
                  class="w-full p-3 rounded-xl border border-slate-300 font-inter text-xs bg-white focus:ring-2 focus:ring-scholarly-teal"
                ></textarea>
              </div>

              <!-- Catatan Revisi jika perbaikan -->
              <div class="space-y-1">
                <label class="text-xs font-semibold text-amber-700 font-jakarta">Catatan Revisi (Opsional):</label>
                <input
                  type="text"
                  v-model="inputRevision"
                  placeholder="Permintaan unggah ulang jika berkas rusak atau kode belum lengkap..."
                  class="w-full p-2.5 rounded-xl border border-slate-300 font-inter text-xs bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <!-- Tombol Simpan -->
              <div class="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  @click="handleSaveGrade('RESUBMISSION_REQUESTED')"
                  :disabled="gradingStore.isGrading"
                  class="px-4 py-2 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold font-jakarta transition"
                >
                  Minta Unggah Ulang
                </button>
                <button
                  type="button"
                  @click="handleSaveGrade('GRADED')"
                  :disabled="gradingStore.isGrading"
                  class="px-5 py-2 rounded-xl bg-academic-navy hover:bg-blue-900 text-white text-xs font-bold font-jakarta transition shadow-xs flex items-center gap-1.5"
                >
                  <span v-if="gradingStore.isGrading" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Simpan Nilai</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
