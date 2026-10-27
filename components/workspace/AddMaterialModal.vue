<script setup lang="ts">
import { ref } from 'vue'
import type { SessionMaterialType, ApiResponse, PresignedUploadResponseDto } from '~/types'

const props = defineProps<{
  isOpen: boolean
  sessionId: string
  sessionNumber: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

// State Formulir
const title = ref('')
const materialType = ref<SessionMaterialType>('SLIDE')
const description = ref('')
const externalUrl = ref('')
const selectedFile = ref<File | null>(null)
const uploadProgress = ref<string | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const handleSubmit = async () => {
  errorMessage.value = null
  uploadProgress.value = null

  if (!title.value.trim()) {
    errorMessage.value = 'Judul materi wajib diisi.'
    return
  }

  isSubmitting.value = true

  try {
    let fileKey: string | undefined
    let fileUrl: string | undefined
    let fileName: string | undefined
    let fileSize: number | undefined

    // 1. Jika ada berkas PDF / ZIP yang diunggah
    if (selectedFile.value) {
      uploadProgress.value = 'Menghubungkan ke layanan penyimpanan objek...'
      const file = selectedFile.value

      // Minta Presigned Upload URL ke backend
      const presignedRes = await $fetch<ApiResponse<PresignedUploadResponseDto>>('/api/storage/presigned', {
        method: 'POST',
        body: {
          fileName: file.name,
          fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/zip'),
          fileSize: file.size,
          category: 'materials'
        }
      })

      if (!presignedRes.success || !presignedRes.data) {
        throw new Error(presignedRes.message || 'Gagal membuat presigned upload URL')
      }

      uploadProgress.value = `Mengunggah berkas (${(file.size / 1024).toFixed(0)} KB)...`

      // Upload langsung ke Presigned URL (R2 PUT atau Fallback Lokal PUT)
      await $fetch(presignedRes.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      })

      fileKey = presignedRes.data.fileKey
      fileUrl = presignedRes.data.signedReadUrl
      fileName = file.name
      fileSize = file.size
    }

    uploadProgress.value = 'Menyimpan metadata materi perkuliahan...'

    // 2. Simpan materi ke API /api/sessions/:sessionId/materials
    await $fetch(`/api/sessions/${props.sessionId}/materials`, {
      method: 'POST',
      body: {
        title: title.value.trim(),
        materialType: materialType.value,
        description: description.value.trim() || undefined,
        externalUrl: externalUrl.value.trim() || undefined,
        fileKey,
        fileUrl,
        fileName,
        fileSize
      }
    })

    // Reset formulir
    title.value = ''
    materialType.value = 'SLIDE'
    description.value = ''
    externalUrl.value = ''
    selectedFile.value = null
    uploadProgress.value = null

    emit('created')
    emit('close')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string; message?: string } }
    errorMessage.value = fetchErr.data?.statusMessage || fetchErr.data?.message || (err instanceof Error ? err.message : 'Gagal menyimpan materi')
  } finally {
    isSubmitting.value = false
    uploadProgress.value = null
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-deep-ink/60 backdrop-blur-xs">
    <div class="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header Modal -->
      <div class="px-6 py-4 bg-academic-navy text-white flex items-center justify-between shrink-0">
        <div>
          <h3 class="text-sm font-bold font-jakarta">Tambah Materi Pembelajaran Sesi {{ sessionNumber }}</h3>
          <p class="text-[11px] text-slate-300 font-inter">Distribusi Bahan Ajar Perkuliahan Resmi ITW</p>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 overflow-y-auto text-xs font-inter">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-50 border border-red-200 text-semantic-danger font-medium">
          {{ errorMessage }}
        </div>

        <!-- Progress Alert -->
        <div v-if="uploadProgress" class="p-3 rounded-xl bg-teal-50 border border-teal-200 text-scholarly-teal font-medium flex items-center gap-2">
          <div class="w-4 h-4 border-2 border-scholarly-teal border-t-transparent rounded-full animate-spin"></div>
          <span>{{ uploadProgress }}</span>
        </div>

        <!-- Judul Materi -->
        <div>
          <label class="block font-semibold text-slate-700 mb-1 font-jakarta">Judul Materi Pembelajaran *</label>
          <input
            v-model="title"
            type="text"
            required
            placeholder="mis. Slide Kuliah: Arsitektur Sistem Informasi Modern"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal text-xs"
          />
        </div>

        <!-- Tipe Materi -->
        <div>
          <label class="block font-semibold text-slate-700 mb-1 font-jakarta">Tipe Materi *</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              @click="materialType = 'SLIDE'"
              class="py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1"
              :class="materialType === 'SLIDE' ? 'bg-teal-50 border-scholarly-teal text-scholarly-teal font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              <span>📑 Slide PDF</span>
            </button>

            <button
              type="button"
              @click="materialType = 'CODE'"
              class="py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1"
              :class="materialType === 'CODE' ? 'bg-teal-50 border-scholarly-teal text-scholarly-teal font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              <span>💻 Kode Sumber</span>
            </button>

            <button
              type="button"
              @click="materialType = 'VIDEO'"
              class="py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1"
              :class="materialType === 'VIDEO' ? 'bg-teal-50 border-scholarly-teal text-scholarly-teal font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              <span>🎥 Video Kuliah</span>
            </button>

            <button
              type="button"
              @click="materialType = 'DOCUMENT'"
              class="py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1"
              :class="materialType === 'DOCUMENT' ? 'bg-teal-50 border-scholarly-teal text-scholarly-teal font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              <span>📖 Handout / Doc</span>
            </button>
          </div>
        </div>

        <!-- Unggah Berkas PDF / ZIP (jika tipe Slide, Code, atau Document) -->
        <div v-if="materialType !== 'VIDEO'" class="space-y-1">
          <label class="block font-semibold text-slate-700 mb-1 font-jakarta">
            Unggah Berkas (PDF / ZIP maks 25MB)
          </label>
          <div class="p-3 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/60 hover:bg-slate-50 transition text-center">
            <input
              type="file"
              accept=".pdf,.zip,application/pdf,application/zip"
              @change="handleFileChange"
              class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-scholarly-teal file:text-white hover:file:bg-teal-700 cursor-pointer"
            />
            <p v-if="selectedFile" class="text-[11px] text-teal-700 font-mono mt-2 font-semibold">
              Terpilih: {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(0) }} KB)
            </p>
          </div>
        </div>

        <!-- Tautan Video / Repositori Eksternal -->
        <div>
          <label class="block font-semibold text-slate-700 mb-1 font-jakarta">
            {{ materialType === 'VIDEO' ? 'Tautan Video Pembelajaran (YouTube / Loom / Drive) *' : 'Tautan Eksternal (Opsional, mis. GitHub URL)' }}
          </label>
          <input
            v-model="externalUrl"
            type="url"
            :required="materialType === 'VIDEO'"
            placeholder="https://..."
            class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal text-xs font-mono"
          />
        </div>

        <!-- Deskripsi Materi -->
        <div>
          <label class="block font-semibold text-slate-700 mb-1 font-jakarta">Deskripsi / Petunjuk Belajar</label>
          <textarea
            v-model="description"
            rows="3"
            placeholder="Petunjuk pengerjaan praktikum atau ringkasan kompetensi yang ingin dicapai..."
            class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal text-xs"
          ></textarea>
        </div>

        <!-- Action Buttons -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="emit('close')"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition font-jakarta"
          >
            Batal
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2 rounded-xl bg-academic-navy hover:bg-blue-900 text-white font-semibold transition flex items-center gap-2 shadow-xs font-jakarta disabled:opacity-50"
          >
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Materi Sesi' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
