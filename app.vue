<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import { useSystemStore } from '~/stores/useSystemStore'
import { useAuthStore } from '~/stores/useAuthStore'
import type { UserRole, ApiResponse } from '~/types'

const userStore = useUserStore()
const systemStore = useSystemStore()
const authStore = useAuthStore()

// Tab state
const activeTab = ref<'auth' | 'architecture' | 'users' | 'design'>('auth')

// Auth Form state
const loginEmail = ref('admin.akademik@itw.ac.id')
const loginPassword = ref('AdminWakanda2026!')
const loginMessage = ref<string | null>(null)
const loginError = ref<string | null>(null)

// RBAC Tester state
interface RbacTestResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  message: string
  data?: unknown
  timestamp: string
}
const rbacTestResult = ref<RbacTestResult | null>(null)
const isTestingRbac = ref(false)

// User Management Form state
const newUserName = ref('')
const newUserEmail = ref('')
const newUserNimNidn = ref('')
const newUserRole = ref<UserRole>('student')
const formMessage = ref<string | null>(null)
const formError = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([
    systemStore.checkHealth(),
    userStore.fetchUsers(),
    authStore.fetchUser()
  ])
})

// Quick Fill Sample Account
const setSampleAccount = (role: 'admin' | 'lecturer' | 'student') => {
  loginMessage.value = null
  loginError.value = null

  if (role === 'admin') {
    loginEmail.value = 'admin.akademik@itw.ac.id'
    loginPassword.value = 'AdminWakanda2026!'
  } else if (role === 'lecturer') {
    loginEmail.value = 'tchalla.dosen@itw.ac.id'
    loginPassword.value = 'DosenWakanda2026!'
  } else {
    loginEmail.value = 'okoye.mhs@mhs.itw.ac.id'
    loginPassword.value = 'MhsWakanda2026!'
  }
}

// Handle Login
const handleLogin = async () => {
  loginMessage.value = null
  loginError.value = null

  try {
    const user = await authStore.login({
      email: loginEmail.value.trim(),
      password: loginPassword.value
    })
    loginMessage.value = `Selamat datang, ${user.name}! Anda berhasil login sebagai [${user.role.toUpperCase()}].`
  } catch (err: unknown) {
    loginError.value = err instanceof Error ? err.message : 'Login gagal'
  }
}

// Handle Logout
const handleLogout = async () => {
  loginMessage.value = null
  loginError.value = null
  rbacTestResult.value = null
  await authStore.logout()
  loginMessage.value = 'Sesi telah berakhir. Anda berhasil keluar.'
}

// Test RBAC Endpoint
const testRbacEndpoint = async (endpoint: string) => {
  isTestingRbac.value = true
  rbacTestResult.value = null

  try {
    const res = await $fetch<ApiResponse<unknown>>(endpoint)
    rbacTestResult.value = {
      endpoint,
      method: 'GET',
      status: 200,
      success: true,
      message: res.message || 'Berhasil diakses',
      data: res.data,
      timestamp: new Date().toLocaleTimeString()
    }
  } catch (err: unknown) {
    const fetchErr = err as { statusCode?: number; status?: number; data?: { statusMessage?: string; message?: string } }
    const status = fetchErr.statusCode || fetchErr.status || 500
    const msg = fetchErr.data?.statusMessage || fetchErr.data?.message || (err instanceof Error ? err.message : 'Gagal mengakses')

    rbacTestResult.value = {
      endpoint,
      method: 'GET',
      status,
      success: false,
      message: msg,
      timestamp: new Date().toLocaleTimeString()
    }
  } finally {
    isTestingRbac.value = false
  }
}

// Handle Create User (Admin Only)
const handleCreateUser = async () => {
  formMessage.value = null
  formError.value = null

  if (!newUserName.value.trim() || !newUserEmail.value.trim()) {
    formError.value = 'Mohon isi nama dan email dengan lengkap'
    return
  }

  try {
    await userStore.createUser({
      name: newUserName.value.trim(),
      email: newUserEmail.value.trim(),
      role: newUserRole.value,
      nimNidn: newUserNimNidn.value.trim() || undefined
    })
    formMessage.value = `Pengguna "${newUserName.value}" berhasil disimpan ke database Neon!`
    newUserName.value = ''
    newUserEmail.value = ''
    newUserNimNidn.value = ''
    newUserRole.value = 'student'
    await systemStore.checkHealth()
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Gagal menambahkan pengguna'
  }
}

