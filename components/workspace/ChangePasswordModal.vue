<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const isLoading = ref(false)

// 7 Akun Demo Resmi Terproteksi
const PROTECTED_DEMO_EMAILS = [
  'admin@wakanda.ac.id',
  'shuri@lecturer.wakanda.ac.id',
  'tchalla@lecturer.wakanda.ac.id',
  'nakia@student.wakanda.ac.id',
  'mbaku@student.wakanda.ac.id',
  'erik@student.wakanda.ac.id',
  'riri@student.wakanda.ac.id'
]

const isDemoAccount = computed(() => {
  const email = authStore.user?.email?.trim().toLowerCase()
  return email ? PROTECTED_DEMO_EMAILS.includes(email) : false
})

watch(() => props.isOpen, (open) => {
  if (open) {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showCurrent.value = false
    showNew.value = false
    showConfirm.value = false
    errorMessage.value = null
    successMessage.value = null
  }
})

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  errorMessage.value = null
  successMessage.value = null

  if (isDemoAccount.value) {
    errorMessage.value = 'Akun demo institusional dilindungi. Kredensial tidak dapat diubah demi kelancaran simulasi.'
    return
  }

  if (!currentPassword.value) {
    errorMessage.value = 'Kata sandi saat ini wajib diisi.'
    return
  }

  if (!newPassword.value) {
    errorMessage.value = 'Kata sandi baru wajib diisi.'
    return
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Kata sandi baru minimal 6 karakter.'
    return
  }

  if (newPassword.value === currentPassword.value) {
    errorMessage.value = 'Kata sandi baru harus berbeda dari kata sandi saat ini.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.'
    return
  }

  isLoading.value = true
  try {
    const res = await authStore.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    successMessage.value = res?.message || 'Kata sandi berhasil diperbarui.'
    emit('success')
    setTimeout(() => {
      handleClose()
    }, 1200)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none"
      @click.self="handleClose"
    >
      <div class="max-w-md w-full bg-white border border-slate-200 rounded-sm shadow-2xl overflow-hidden font-inter text-slate-800">
        <!-- Header Modal -->
        <div class="px-5 py-4 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between text-white">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-sm bg-[#1E3A8A] border border-teal-500/40 flex items-center justify-center font-mono font-bold text-xs text-white">
              ITW
            </div>
            <div>
              <h3 class="text-sm font-extrabold font-jakarta tracking-tight">Ubah Kata Sandi Mandiri</h3>
              <p class="text-[10px] font-mono text-teal-400">Keamanan Kredensial Akun Civitas</p>
            </div>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="text-slate-400 hover:text-white p-1 rounded-sm hover:bg-slate-800 transition"
            aria-label="Tutup modal"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-5 space-y-4 text-xs">
          <!-- Banner Proteksi untuk Akun Demo Resmi ITW -->
          <div
            v-if="isDemoAccount"
            class="p-3.5 bg-amber-50 border border-amber-200 rounded-sm space-y-1.5"
          >
            <div class="flex items-center gap-1.5 text-amber-800 font-bold font-mono text-[11px] uppercase tracking-wider">
              <!-- Monochrome line-art SVG lock icon -->
              <svg class="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>AKUN DEMO TERPROTEKSI</span>
            </div>
            <p class="text-amber-900 text-[11px] leading-relaxed">
              Anda sedang masuk menggunakan <strong>Akun Demo Resmi ITW</strong> (<span class="font-mono text-slate-700">{{ authStore.user?.email }}</span>). Kredensial akun ini dilindungi oleh <em>Protected Demo Account Guard</em> pada kata sandi default <code class="font-mono font-bold text-amber-900">Password123!</code> agar simulasi 1-klik login bagi seluruh penguji tidak pernah terganggu.
            </p>
          </div>

          <!-- Alert Error / Success -->
          <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-sm text-[11px] flex items-start gap-2">
            <span class="font-bold text-red-600 shrink-0">⨉</span>
            <span>{{ errorMessage }}</span>
          </div>

          <div v-if="successMessage" class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-sm text-[11px] flex items-start gap-2">
            <span class="font-bold text-emerald-600 shrink-0">✓</span>
            <span>{{ successMessage }}</span>
          </div>

          <!-- Input Fields (Hanya jika bukan demo account) -->
          <form v-if="!isDemoAccount" @submit.prevent="handleSubmit" class="space-y-3.5">
            <!-- Current Password -->
            <div class="space-y-1">
              <label for="currentPassword" class="block font-bold text-slate-700 uppercase font-mono text-[10px] tracking-wider">
                Kata Sandi Saat Ini
              </label>
              <div class="relative">
                <input
                  id="currentPassword"
                  v-model="currentPassword"
                  :type="showCurrent ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Masukkan kata sandi lama Anda"
                  class="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]"
                  required
                />
                <button
                  type="button"
                  @click="showCurrent = !showCurrent"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <span class="text-[10px] font-mono">{{ showCurrent ? 'SEMBUNYIKAN' : 'LIHAT' }}</span>
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div class="space-y-1">
              <label for="newPassword" class="block font-bold text-slate-700 uppercase font-mono text-[10px] tracking-wider">
                Kata Sandi Baru (Min. 6 Karakter)
              </label>
              <div class="relative">
                <input
                  id="newPassword"
                  v-model="newPassword"
                  :type="showNew ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Minimal 6 karakter"
                  class="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]"
                  required
                />
                <button
                  type="button"
                  @click="showNew = !showNew"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <span class="text-[10px] font-mono">{{ showNew ? 'SEMBUNYIKAN' : 'LIHAT' }}</span>
                </button>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="space-y-1">
              <label for="confirmPassword" class="block font-bold text-slate-700 uppercase font-mono text-[10px] tracking-wider">
                Konfirmasi Kata Sandi Baru
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  :type="showConfirm ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Ulangi kata sandi baru"
                  class="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]"
                  required
                />
                <button
                  type="button"
                  @click="showConfirm = !showConfirm"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <span class="text-[10px] font-mono">{{ showConfirm ? 'SEMBUNYIKAN' : 'LIHAT' }}</span>
                </button>
              </div>
            </div>

            <!-- Footer Action Buttons -->
            <div class="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="handleClose"
                class="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-jakarta font-semibold text-xs rounded-sm transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-jakarta font-bold text-xs rounded-sm transition flex items-center gap-1.5 disabled:opacity-60"
              >
                <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ isLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi' }}</span>
              </button>
            </div>
          </form>

          <!-- Action Jika Akun Demo -->
          <div v-else class="pt-2 flex justify-end">
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-jakarta font-semibold text-xs rounded-sm transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
