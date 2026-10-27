<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/useAuthStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State Formulir
const email = ref('admin.akademik@itw.ac.id')
const password = ref('AdminWakanda2026!')
const showPassword = ref(false)
const selectedPreset = ref<'admin' | 'lecturer' | 'student'>('admin')
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Cek apakah ada pesan redirect dari middleware
onMounted(async () => {
  if (route.query.error === 'auth_required') {
    errorMessage.value = 'Silakan login terlebih dahulu untuk mengakses Wakanda Academic Space.'
  } else if (route.query.error === 'login_required') {
    errorMessage.value = 'Sesi Anda telah kedaluwarsa atau belum terautentikasi.'
  }

  // Jika sudah terautentikasi, langsung arahkan ke workspace
  if (authStore.isAuthenticated) {
    router.push((route.query.redirect as string) || '/')
  }
})

// Quick Fill Kredensial Sampel Seeded
const applyPreset = (role: 'admin' | 'lecturer' | 'student') => {
  selectedPreset.value = role
  errorMessage.value = null
  successMessage.value = null

  if (role === 'admin') {
    email.value = 'admin.akademik@itw.ac.id'
    password.value = 'AdminWakanda2026!'
  } else if (role === 'lecturer') {
    email.value = 'tchalla.dosen@itw.ac.id'
    password.value = 'DosenWakanda2026!'
  } else {
    email.value = 'okoye.mhs@mhs.itw.ac.id'
    password.value = 'MhsWakanda2026!'
  }
}

