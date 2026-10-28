<script setup lang="ts">
import { ref } from 'vue'
import { useAssignmentStore } from '~/stores/useAssignmentStore'

const props = defineProps<{
  isOpen: boolean
  classId: string
  sessionId?: string | null
  sessionNumber?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const assignmentStore = useAssignmentStore()

// State Form
const title = ref('')
const description = ref('')
const instructions = ref('')
const maxScore = ref(100)
const dueDate = ref('')
const cutoffDate = ref('')
const allowLateSubmission = ref(true)
const latePenaltyPercentage = ref(10)
const allowedFileTypes = ref('pdf,zip')
const maxFileSizeMb = ref(10)

const formError = ref<string | null>(null)
const isSubmitting = ref(false)

// Set default due date to 7 days from now, and cutoff date to 10 days from now
const initDefaultDates = () => {
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const cutoff = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)

  dueDate.value = nextWeek.toISOString().slice(0, 16)
  cutoffDate.value = cutoff.toISOString().slice(0, 16)
}

initDefaultDates()

const handleSubmit = async () => {
  formError.value = null

  if (!title.value.trim()) {
    formError.value = 'Judul tugas wajib diisi'
    return
  }

  if (!dueDate.value) {
    formError.value = 'Batas waktu normal (due date) wajib diisi'
    return
  }

  if (cutoffDate.value) {
    const dueTime = new Date(dueDate.value).getTime()
    const cutoffTime = new Date(cutoffDate.value).getTime()
    if (cutoffTime < dueTime) {
      formError.value = 'Batas penutupan akses (cutoff date) tidak boleh lebih awal dari due date'
      return
    }
  }

  isSubmitting.value = true
  try {
    await assignmentStore.createAssignment({
      classId: props.classId,
      sessionId: props.sessionId,
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      instructions: instructions.value.trim() || undefined,
      maxScore: Number(maxScore.value) || 100,
      dueDate: new Date(dueDate.value).toISOString(),
      cutoffDate: cutoffDate.value ? new Date(cutoffDate.value).toISOString() : undefined,
      allowLateSubmission: allowLateSubmission.value,
      latePenaltyPercentage: allowLateSubmission.value ? Number(latePenaltyPercentage.value) || 0 : 0,
      allowedFileTypes: allowedFileTypes.value.trim() || 'pdf,zip',
      maxFileSizeMb: Number(maxFileSizeMb.value) || 10,
      isPublished: true
    })

    emit('created')
    emit('close')
  } catch (err: any) {
    formError.value = err.message || 'Gagal membuat tugas'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-xs transition-opacity"
    @click.self="emit('close')"
  >
    <div class="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="bg-academic-navy text-white p-5 flex items-center justify-between shrink-0">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-bold">
            Penugasan Kuliah • Pertemuan {{ sessionNumber || '-' }}
          </span>
          <h3 class="text-base font-bold font-jakarta">
            Buat Tugas Baru Sesi Perkuliahan
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

      <!-- Error Alert -->
      <div v-if="formError" class="p-3 bg-red-50 text-semantic-danger text-xs border-b border-red-200 font-inter">
        {{ formError }}
      </div>

      <!-- Form Content -->
      <form @submit.prevent="handleSubmit" class="overflow-y-auto p-6 space-y-4 text-xs font-inter flex-1">
        <!-- Judul Tugas -->
        <div class="space-y-1.5">
          <label class="block font-semibold text-slate-700 font-jakarta">
            Judul Tugas <span class="text-semantic-danger">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            required
            placeholder="mis. Tugas 1: Implementasi Repository Pattern & Drizzle ORM"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-inter text-xs"
          />
        </div>

        <!-- Deskripsi Singkat -->
        <div class="space-y-1.5">
          <label class="block font-semibold text-slate-700 font-jakarta">
            Ringkasan & Deskripsi Singkat
          </label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Ringkasan tujuan pengerjaan tugas perkuliahan..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-inter text-xs"
          ></textarea>
        </div>

        <!-- Petunjuk Pengerjaan -->
        <div class="space-y-1.5">
          <label class="block font-semibold text-slate-700 font-jakarta">
            Petunjuk & Ketentuan Pengerjaan (Instructions)
          </label>
          <textarea
            v-model="instructions"
            rows="3"
            placeholder="Ketentuan pengumpulan format PDF / ZIP, struktur penamaan file, dll..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-inter text-xs"
          ></textarea>
        </div>

        <!-- Batas Waktu Grid (Due Date & Cutoff Date) -->
        <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
          <div class="flex items-center gap-1.5 text-amber-800 font-bold font-jakarta">
            <span>⏰</span>
            <span>Konfigurasi Batas Waktu & Penutupan Pengumpulan</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="block font-semibold text-slate-700">
                Batas Waktu Normal (due_date) <span class="text-semantic-danger">*</span>
              </label>
              <input
                v-model="dueDate"
                type="datetime-local"
                required
                class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-mono text-[11px]"
              />
              <span class="text-[10px] text-slate-500 block">Status: "Tepat Waktu" (#16A34A)</span>
            </div>

            <div class="space-y-1">
              <label class="block font-semibold text-slate-700">
                Batas Akhir Akses (cutoff_date)
              </label>
              <input
                v-model="cutoffDate"
                type="datetime-local"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-mono text-[11px]"
              />
              <span class="text-[10px] text-slate-500 block">Status: "Terlambat" (#DC2626) hingga penutupan</span>
            </div>
          </div>

          <p class="text-[10px] text-slate-500 font-inter">
            Setelah melewati batas <strong>cutoff_date</strong>, sistem secara otomatis menolak seluruh berkas unggahan menggunakan <em>Strict Server-Side Timestamp Validation</em>.
          </p>
        </div>

        <!-- Nilai & Toleransi Terlambat -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block font-semibold text-slate-700 font-jakarta">
              Nilai Maksimal
            </label>
            <input
              v-model.number="maxScore"
              type="number"
              min="1"
              max="1000"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-mono text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block font-semibold text-slate-700 font-jakarta">
              Penalti Keterlambatan (%)
            </label>
            <input
              v-model.number="latePenaltyPercentage"
              type="number"
              min="0"
              max="100"
              :disabled="!allowLateSubmission"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-mono text-xs disabled:bg-slate-100"
            />
          </div>
        </div>

        <!-- Format File & Ukuran Maksimal -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block font-semibold text-slate-700 font-jakarta">
              Format Berkas Diizinkan
            </label>
            <input
              v-model="allowedFileTypes"
              type="text"
              placeholder="pdf,zip"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-mono text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block font-semibold text-slate-700 font-jakarta">
              Maksimal Ukuran (MB)
            </label>
            <input
              v-model.number="maxFileSizeMb"
              type="number"
              min="1"
              max="100"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-mono text-xs"
            />
          </div>
        </div>

        <!-- Checkbox Allow Late Submission -->
        <div class="flex items-center gap-2 pt-1">
          <input
            id="allowLate"
            v-model="allowLateSubmission"
            type="checkbox"
            class="w-4 h-4 text-scholarly-teal rounded border-slate-300 focus:ring-scholarly-teal"
          />
          <label for="allowLate" class="text-slate-700 font-medium cursor-pointer">
            Izinkan pengumpulan tugas terlambat sebelum batas cutoff_date
          </label>
        </div>

        <!-- Footer Buttons -->
        <div class="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold font-jakarta transition"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2 rounded-xl bg-scholarly-teal hover:bg-teal-700 text-white font-semibold font-jakarta shadow-xs transition flex items-center gap-2 disabled:opacity-50"
          >
            <svg v-if="isSubmitting" class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Simpan Tugas</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
