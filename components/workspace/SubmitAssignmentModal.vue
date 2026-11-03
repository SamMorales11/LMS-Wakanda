<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AssignmentDto, SubmissionDto } from '~/types'
import { useAssignmentStore } from '~/stores/useAssignmentStore'

const props = defineProps<{
  isOpen: boolean
  assignment: AssignmentDto | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted', submission: SubmissionDto): void
}>()

const assignmentStore = useAssignmentStore()

const selectedFile = ref<File | null>(null)
const notes = ref('')
const formError = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const isUploading = ref(false)

// Status Evaluasi Batas Waktu Server Real-time
const nowMs = Date.now()
const isCutoffPassed = computed(() => {
  if (!props.assignment?.cutoffDate) return false
  return nowMs > new Date(props.assignment.cutoffDate).getTime()
})

const isPastDueDate = computed(() => {
  if (!props.assignment?.dueDate) return false
  return nowMs > new Date(props.assignment.dueDate).getTime()
})

const formatDateTime = (isoStr?: string | null) => {
  if (!isoStr) return '-'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('id-ID', {
      weekday: 'short',
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

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const allowed = (props.assignment?.allowedFileTypes || 'pdf,zip').split(',').map(s => s.trim().toLowerCase())

    if (!allowed.includes(ext)) {
      formError.value = `Berkas .${ext} tidak diizinkan. Hanya menerima format: ${allowed.join(', ').toUpperCase()}`
      selectedFile.value = null
      return
    }

    const maxMb = props.assignment?.maxFileSizeMb || 10
    if (file.size > maxMb * 1024 * 1024) {
      formError.value = `Ukuran berkas (${(file.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimal ${maxMb} MB`
      selectedFile.value = null
      return
    }

    formError.value = null
    selectedFile.value = file
  }
}

const handleUploadAndSubmit = async () => {
  if (!props.assignment) return
  if (!selectedFile.value) {
    formError.value = 'Silakan pilih berkas PDF atau ZIP tugas terlebih dahulu'
    return
  }

  formError.value = null
  successMessage.value = null
  isUploading.value = true

  try {
    const submission = await assignmentStore.submitAssignmentFile(
      props.assignment.id,
      selectedFile.value,
      notes.value.trim() || undefined
    )

    successMessage.value = submission.isLate
      ? `Tugas berhasil dikumpulkan dengan status TERLAMBAT (Tercatat pada server ${formatDateTime(submission.submittedAt)})`
      : `Tugas berhasil dikumpulkan TEPAT WAKTU! (Tercatat pada server ${formatDateTime(submission.submittedAt)})`

    emit('submitted', submission)
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err: any) {
    formError.value = err.message || 'Gagal mengumpulkan tugas'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen && assignment"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-xs transition-opacity"
    @click.self="emit('close')"
  >
    <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="bg-academic-navy text-white p-5 flex items-center justify-between shrink-0">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-bold">
            Pengumpulan Berkas Tugas Mahasiswa
          </span>
          <h3 class="text-sm sm:text-base font-bold font-jakarta line-clamp-1">
            {{ assignment.title }}
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

      <!-- Alert Box Status Batas Waktu -->
      <div class="p-4 border-b text-xs font-inter space-y-2">
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span class="text-slate-500 block">Batas Waktu Normal:</span>
            <span class="font-bold text-academic-navy font-mono block">{{ formatDateTime(assignment.dueDate) }}</span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span class="text-slate-500 block">Batas Akhir Cutoff:</span>
            <span class="font-bold text-amber-800 font-mono block">{{ formatDateTime(assignment.cutoffDate) || 'Tidak Dibatasi' }}</span>
          </div>
        </div>

        <!-- Strict Timestamp Status Indicator -->
        <div
          v-if="isCutoffPassed"
          class="p-3 rounded-xl bg-red-50 border border-red-200 text-semantic-danger flex items-center gap-2 font-medium"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span>Batas akhir penutupan (cutoff date) telah lewat. Pengunggahan berkas ditolak oleh server!</span>
        </div>

        <div
          v-else-if="isPastDueDate"
          class="p-3 rounded-xl bg-red-50 border border-red-200 text-semantic-danger flex items-center gap-2 font-medium"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>Batas waktu normal telah lewat. Pengumpulan Anda akan ditandai berstatus <strong>Terlambat (#DC2626)</strong>.</span>
        </div>

        <div
          v-else
          class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-semantic-success flex items-center gap-2 font-medium"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Pengumpulan dalam batas waktu normal akan ditandai berstatus <strong>Tepat Waktu (#16A34A)</strong>.</span>
        </div>
      </div>

      <!-- Feedback Messages -->
      <div v-if="successMessage" class="p-3 bg-emerald-50 text-semantic-success text-xs border-b border-emerald-200 font-inter">
        {{ successMessage }}
      </div>
      <div v-if="formError" class="p-3 bg-red-50 text-semantic-danger text-xs border-b border-red-200 font-inter">
        {{ formError }}
      </div>

      <!-- Upload Form -->
      <div class="p-6 space-y-4 overflow-y-auto text-xs font-inter flex-1">
        <!-- Informasi Petunjuk -->
        <div v-if="assignment.instructions" class="p-3 rounded-xl bg-alabaster-slate border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
          <strong class="text-slate-800 block mb-0.5">Petunjuk Dosen:</strong>
          <p>{{ assignment.instructions }}</p>
        </div>

        <!-- Area Drag & Drop / Input File -->
        <div class="space-y-1.5">
          <label class="block font-semibold text-slate-700 font-jakarta">
            Pilih Berkas Tugas (Format: {{ assignment.allowedFileTypes.toUpperCase() }}, Maks: {{ assignment.maxFileSizeMb }} MB)
          </label>
          <div
            class="border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer"
            :class="selectedFile ? 'border-scholarly-teal bg-teal-50/20' : 'border-slate-300 hover:border-scholarly-teal bg-alabaster-slate'"
          >
            <input
              type="file"
              :accept="`.${assignment.allowedFileTypes.split(',').join(',.')}`"
              :disabled="isCutoffPassed || isUploading"
              @change="handleFileChange"
              class="hidden"
              id="fileInput"
            />
            <label for="fileInput" class="cursor-pointer space-y-2 block">
              <div class="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <svg v-if="selectedFile" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 011.83-10.274 5.25 5.25 0 0110.66 0 5.25 5.25 0 011.83 10.274A4.5 4.5 0 0118.75 19.5H6.75z" />
                </svg>
              </div>
              <div v-if="selectedFile">
                <p class="font-bold text-academic-navy text-xs font-mono truncate max-w-xs mx-auto">
                  {{ selectedFile.name }}
                </p>
                <p class="text-[10px] text-slate-500 font-mono mt-0.5">
                  {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB • Klik untuk mengganti berkas
                </p>
              </div>
              <div v-else>
                <p class="font-bold text-slate-700 text-xs">Klik untuk memilih berkas tugas</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Mendukung format PDF atau arsip ZIP melalui Cloudflare R2 / S3</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Catatan Tambahan (Opsional) -->
        <div class="space-y-1.5">
          <label class="block font-semibold text-slate-700 font-jakarta">
            Catatan Tambahan / Tautan Repositori (Opsional)
          </label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="Catatan pengerjaan untuk dosen pengampu..."
            :disabled="isCutoffPassed || isUploading"
            class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal font-inter text-xs disabled:bg-slate-100"
          ></textarea>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs font-jakarta hover:bg-slate-100 transition"
        >
          Tutup
        </button>

        <button
          type="button"
          @click="handleUploadAndSubmit"
          :disabled="isCutoffPassed || isUploading || !selectedFile"
          class="px-5 py-2 rounded-xl text-white font-semibold text-xs font-jakarta transition shadow-xs flex items-center gap-2 disabled:opacity-50"
          :class="isPastDueDate ? 'bg-semantic-danger hover:bg-red-700' : 'bg-semantic-success hover:bg-green-700'"
        >
          <svg v-if="isUploading" class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span v-if="isUploading">Mengunggah ke Storage...</span>
          <span v-else-if="isPastDueDate">Kirim Tugas (Terlambat)</span>
          <span v-else>Kirim Tugas (Tepat Waktu)</span>
        </button>
      </div>
    </div>
  </div>
</template>
