<script setup lang="ts">
import { ref } from 'vue'
import type { AssignmentSubmissionOverviewDto, SubmissionDto } from '~/types'
import { useAssignmentStore } from '~/stores/useAssignmentStore'

const props = defineProps<{
  isOpen: boolean
  overview: AssignmentSubmissionOverviewDto | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'graded'): void
}>()

const assignmentStore = useAssignmentStore()

// State Grading Form
const editingSubmissionId = ref<string | null>(null)
const gradeScore = ref<number>(100)
const gradeFeedback = ref('')
const isGrading = ref(false)
const gradeError = ref<string | null>(null)

const handleStartGrading = (sub: SubmissionDto) => {
  editingSubmissionId.value = sub.id
  gradeScore.value = sub.score ? parseFloat(sub.score) : 100
  gradeFeedback.value = sub.feedback || ''
  gradeError.value = null
}

const handleSaveGrade = async (sub: SubmissionDto) => {
  if (!props.overview) return
  isGrading.value = true
  gradeError.value = null

  try {
    await assignmentStore.gradeSubmission(
      sub.id,
      gradeScore.value,
      gradeFeedback.value.trim() || undefined,
      props.overview.assignment.id
    )
    editingSubmissionId.value = null
    emit('graded')
  } catch (err: any) {
    gradeError.value = err.message || 'Gagal menyimpan nilai'
  } finally {
    isGrading.value = false
  }
}

const formatDateTime = (isoStr?: string | null) => {
  if (!isoStr) return '-'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB'
  } catch {
    return isoStr
  }
}
</script>