// PRD Color Palette Tokens
const colorTokens = [
  {
    name: 'Academic Navy',
    token: 'bg-academic-navy',
    hex: '#1E3A8A',
    role: 'Primary / Brand Leadership',
    textColor: 'text-white'
  },
  {
    name: 'Scholarly Teal',
    token: 'bg-scholarly-teal',
    hex: '#0D9488',
    role: 'Secondary / Wisdom & Focus',
    textColor: 'text-white'
  },
  {
    name: 'Alabaster Slate',
    token: 'bg-alabaster-slate',
    border: 'border border-slate-300',
    hex: '#F8FAFC',
    role: 'Background Canvas',
    textColor: 'text-deep-ink'
  },
  {
    name: 'Deep Ink',
    token: 'bg-deep-ink',
    hex: '#0F172A',
    role: 'Primary Text & Contrast',
    textColor: 'text-white'
  },
  {
    name: 'Amber Alert',
    token: 'bg-amber-alert',
    hex: '#D97706',
    role: 'Warning & High-Priority Notice',
    textColor: 'text-white'
  },
  {
    name: 'Semantic Success',
    token: 'bg-semantic-success',
    hex: '#16A34A',
    role: 'Positive Actions & Completed States',
    textColor: 'text-white'
  },
  {
    name: 'Semantic Danger',
    token: 'bg-semantic-danger',
    hex: '#DC2626',
    role: 'Destructive Actions & Critical Errors',
    textColor: 'text-white'
  }
]

// PRD Typography Tokens
const typographyTokens = [
  {
    name: 'Plus Jakarta Sans',
    class: 'font-jakarta',
    usage: 'Primary UI, Heading, Navigasi Utama',
    sample: 'The quick brown fox jumps over the lazy dog (Heading & UI Display)'
  },
  {
    name: 'Inter',
    class: 'font-inter',
    usage: 'Body Text, Subtitle, Data Tables & Form Input',
    sample: 'Keluarga font Inter dirancang untuk keterbacaan tingkat tinggi di layar komputer resolusi tinggi.'
  },
  {
    name: 'Source Serif 4',
    class: 'font-serif',
    usage: 'Academic Long-Form, Quotes, Artikel Ilmiah & Editorial',
    sample: '“Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan Anda dapat mengubah dunia.”'
  },
  {
    name: 'JetBrains Mono',
    class: 'font-mono',
    usage: 'Kode Sumber, API Payloads, Token & Data Monospaced',
    sample: 'const session = await authService.login({ email, password });'
  }
]

// 17 Domain Tables PRD
const domainTables = [
  { name: 'users', desc: 'Pengguna sistem (role: lecturer, student, admin, kolom nim_nidn)' },
  { name: 'programs', desc: 'Program Studi / Jurusan (S1, D3, dll)' },
  { name: 'academic_terms', desc: 'Tahun Akademik & Semester (Ganjil/Genap)' },
  { name: 'courses', desc: 'Master Mata Kuliah & SKS' },
  { name: 'course_classes', desc: 'Kelas Perkuliahan (Ruangan, Jadwal, Kapasitas)' },
  { name: 'class_lecturers', desc: 'Dosen Pengampu Kelas (Dosen Utama & Tim)' },
  { name: 'class_sessions', desc: 'Struktur 16 Pertemuan Perkuliahan (UTS, UAS, Regular)' },
  { name: 'class_enrollments', desc: 'Pendaftaran & KRS Mahasiswa di Kelas' },
  { name: 'attendance_tokens', desc: 'Token & QR Code Dinamis Presensi per Sesi' },
  { name: 'attendance_logs', desc: 'Log Kehadiran Mahasiswa (Hadir, Sakit, Izin, Alpha)' },
  { name: 'assignments', desc: 'Tugas Perkuliahan, Tenggat Waktu & Petunjuk' },
  { name: 'submissions', desc: 'Pengumpulan Tugas & Penilaian Dosen' },
  { name: 'quizzes', desc: 'Kuis & Ujian Online Perkuliahan' },
  { name: 'quiz_attempts', desc: 'Percobaan Pengerjaan Kuis Mahasiswa' },
  { name: 'grade_weights', desc: 'Bobot Penilaian Komponen Kelas (Total 100%)' },
  { name: 'final_grades', desc: 'Rekap Nilai Akhir Angka, Huruf & Bobot SKS' },
  { name: 'grade_audit_logs', desc: 'Audit Trail Perubahan Nilai Mahasiswa' }
]
</script>

