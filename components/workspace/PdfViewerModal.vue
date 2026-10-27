<script setup lang="ts">
defineProps<{
  isOpen: boolean
  title: string
  pdfUrl: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-deep-ink/60 backdrop-blur-xs">
    <div class="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh]">
      <!-- Header Pratinjau -->
      <div class="px-6 py-4 bg-academic-navy text-white flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-3 truncate">
          <div class="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
            📄
          </div>
          <div class="truncate">
            <h3 class="text-sm font-bold font-jakarta truncate">{{ title }}</h3>
            <p class="text-[11px] text-slate-300 font-inter">Pratinjau Dokumen PDF Resmi Akademik ITW</p>
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            @click="emit('close')"
            class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
            title="Tutup Pratinjau"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Area Tampilan PDF Embedded (In-App Previewer) -->
      <div class="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden relative">
        <iframe
          v-if="pdfUrl"
          :src="pdfUrl"
          class="w-full h-full rounded-2xl border border-slate-300 shadow-inner bg-white"
          title="Pratinjau Dokumen PDF"
        ></iframe>
        <div v-else class="flex items-center justify-center h-full text-slate-400 font-inter text-xs">
          Memuat berkas PDF...
        </div>
      </div>

      <!-- Footer Pratinjau -->
      <div class="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-inter shrink-0">
        <span class="font-mono text-[11px]">Mode Pratinjau Langsung (In-App PDF Viewer)</span>
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition font-jakarta"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