<template>
  <div
    v-if="isOpen && overview"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-xs transition-opacity"
    @click.self="emit('close')"
  >
    <div class="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="bg-academic-navy text-white p-5 flex items-center justify-between shrink-0">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-bold">
            Evaluasi & Penilaian Pengumpulan Mahasiswa
          </span>
          <h3 class="text-base font-bold font-jakarta line-clamp-1">
            {{ overview.assignment.title }}
          </h3>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-wrap gap-4 text-xs font-inter shrink-0">
        <div class="flex items-center gap-4 flex-wrap">
          <span class="text-slate-600">Total Mahasiswa: <strong class="text-academic-navy font-mono">{{ overview.totalEnrolled }}</strong></span>
          <span class="text-slate-600">Terkumpul: <strong class="text-academic-navy font-mono">{{ overview.submittedCount }}</strong></span>
          <span class="text-semantic-success flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-semantic-success"></span>
            Tepat Waktu: <strong class="font-mono">{{ overview.onTimeCount }}</strong>
          </span>
          <span class="text-semantic-danger flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-semantic-danger"></span>
            Terlambat: <strong class="font-mono">{{ overview.lateCount }}</strong>
          </span>
          <span class="text-scholarly-teal">Dinilai: <strong class="font-mono">{{ overview.gradedCount }}</strong></span>
        </div>

        <div class="text-[11px] font-mono text-slate-500">
          Maks Nilai: {{ overview.assignment.maxScore }} Poin
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="gradeError" class="p-3 bg-red-50 text-semantic-danger text-xs border-b border-red-200 font-inter">
        {{ gradeError }}
      </div>

      <!-- Submissions Table List -->
      <div class="overflow-y-auto p-6 flex-1 space-y-4">
        <div v-if="overview.submissions.length === 0" class="text-center py-12 text-slate-400 text-xs">
          Belum ada mahasiswa yang mengumpulkan tugas ini.
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="sub in overview.submissions"
            :key="sub.id"
            class="py-4 space-y-3"
          >
            <!-- Row Mahasiswa Meta -->
            <div class="flex items-start justify-between flex-wrap gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <h5 class="text-sm font-bold text-academic-navy font-jakarta">
                    {{ sub.studentName || 'Mahasiswa' }}
                  </h5>
                  <!-- Status Ketepatan Waktu: Tepat Waktu (#16A34A) vs Terlambat (#DC2626) -->
                  <span
                    class="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider text-white"
                    :style="{ backgroundColor: sub.timingColor }"
                  >
                    ● {{ sub.timingLabel }}
                  </span>

                  <span
                    v-if="sub.status === 'GRADED'"
                    class="px-2 py-0.5 rounded-md bg-teal-50 text-scholarly-teal border border-teal-200 font-mono text-[10px] font-bold uppercase"
                  >
                    Dinilai: {{ sub.score }} / {{ overview.assignment.maxScore }}
                  </span>
                </div>

                <div class="flex items-center gap-3 text-xs text-slate-500 font-mono">
                  <span>NIM: {{ sub.studentNim || '-' }}</span>
                  <span>•</span>
                  <span>Waktu: {{ formatDateTime(sub.submittedAt) }}</span>
                </div>
              </div>

              <!-- Berkas Download & Grading Trigger Button -->
              <div class="flex items-center gap-2">
                <a
                  v-if="sub.fileUrl"
                  :href="sub.fileUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs font-jakarta transition flex items-center gap-1.5"
                >
                  <span>📥 Unduh Berkas</span>
                  <span class="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{{ sub.fileName || 'PDF/ZIP' }}</span>
                </a>

                <button
                  type="button"
                  @click="handleStartGrading(sub)"
                  class="px-3.5 py-1.5 rounded-xl bg-academic-navy hover:bg-blue-900 text-white font-semibold text-xs font-jakarta transition"
                >
                  {{ sub.status === 'GRADED' ? 'Edit Nilai' : 'Beri Nilai' }}
                </button>
              </div>
            </div>

            <!-- Notes jika ada -->
            <div v-if="sub.contentText" class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              <strong class="text-slate-700 block text-[11px] mb-0.5">Catatan Mahasiswa:</strong>
              <p>{{ sub.contentText }}</p>
            </div>

            <!-- Feedback Dosen jika sudah dinilai -->
            <div v-if="sub.feedback && editingSubmissionId !== sub.id" class="p-2.5 rounded-xl bg-teal-50/50 border border-teal-200 text-slate-700 text-xs">
              <strong class="text-scholarly-teal block text-[11px] mb-0.5">Umpan Balik Dosen:</strong>
              <p>{{ sub.feedback }}</p>
            </div>

            <!-- Inline Grading Form -->
            <div
              v-if="editingSubmissionId === sub.id"
              class="p-4 rounded-2xl bg-alabaster-slate border border-teal-300 space-y-3 animate-in fade-in"
            >
              <h6 class="font-bold text-academic-navy text-xs font-jakarta">
                Form Penilaian: {{ sub.studentName }}
              </h6>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-inter">
                <div class="space-y-1">
                  <label class="block font-semibold text-slate-700">
                    Nilai (0 - {{ overview.assignment.maxScore }})
                  </label>
                  <input
                    v-model.number="gradeScore"
                    type="number"
                    min="0"
                    :max="overview.assignment.maxScore"
                    class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-mono text-sm font-bold"
                  />
                </div>

                <div class="sm:col-span-3 space-y-1">
                  <label class="block font-semibold text-slate-700">
                    Umpan Balik / Catatan Evaluasi
                  </label>
                  <input
                    v-model="gradeFeedback"
                    type="text"
                    placeholder="mis. Analisis arsitektur sangat baik, kode rapi dan modular."
                    class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal text-xs"
                  />
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  @click="editingSubmissionId = null"
                  class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  @click="handleSaveGrade(sub)"
                  :disabled="isGrading"
                  class="px-4 py-1.5 rounded-xl bg-scholarly-teal hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {{ isGrading ? 'Menyimpan...' : 'Simpan Nilai' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-xl bg-academic-navy hover:bg-blue-900 text-white text-xs font-semibold font-jakarta transition"
        >
          Selesai
        </button>
      </div>
    </div>
  </div>
</template>
