<script setup lang="ts">
import type { AttendanceTokenDto } from '~/types'

const props = defineProps<{
  isOpen: boolean
  token: AttendanceTokenDto | null
  sessionNumber: number
  sessionTitle?: string
  remainingFormatted: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div
    v-if="isOpen && token"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-xs transition-opacity"
    @click.self="emit('close')"
  >
    <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="bg-academic-navy text-white p-4 flex items-center justify-between">
        <div class="space-y-0.5">
          <span class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-bold">
            Presensi Sesi {{ sessionNumber }}
          </span>
          <h3 class="text-sm font-bold font-jakarta line-clamp-1">
            {{ sessionTitle || `Pertemuan #${sessionNumber}` }}
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

      <!-- Body / QR Display -->
      <div class="p-6 text-center space-y-4 bg-alabaster-slate">
        <div class="space-y-1">
          <p class="text-xs text-slate-600 font-inter">
            Pindai QR Code melalui smartphone atau masukkan PIN 6-digit di bawah ini:
          </p>
        </div>

        <!-- Dynamic QR Code Image -->
        <div class="flex justify-center">
          <div class="p-3 bg-white rounded-2xl border-2 border-teal-500 shadow-md inline-block">
            <img
              v-if="token.qrCodeDataUrl"
              :src="token.qrCodeDataUrl"
              alt="Dynamic QR Code Presensi"
              class="w-56 h-56 object-contain rounded-xl"
            />
            <div v-else class="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 text-xs">
              Menghasilkan QR Code...
            </div>
          </div>
        </div>

        <!-- 6-Digit PIN in JetBrains Mono -->
        <div class="space-y-1">
          <span class="text-[11px] font-medium text-slate-500 font-inter">KODE PIN PRESENSI</span>
          <div class="py-2.5 px-4 bg-white rounded-xl border border-teal-300 font-mono text-3xl font-black text-academic-navy tracking-widest shadow-inner inline-block min-w-[200px]">
            {{ token.formattedToken }}
          </div>
        </div>

        <!-- Timer Countdown -->
        <div class="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-alert bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200">
          <span>⏳ Sisa Waktu Berlaku:</span>
          <span class="text-sm font-black">{{ remainingFormatted }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-3 bg-white border-t border-slate-200 flex justify-end">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-jakarta transition"
        >
          Tutup Layar Penuh
        </button>
      </div>
    </div>
  </div>
</template>