// Proses Submit Login
const handleSubmit = async () => {
  errorMessage.value = null
  successMessage.value = null

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Mohon isi email dan kata sandi Anda.'
    return
  }

  try {
    const user = await authStore.login({
      email: email.value.trim(),
      password: password.value
    })

    successMessage.value = `Selamat datang kembali, ${user.name}! Mengalihkan ke Academic Workspace...`

    const redirectPath = (route.query.redirect as string) || '/'
    setTimeout(() => {
      router.push(redirectPath)
    }, 600)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Terjadi kegagalan saat proses login.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-alabaster-slate text-deep-ink flex flex-col justify-between selection:bg-scholarly-teal/20 selection:text-scholarly-teal">
    <!-- Navbar Minimalis -->
    <header class="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-academic-navy text-white flex items-center justify-center font-extrabold text-lg shadow-sm font-mono tracking-wider">
            ITW
          </div>
          <div>
            <span class="text-base font-bold text-academic-navy tracking-tight font-jakarta block leading-tight">
              Institut Teknologi Wakanda
            </span>
            <span class="text-xs text-slate-500 font-inter block">
              Wakanda Academic Space (WAS)
            </span>
          </div>
        </div>

        <div class="hidden sm:flex items-center space-x-3 text-xs font-inter text-slate-600">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Semester Ganjil 2026/2027
          </span>
        </div>
      </div>
    </header>

    <!-- Konten Utama Login -->
    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
      <div class="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <!-- Kolom Kiri: Branding & Informasi Akademik (5 kolom di desktop) -->
        <div class="lg:col-span-5 bg-gradient-to-br from-academic-navy via-blue-900 to-deep-ink rounded-3xl p-8 sm:p-10 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
          <!-- Dekorasi Latar Belakang -->
          <div class="absolute -top-16 -right-16 w-48 h-48 bg-scholarly-teal/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-20 -left-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Bagian Atas -->
          <div class="relative z-10 space-y-6">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-teal-200">
              <span class="w-2 h-2 rounded-full bg-scholarly-teal"></span>
              <span>Sistem Pembelajaran Terintegrasi</span>
            </div>

            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight font-jakarta leading-tight">
              Kecemerlangan Akademik Masa Depan.
            </h1>

            <p class="text-slate-300 font-serif text-base sm:text-lg leading-relaxed">
              Platform terpadu Institut Teknologi Wakanda untuk kurikulum 16 pertemuan, pemantauan presensi token cerdas, dan penilaian terstandarisasi.
            </p>
          </div>

          <!-- Bagian Fitur Unggulan -->
          <div class="relative z-10 my-8 space-y-3.5">
            <div class="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <div class="w-5 h-5 rounded-full bg-scholarly-teal/30 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ✓
              </div>
              <p>Struktur kurikulum 16 Sesi Pertemuan dengan UTS & UAS otomatis.</p>
            </div>
            <div class="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <div class="w-5 h-5 rounded-full bg-scholarly-teal/30 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ✓
              </div>
              <p>Sistem Presensi Token Dinamis dengan batas waktu toleransi.</p>
            </div>
            <div class="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <div class="w-5 h-5 rounded-full bg-scholarly-teal/30 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ✓
              </div>
              <p>Komposisi Bobot Nilai 100% dan transparansi evaluasi perkuliahan.</p>
            </div>
          </div>

          <!-- Bagian Bawah: Keamanan & Status -->
          <div class="relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-300/80 font-mono flex items-center justify-between">
            <span>Clean Architecture • Nitro RBAC</span>
            <span class="text-emerald-400">PostgreSQL Neon Active</span>
          </div>
        </div>

        <!-- Kolom Kanan: Card Form Login (7 kolom di desktop) -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200/90 flex flex-col justify-between">
          <div>
            <!-- Form Header -->
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-2xl font-bold text-academic-navy font-jakarta">Masuk ke Akun Anda</h2>
                <p class="text-sm text-slate-500 font-inter mt-1">
                  Gunakan kredensial resmi civitas akademika ITW
                </p>
              </div>
              <div class="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <!-- Quick Account Switcher Buttons -->
            <div class="mb-6 p-3 rounded-2xl bg-alabaster-slate border border-slate-200">
              <span class="text-xs font-semibold text-slate-600 font-inter block mb-2">
                Pilih Preset Akun Percobaan (Seeded DB):
              </span>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="applyPreset('admin')"
                  class="py-2 px-2.5 rounded-xl text-xs font-medium font-inter transition border text-center flex flex-col items-center gap-0.5"
                  :class="selectedPreset === 'admin' ? 'bg-academic-navy text-white border-academic-navy shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
                >
                  <span class="font-bold">Admin</span>
                  <span class="text-[10px] opacity-80 font-mono">Biro Akademik</span>
                </button>

                <button
                  type="button"
                  @click="applyPreset('lecturer')"
                  class="py-2 px-2.5 rounded-xl text-xs font-medium font-inter transition border text-center flex flex-col items-center gap-0.5"
                  :class="selectedPreset === 'lecturer' ? 'bg-scholarly-teal text-white border-scholarly-teal shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
                >
                  <span class="font-bold">Dosen</span>
                  <span class="text-[10px] opacity-80 font-mono">Dr. T'Challa</span>
                </button>

                <button
                  type="button"
                  @click="applyPreset('student')"
                  class="py-2 px-2.5 rounded-xl text-xs font-medium font-inter transition border text-center flex flex-col items-center gap-0.5"
                  :class="selectedPreset === 'student' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
                >
                  <span class="font-bold">Mahasiswa</span>
                  <span class="text-[10px] opacity-80 font-mono">Okoye Mhs</span>
                </button>
              </div>
            </div>

            <!-- Alert Pesan Sukses / Error -->
            <div
              v-if="errorMessage"
              class="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-semantic-danger text-xs font-medium font-inter flex items-start gap-2.5"
            >
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>

            <div
              v-if="successMessage"
              class="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-semantic-success text-xs font-medium font-inter flex items-start gap-2.5"
            >
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ successMessage }}</span>
            </div>

            <!-- Form Inputs -->
            <form @submit.prevent="handleSubmit" class="space-y-4 font-inter text-sm">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5 font-jakarta">
                  Email Civitas ITW
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    v-model="email"
                    type="email"
                    required
                    autocomplete="username"
                    placeholder="nama@itw.ac.id"
                    class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal focus:border-transparent text-sm transition"
                  />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-semibold text-slate-700 font-jakarta">
                    Kata Sandi
                  </label>
                  <span class="text-[11px] text-slate-400 font-inter">Kunci Rahasia Sesi</span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    autocomplete="current-password"
                    placeholder="••••••••••••"
                    class="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal focus:border-transparent text-sm transition"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="pt-2">
                <button
                  type="submit"
                  :disabled="authStore.isLoading"
                  class="w-full py-3 px-4 rounded-xl bg-academic-navy hover:bg-blue-900 transition text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 font-jakarta"
                >
                  <span v-if="authStore.isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{{ authStore.isLoading ? 'Memverifikasi Sesi...' : 'Masuk ke Academic Workspace' }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Footer / Security Note -->
          <div class="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-inter">
            <span>Wakanda Academic Space v1.0</span>
            <NuxtLink to="/" class="text-scholarly-teal hover:underline font-medium">
              Buka Beranda Tamu →
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer Copyright -->
    <footer class="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500 font-inter">
      <div class="max-w-7xl mx-auto px-4">
        &copy; 2026 Institut Teknologi Wakanda. Seluruh Hak Cipta Dilindungi Undang-Undang. Arsitektur Bersih & Sistem Manajemen Pembelajaran Terpadu.
      </div>
    </footer>
  </div>
</template>