<template>
  <div class="min-h-screen bg-alabaster-slate text-deep-ink font-sans flex flex-col antialiased">
    <!-- Top Navigation Header -->
    <header class="bg-academic-navy text-white shadow-md border-b border-academic-navy/40 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-scholarly-teal flex items-center justify-center font-bold text-white shadow-inner font-mono text-xl">
            W
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight font-jakarta">LMS Wakanda</h1>
            <p class="text-xs text-slate-300 font-inter">Clean Architecture & Nitro RBAC Auth</p>
          </div>
        </div>

        <!-- Auth Status & Controls in Header -->
        <div class="flex items-center space-x-3">
          <!-- Active User Badge -->
          <div v-if="authStore.isAuthenticated && authStore.user" class="hidden sm:flex items-center space-x-2 bg-deep-ink/40 px-3 py-1.5 rounded-full border border-slate-700">
            <span
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-blue-400': authStore.isAdmin,
                'bg-scholarly-teal': authStore.isLecturer,
                'bg-emerald-400': authStore.isStudent
              }"
            />
            <span class="text-xs font-medium font-inter text-slate-200">{{ authStore.user.name }}</span>
            <span
              class="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold"
              :class="{
                'bg-blue-900 text-blue-200': authStore.isAdmin,
                'bg-teal-900 text-teal-200': authStore.isLecturer,
                'bg-slate-800 text-slate-300': authStore.isStudent
              }"
            >
              {{ authStore.user.role }}
            </span>
          </div>

          <!-- Unauthenticated Indicator -->
          <div v-else class="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-inter bg-slate-800/80 text-slate-300 border border-slate-700">
            <span class="w-2 h-2 rounded-full bg-slate-400 mr-2" />
            <span>Sesi Tamu</span>
          </div>

          <!-- Logout Button if authenticated -->
          <button
            v-if="authStore.isAuthenticated"
            @click="handleLogout"
            class="px-3 py-1 rounded text-xs bg-semantic-danger hover:bg-red-700 transition font-medium text-white shadow-sm flex items-center gap-1.5 font-inter"
          >
            <span>Logout</span>
          </button>

          <!-- Refresh Health -->
          <button
            @click="systemStore.checkHealth()"
            class="px-3 py-1 rounded text-xs bg-scholarly-teal hover:bg-teal-700 transition font-medium text-white shadow-sm font-inter"
          >
            DB Status
          </button>
        </div>
      </div>
    </header>

    <!-- Main Workspace Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Hero Banner -->
      <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2 max-w-3xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-scholarly-teal/10 text-scholarly-teal border border-scholarly-teal/20">
              <span>Nitro Session Auth</span>
              <span>•</span>
              <span>Role-Based Access Control (RBAC)</span>
              <span>•</span>
              <span>Zod Strict Validation</span>
              <span>•</span>
              <span>Drizzle ORM</span>
            </div>
            <h2 class="text-3xl font-extrabold text-deep-ink tracking-tight font-jakarta">
              Autentikasi Sesi & Hak Akses Berbasis Peran (RBAC)
            </h2>
            <p class="text-slate-600 font-serif text-lg leading-relaxed">
              Sistem autentikasi sesi berbasis cookie terenkripsi (*sealed session*) dengan pengawalan hak akses terisolasi pada server middleware Nitro untuk tiga tingkatan peran utama: Administrator, Dosen, dan Mahasiswa.
            </p>
          </div>

          <!-- Quick Metrics from Pinia / Neon -->
          <div class="grid grid-cols-2 gap-3 min-w-[240px]">
            <div class="p-3 bg-alabaster-slate rounded-xl border border-slate-200 text-center">
              <span class="text-xs text-slate-500 font-inter">Status Sesi Anda</span>
              <p class="text-base font-bold font-mono mt-1" :class="authStore.isAuthenticated ? 'text-semantic-success' : 'text-slate-500'">
                {{ authStore.isAuthenticated ? authStore.role?.toUpperCase() : 'BELUM LOGIN' }}
              </p>
            </div>
            <div class="p-3 bg-alabaster-slate rounded-xl border border-slate-200 text-center">
              <span class="text-xs text-slate-500 font-inter">NIM / NIDN Aktif</span>
              <p class="text-base font-bold text-academic-navy font-mono mt-1">
                {{ authStore.nimNidn }}
              </p>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex border-b border-slate-200 mt-8 space-x-6 text-sm font-medium font-inter overflow-x-auto">
          <button
            @click="activeTab = 'auth'"
            class="pb-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap"
            :class="activeTab === 'auth' ? 'border-academic-navy text-academic-navy font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
          >
            <span>🔐 Autentikasi & Pengujian RBAC</span>
          </button>
          <button
            @click="activeTab = 'architecture'"
            class="pb-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap"
            :class="activeTab === 'architecture' ? 'border-academic-navy text-academic-navy font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
          >
            <span>🏛️ Clean Architecture & Neon</span>
          </button>
          <button
            @click="activeTab = 'users'"
            class="pb-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap"
            :class="activeTab === 'users' ? 'border-academic-navy text-academic-navy font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
          >
            <span>👥 Master Pengguna</span>
          </button>
          <button
            @click="activeTab = 'design'"
            class="pb-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap"
            :class="activeTab === 'design' ? 'border-academic-navy text-academic-navy font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
          >
            <span>🎨 Sistem Desain & Tipografi</span>
          </button>
        </div>
      </section>

      <!-- TAB 1: AUTHENTICATION & RBAC TESTER -->
      <div v-if="activeTab === 'auth'" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left Column: Login Form & Quick Test Switcher (5 cols) -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-academic-navy font-jakarta">Formulir Login Sesi</h3>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">/api/auth/login</span>
            </div>

            <!-- Quick Account Selector Buttons -->
            <div>
              <p class="text-xs font-semibold text-slate-700 mb-2 font-inter">Pilih Akun Uji Coba Cepat (Seeded):</p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="setSampleAccount('admin')"
                  class="py-2 px-2 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-academic-navy transition font-inter text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  @click="setSampleAccount('lecturer')"
                  class="py-2 px-2 text-xs font-semibold rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-100 text-scholarly-teal transition font-inter text-center"
                >
                  Dosen
                </button>
                <button
                  type="button"
                  @click="setSampleAccount('student')"
                  class="py-2 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition font-inter text-center"
                >
                  Mahasiswa
                </button>
              </div>
            </div>

            <!-- Feedback Alerts -->
            <div v-if="loginMessage" class="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-semantic-success text-xs font-medium font-inter">
              {{ loginMessage }}
            </div>
            <div v-if="loginError" class="p-3 rounded-lg bg-red-50 border border-red-200 text-semantic-danger text-xs font-medium font-inter">
              {{ loginError }}
            </div>

            <!-- Form -->
            <form @submit.prevent="handleLogin" class="space-y-4 font-inter text-sm">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Email Akademik</label>
                <input
                  v-model="loginEmail"
                  type="email"
                  required
                  placeholder="nama@itw.ac.id"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  v-model="loginPassword"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal focus:border-transparent text-sm"
                />
              </div>

              <div class="pt-2 flex gap-3">
                <button
                  type="submit"
                  :disabled="authStore.isLoading"
                  class="flex-1 py-2.5 px-4 rounded-lg bg-academic-navy hover:bg-blue-900 transition text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <span v-if="authStore.isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Login ke Sesi</span>
                </button>

                <button
                  v-if="authStore.isAuthenticated"
                  type="button"
                  @click="handleLogout"
                  class="py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition"
                >
                  Logout
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Right Column: RBAC Live Endpoint Tester (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
            <div>
              <h3 class="text-lg font-bold text-academic-navy font-jakarta">Pengujian Akses RBAC (Role-Based Access Control)</h3>
              <p class="text-xs text-slate-500 font-inter mt-1">
                Uji proteksi endpoint server middleware Nitro secara *live*. Server akan mengembalikan status <span class="font-mono text-emerald-600 font-bold">200 OK</span> jika peran cocok, atau <span class="font-mono text-semantic-danger font-bold">401/403</span> jika peran tidak diizinkan.
              </p>
            </div>

            <!-- Endpoint Action Buttons -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                @click="testRbacEndpoint('/api/admin/dashboard')"
                :disabled="isTestingRbac"
                class="p-3 text-left rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition group"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-academic-navy font-mono">GET /api/admin</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-academic-navy font-mono">Admin Only</span>
                </div>
                <p class="text-[11px] text-slate-600 font-inter mt-1.5">Akses Dashboard & Pengaturan Global</p>
              </button>

              <button
                type="button"
                @click="testRbacEndpoint('/api/lecturer/courses')"
                :disabled="isTestingRbac"
                class="p-3 text-left rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50 transition group"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-scholarly-teal font-mono">GET /api/lecturer</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-teal-200 text-scholarly-teal font-mono">Dosen/Admin</span>
                </div>
                <p class="text-[11px] text-slate-600 font-inter mt-1.5">Portal Dosen (16 Sesi & Nilai)</p>
              </button>

              <button
                type="button"
                @click="testRbacEndpoint('/api/student/grades')"
                :disabled="isTestingRbac"
                class="p-3 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition group"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800 font-mono">GET /api/student</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">Mhs/Admin</span>
                </div>
                <p class="text-[11px] text-slate-600 font-inter mt-1.5">Portal Mahasiswa (KHS & Presensi)</p>
              </button>
            </div>

            <!-- Additional Endpoints -->
            <div class="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                @click="testRbacEndpoint('/api/auth/me')"
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 font-medium transition"
              >
                GET /api/auth/me (Profil Sesi)
              </button>
              <button
                type="button"
                @click="testRbacEndpoint('/api/health')"
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 font-medium transition"
              >
                GET /api/health (Publik)
              </button>
            </div>

            <!-- Live Test Result Output -->
            <div v-if="rbacTestResult" class="rounded-xl border p-4 space-y-3 font-mono text-xs" :class="rbacTestResult.success ? 'bg-emerald-50/50 border-emerald-300' : 'bg-red-50/50 border-red-300'">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span
                    class="px-2 py-0.5 rounded text-[11px] font-bold"
                    :class="rbacTestResult.success ? 'bg-semantic-success text-white' : 'bg-semantic-danger text-white'"
                  >
                    HTTP {{ rbacTestResult.status }}
                  </span>
                  <span class="font-bold text-deep-ink">{{ rbacTestResult.endpoint }}</span>
                </div>
                <span class="text-slate-400 text-[11px]">{{ rbacTestResult.timestamp }}</span>
              </div>

              <div class="text-deep-ink font-inter text-xs">
                <span class="font-semibold">Respon Server:</span> {{ rbacTestResult.message }}
              </div>

              <div v-if="rbacTestResult.data" class="bg-white/80 p-3 rounded-lg border border-slate-200 overflow-x-auto text-[11px] text-slate-800">
                <pre>{{ JSON.stringify(rbacTestResult.data, null, 2) }}</pre>
              </div>
            </div>

            <!-- Current Session State Details -->
            <div class="rounded-xl bg-alabaster-slate p-4 border border-slate-200 text-xs space-y-2 font-inter">
              <div class="flex items-center justify-between">
                <span class="font-bold text-academic-navy font-jakarta">Informasi Sesi Terautentikasi (Pinia):</span>
                <span class="font-mono text-[11px] text-slate-500">Cookie: lms_wakanda_session (Sealed)</span>
              </div>
              <div v-if="authStore.isAuthenticated && authStore.user" class="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
                <div><span class="text-slate-500">ID:</span> {{ authStore.user.id.substring(0, 18) }}...</div>
                <div><span class="text-slate-500">Nama:</span> {{ authStore.user.name }}</div>
                <div><span class="text-slate-500">Email:</span> {{ authStore.user.email }}</div>
                <div>
                  <span class="text-slate-500">Role:</span>
                  <span class="font-bold uppercase ml-1" :class="authStore.isAdmin ? 'text-blue-600' : (authStore.isLecturer ? 'text-teal-600' : 'text-slate-700')">
                    {{ authStore.user.role }}
                  </span>
                </div>
                <div><span class="text-slate-500">NIM/NIDN:</span> {{ authStore.user.nimNidn || '-' }}</div>
                <div><span class="text-slate-500">Status:</span> <span class="text-semantic-success font-semibold">Aktif</span></div>
              </div>
              <div v-else class="text-slate-500 text-xs italic">
                Belum ada sesi login aktif. Silakan pilih akun dan klik tombol login di samping untuk menguji hak akses RBAC.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: CLEAN ARCHITECTURE STRUCTURE & NEON -->
      <div v-else-if="activeTab === 'architecture'" class="space-y-6">
        <!-- Folder separation -->
        <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-academic-navy font-jakarta">Pemisahan Folder Server (Clean Architecture)</h3>
            <p class="text-sm text-slate-500 font-inter mt-1">
              Menerapkan Separation of Concerns (SoC) pada backend Nitro Nuxt 3:
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/database/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Koneksi Neon Serverless PostgreSQL (@neondatabase/serverless), Drizzle ORM client, dan migrasi schema.
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                index.ts, schema/*.ts, seed.ts
              </div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/repositories/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Kontrak abstraksi data access (CRUD, filter Drizzle query) terpisah murni dari lapisan transport HTTP.
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                base.repository.ts, user.repository.ts
              </div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/services/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Logika bisnis murni (auth.service.ts, user.service.ts, system.service.ts).
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                auth.service.ts, user.service.ts
              </div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/api/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Endpoint HTTP Nitro (auth/login, auth/logout, auth/me, admin, lecturer, student).
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                auth/*.ts, admin/*.ts, lecturer/*.ts
              </div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/middleware/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Middleware Nitro untuk RBAC route protection (auth.ts) dan logging (01.logger.ts).
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                auth.ts, 01.logger.ts
              </div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/utils/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Standardisasi response, helper session H3, schema Zod, dan DomainError mappers.
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                session.ts, auth.ts, schemas.ts
              </div>
            </div>
          </div>
        </section>

        <!-- Neon 17 Tables Grid -->
        <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div class="mb-6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="text-xl font-bold text-academic-navy font-jakarta">17 Tabel PRD di Neon PostgreSQL</h3>
              <p class="text-sm text-slate-500 font-inter mt-1">
                Tersinkronisasi dan terisi data awal Institut Teknologi Wakanda via seeder
              </p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-semantic-success border border-emerald-200">
              Active & Seeded
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="table in domainTables"
              :key="table.name"
              class="p-3.5 rounded-xl border border-slate-100 bg-alabaster-slate hover:border-scholarly-teal transition"
            >
              <div class="flex items-center gap-2 font-mono text-xs font-bold text-academic-navy">
                <span class="w-2 h-2 rounded-full bg-scholarly-teal" />
                <span>{{ table.name }}</span>
              </div>
              <p class="text-[11px] text-slate-500 font-inter mt-1.5 leading-relaxed">
                {{ table.desc }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- TAB 3: USER MANAGEMENT & DATABASE VIEW -->
      <div v-else-if="activeTab === 'users'" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Create Form with Zod Backend Validation -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 class="text-lg font-bold text-academic-navy font-jakarta">Tambah Pengguna Baru</h3>
          <p class="text-xs text-slate-500 font-inter">
            Tersimpan langsung ke database Neon via Drizzle ORM dengan validasi Zod (Hanya Admin).
          </p>

          <div v-if="formMessage" class="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-semantic-success text-xs font-medium font-inter">
            {{ formMessage }}
          </div>
          <div v-if="formError" class="p-3 rounded-lg bg-red-50 border border-red-200 text-semantic-danger text-xs font-medium font-inter">
            {{ formError }}
          </div>

          <form @submit.prevent="handleCreateUser" class="space-y-4 font-inter text-sm">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                v-model="newUserName"
                type="text"
                placeholder="mis. Nakia Prince"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Email Akademik</label>
              <input
                v-model="newUserEmail"
                type="email"
                placeholder="nama@itw.ac.id"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">NIM / NIDN</label>
              <input
                v-model="newUserNimNidn"
                type="text"
                placeholder="mis. 20261001 (NIM) atau 00123456 (NIDN)"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Peran Akun</label>
              <select
                v-model="newUserRole"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-scholarly-teal focus:border-transparent text-sm"
              >
                <option value="student">Student (Mahasiswa)</option>
                <option value="lecturer">Lecturer (Dosen)</option>
                <option value="admin">Admin (Administrator)</option>
              </select>
            </div>

            <button
              type="submit"
              :disabled="userStore.isLoading"
              class="w-full py-2.5 px-4 rounded-lg bg-academic-navy hover:bg-blue-900 transition text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span v-if="userStore.isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Simpan ke Database Neon</span>
            </button>
          </form>
        </div>

        <!-- User List from Pinia Store & Neon DB -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-academic-navy font-jakarta">Daftar Pengguna di Neon DB</h3>
              <p class="text-xs text-slate-500 font-inter">State dimuat secara reaktif melalui Pinia Store</p>
            </div>
            <button
              @click="userStore.fetchUsers()"
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-700 font-inter"
            >
              Segarkan Data
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm font-inter">
              <thead class="text-xs text-slate-500 uppercase bg-alabaster-slate border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 font-semibold">Nama</th>
                  <th class="px-4 py-3 font-semibold">NIM / NIDN</th>
                  <th class="px-4 py-3 font-semibold">Email</th>
                  <th class="px-4 py-3 font-semibold">Peran</th>
                  <th class="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="userStore.users.length === 0">
                  <td colspan="5" class="px-4 py-8 text-center text-slate-400 font-inter text-xs">
                    Belum ada data pengguna di database Neon. Tambahkan pengguna melalui formulir di samping.
                  </td>
                </tr>
                <tr v-for="user in userStore.users" :key="user.id" class="hover:bg-slate-50 transition">
                  <td class="px-4 py-3 font-medium text-deep-ink font-jakarta">{{ user.name }}</td>
                  <td class="px-4 py-3 text-slate-500 font-mono text-xs">{{ user.nimNidn || '-' }}</td>
                  <td class="px-4 py-3 text-slate-500 font-mono text-xs">{{ user.email }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase"
                      :class="{
                        'bg-blue-100 text-academic-navy': user.role === 'admin',
                        'bg-teal-100 text-scholarly-teal': user.role === 'lecturer',
                        'bg-slate-100 text-slate-700': user.role === 'student'
                      }"
                    >
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center text-xs text-semantic-success font-medium">
                      <span class="w-1.5 h-1.5 rounded-full bg-semantic-success mr-1.5" />
                      Aktif
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: DESIGN SYSTEM SHOWCASE -->
      <div v-else-if="activeTab === 'design'" class="space-y-8">
        <!-- Color Palette -->
        <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-academic-navy font-jakarta">Palet Warna PRD LMS Wakanda</h3>
            <p class="text-sm text-slate-500 font-inter mt-1">
              Dikonfigurasikan langsung dalam <code class="px-2 py-0.5 rounded bg-slate-100 text-academic-navy font-mono text-xs">tailwind.config.ts</code>
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="color in colorTokens"
              :key="color.name"
              class="rounded-xl overflow-hidden shadow-sm border border-slate-200 transition-transform hover:-translate-y-1"
            >
              <div
                class="h-24 p-3 flex flex-col justify-between"
                :class="[color.token, color.border || '']"
              >
                <span class="text-xs font-mono font-semibold" :class="color.textColor">{{ color.hex }}</span>
                <span class="text-sm font-bold font-jakarta" :class="color.textColor">{{ color.name }}</span>
              </div>
              <div class="p-3 bg-white space-y-1">
                <p class="text-xs text-slate-500 font-inter">{{ color.role }}</p>
                <p class="text-[11px] font-mono text-slate-400">class: {{ color.token }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Typography System -->
        <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-academic-navy font-jakarta">Integrasi Tipografi PRD</h3>
            <p class="text-sm text-slate-500 font-inter mt-1">
              4 keluarga font terintegrasi: Plus Jakarta Sans, Inter, Source Serif 4, dan JetBrains Mono.
            </p>
          </div>

          <div class="space-y-4">
            <div
              v-for="font in typographyTokens"
              :key="font.name"
              class="p-5 rounded-xl border border-slate-200 bg-alabaster-slate/50 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-academic-navy font-jakarta">{{ font.name }}</span>
                <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-deep-ink">{{ font.class }}</span>
              </div>
              <p class="text-xs text-slate-500 font-inter">{{ font.usage }}</p>
              <p class="text-base text-deep-ink pt-1" :class="font.class">
                {{ font.sample }}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-deep-ink text-slate-400 py-6 border-t border-slate-800 mt-auto text-xs font-inter">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 LMS Wakanda. Seluruh hak cipta dilindungi. Terhubung ke Neon Serverless PostgreSQL dengan Nitro Session & RBAC.</p>
        <div class="flex items-center space-x-4 font-mono text-[11px] text-slate-400">
          <span>Nitro Sessions</span>
          <span>•</span>
          <span>RBAC</span>
          <span>•</span>
          <span>Pinia Auth Store</span>
          <span>•</span>
          <span>Zod</span>
        </div>
      </div>
    </footer>
  </div>
</template>
