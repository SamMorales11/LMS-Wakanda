<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  KeyRound,
  GraduationCap,
  Users
} from 'lucide-vue-next'
import { useAuthStore } from '~/stores/useAuthStore'

// Router & Store
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State Formulir
const email = ref('admin@wakanda.ac.id')
const password = ref('Password123!')
const showPassword = ref(false)
const isCapsLockOn = ref(false)
const selectedCategory = ref<'all' | 'admin' | 'lecturer' | 'student'>('all')
const activePresetId = ref<string>('adm-001')

// State Feedback & Validasi
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const emailError = ref<string | null>(null)
const passwordError = ref<string | null>(null)

// 7 Akun Dummy Resmi Terverifikasi Database Neon (Fase 4 Seeder)
interface SeededPersona {
  id: string
  role: 'admin' | 'lecturer' | 'student'
  category: 'admin' | 'lecturer' | 'student'
  roleBadge: string
  name: string
  identifier: string
  email: string
  password: string
  scenarioDescription: string
  ewsStatus: 'SAFE' | 'WARNING' | 'CRITICAL' | null
  ewsLabel: string | null
}

const seededPersonas: SeededPersona[] = [
  {
    id: 'adm-001',
    role: 'admin',
    category: 'admin',
    roleBadge: 'ADMIN',
    name: 'Admin Akademik ITW',
    identifier: 'ADM-001',
    email: 'admin@wakanda.ac.id',
    password: 'Password123!',
    scenarioDescription: 'Administrator Sistem & Manajemen BAA',
    ewsStatus: null,
    ewsLabel: null
  },
  {
    id: 'lec-shuri',
    role: 'lecturer',
    category: 'lecturer',
    roleBadge: 'DOSEN',
    name: 'Prof. Shuri Udaku',
    identifier: '1011088901',
    email: 'shuri@lecturer.wakanda.ac.id',
    password: 'Password123!',
    scenarioDescription: 'Koordinator IF2041-A Struktur Data & Algoritma',
    ewsStatus: null,
    ewsLabel: null
  },
  {
    id: 'lec-tchalla',
    role: 'lecturer',
    category: 'lecturer',
    roleBadge: 'DOSEN',
    name: "Dr. T'Challa",
    identifier: '1015058502',
    email: 'tchalla@lecturer.wakanda.ac.id',
    password: 'Password123!',
    scenarioDescription: 'Dosen Pendamping Kelas IF2041-A',
    ewsStatus: null,
    ewsLabel: null
  },
  {
    id: 'std-nakia',
    role: 'student',
    category: 'student',
    roleBadge: 'MHS',
    name: 'Nakia Lupita',
    identifier: '11241001',
    email: 'nakia@student.wakanda.ac.id',
    password: 'Password123!',
    scenarioDescription: 'Kehadiran 100% • Tugas On-Time • Nilai Akhir A',
    ewsStatus: 'SAFE',
    ewsLabel: 'Aman'
  },
  {
    id: 'std-mbaku',
    role: 'student',
    category: 'student',
    roleBadge: 'MHS',
    name: "M'Baku Jabari",
    identifier: '11241002',
    email: 'mbaku@student.wakanda.ac.id',
    password: 'Password123!',
    scenarioDescription: 'Kehadiran 75% • Tugas Terlambat • Nilai Akhir BC',
    ewsStatus: 'WARNING',
    ewsLabel: 'Waspada'
  },
  {
    id: 'std-erik',
    role: 'student',
    category: 'student',
    roleBadge: 'MHS',
    name: "N'Jadaka Erik",
    identifier: '11241003',
    email: 'erik@student.wakanda.ac.id',
    password: 'Password123!',
    scenarioDescription: 'Kehadiran 50% (< 75% Diskualifikasi) • Nilai Akhir E',
    ewsStatus: 'CRITICAL',
    ewsLabel: 'Kritis'
  },
  {
    id: 'std-riri',
    role: 'student',
    category: 'student',
    roleBadge: 'MHS',
    name: 'Riri Williams',
    identifier: '11241004',
    email: 'riri@student.wakanda.ac.id',
    password: 'Password123!',
    scenarioDescription: 'Pengujian Aktif • Sesi 10 Token Presensi 481920',
    ewsStatus: 'SAFE',
    ewsLabel: 'Aman'
  }
]

// Filter Persona
const displayedPersonas = computed(() => {
  if (selectedCategory.value === 'all') return seededPersonas
  return seededPersonas.filter(p => p.category === selectedCategory.value)
})

// Quick-Fill Action
const applyPersona = (persona: SeededPersona) => {
  activePresetId.value = persona.id
  email.value = persona.email
  password.value = persona.password
  emailError.value = null
  passwordError.value = null
  errorMessage.value = null
}

// Deteksi Hardware Caps-Lock
const handleKeydown = (e: KeyboardEvent) => {
  isCapsLockOn.value = e.getModifierState('CapsLock')
}

// Validasi Form
const validateFields = (): boolean => {
  emailError.value = null
  passwordError.value = null

  let isValid = true
  const cleanEmail = email.value.trim()
  if (!cleanEmail) {
    emailError.value = 'Email civitas atau identitas resmi wajib diisi.'
    isValid = false
  } else if (!cleanEmail.includes('@') && cleanEmail.length < 5) {
    emailError.value = 'Format alamat email akademik tidak valid.'
    isValid = false
  }

  if (!password.value) {
    passwordError.value = 'Kata sandi sesi autentikasi wajib diisi.'
    isValid = false
  } else if (password.value.length < 6) {
    passwordError.value = 'Kata sandi minimal terdiri dari 6 karakter.'
    isValid = false
  }

  return isValid
}

// Proses Submit Login
const handleSubmit = async () => {
  errorMessage.value = null
  successMessage.value = null

  if (!validateFields()) return

  try {
    const user = await authStore.login({
      email: email.value.trim(),
      password: password.value
    })

    successMessage.value = `Autentikasi terverifikasi: ${user.name} (${user.role.toUpperCase()})`

    const redirectPath = (route.query.redirect as string) || '/'
    setTimeout(() => {
      router.push(redirectPath)
    }, 450)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Autentikasi gagal. Periksa kembali kredensial Anda.'
  }
}

// Lifecycle Hooks
onMounted(() => {
  if (route.query.error === 'auth_required') {
    errorMessage.value = 'Sesi autentikasi dibutuhkan untuk mengakses modul workspace akademik.'
  } else if (route.query.error === 'login_required') {
    errorMessage.value = 'Sesi login Anda telah berakhir. Silakan masuk kembali.'
  }

  if (authStore.isAuthenticated) {
    router.push((route.query.redirect as string) || '/')
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between selection:bg-[#0D9488]/15 selection:text-[#0D9488] relative overflow-hidden"
    @keydown="handleKeydown"
  >
    <!-- Architectural Drafting Grid Texture with Radial Focal Vignette -->
    <div
      class="absolute inset-0 pointer-events-none z-0"
      style="
        background-image:
          linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
        background-size: 24px 24px;
        mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 1) 100%);
        -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 1) 100%);
      "
    ></div>

    <!-- Top Bar Header: Swiss Minimalist Architectural Bar -->
    <header class="border-b border-slate-200 bg-white/95 backdrop-blur-xs sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <!-- Logo & Brand Header -->
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-[#0F172A] text-white flex items-center justify-center font-mono font-bold text-xs tracking-wider border border-[#0F172A] rounded-sm">
            ITW
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-extrabold tracking-tight font-jakarta text-[#0F172A]">
              Institut Teknologi Wakanda
            </span>
            <span class="text-slate-300 hidden sm:inline">/</span>
            <span class="text-xs text-slate-500 font-mono hidden sm:inline">
              Wakanda Academic Space (WAS)
            </span>
          </div>
        </div>

        <!-- Telemetry Pill Header -->
        <div class="flex items-center space-x-2 text-xs font-mono">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-sm">
            <span class="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span class="font-semibold">TA 20261</span>
            <span class="text-slate-400 hidden md:inline">• Ganjil</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Konten Utama: 12-Column Swiss Modular Grid Frame -->
    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
      <div class="max-w-6xl w-full bg-white border border-slate-300 shadow-none rounded-sm relative">
        <div class="grid grid-cols-1 lg:grid-cols-12 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          <!-- ============================================================== -->
          <!-- KOLOM KIRI (Col-Span 4): INSTITUTIONAL DOSSIER & CONTEXT       -->
          <!-- ============================================================== -->
          <div class="lg:col-span-4 p-6 sm:p-8 bg-[#F8FAFC] flex flex-col justify-between gap-6">
            <div class="space-y-6">
              <!-- Institutional Badge -->
              <div class="space-y-2">
                <div class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-200/80 border border-slate-300 text-[10px] font-mono font-semibold tracking-wider text-slate-700 uppercase rounded-sm">
                  <ShieldCheck class="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Sistem Informasi Akademik Resmi</span>
                </div>
                <h1 class="text-2xl font-extrabold tracking-tight font-jakarta text-[#0F172A] leading-snug">
                  Gerbang Akses Terpadu Civitas ITW.
                </h1>
                <p class="text-xs text-slate-600 font-inter leading-relaxed">
                  Pusat layanan perkuliahan, bank soal ujian terstandarisasi, presensi PIN/QR dinamis, dan pemantauan telemetri kelulusan (EWS).
                </p>
              </div>

              <!-- Academic Context Card -->
              <div class="border border-slate-200 bg-white p-3.5 rounded-sm space-y-2.5">
                <div class="flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-slate-100 pb-1.5">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3 h-3 text-[#1E3A8A]" />
                    <span>Tahun Akademik</span>
                  </span>
                  <span class="font-bold text-[#1E3A8A]">20261 (Ganjil)</span>
                </div>
                <div class="flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-slate-100 pb-1.5">
                  <span class="flex items-center gap-1">
                    <GraduationCap class="w-3 h-3 text-[#0D9488]" />
                    <span>Mata Kuliah Utama</span>
                  </span>
                  <span class="font-semibold text-slate-800">IF2041 (Kelas A)</span>
                </div>
                <div class="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span class="flex items-center gap-1">
                    <KeyRound class="w-3 h-3 text-[#D97706]" />
                    <span>Sesi 10 Token Aktif</span>
                  </span>
                  <span class="px-1.5 py-0.2 bg-amber-50 border border-amber-200 text-[#D97706] font-bold tracking-widest rounded-sm">
                    481920
                  </span>
                </div>
              </div>
            </div>

            <!-- Archival Motto in Source Serif 4 -->
            <div class="p-3 bg-white border border-slate-200 rounded-sm">
              <p class="text-xs font-serif italic text-slate-700 leading-relaxed">
                "Scientia, Virtus, et Excellentia."
              </p>
              <p class="text-[10px] text-slate-400 font-inter mt-1">
                Mewujudkan integritas riset berstandar global melalui tata kelola akademik berbasis Clean Architecture.
              </p>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- KOLOM KANAN (Col-Span 8): INTERACTIVE AUTHENTICATION TERMINAL  -->
          <!-- ============================================================== -->
          <div class="lg:col-span-8 p-6 sm:p-8 bg-white flex flex-col justify-between">
            <div class="space-y-6">
              <!-- Section Title Header -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 class="text-xl font-extrabold tracking-tight font-jakarta text-[#0F172A]">
                    Autentikasi Akses Akademik
                  </h2>
                  <p class="text-xs text-slate-500 font-inter mt-0.5">
                    Gunakan kredensial resmi civitas ITW atau pilih salah satu akun uji coba di bawah:
                  </p>
                </div>
                <div class="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600 rounded-sm self-start sm:self-auto">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
                  <span>GATEWAY ACTIVE</span>
                </div>
              </div>

              <!-- ======================================================== -->
              <!-- 7-PERSONA SPECIMEN SWITCHER TABLE (SWISS GRID MINIMALIST) -->
              <!-- ======================================================== -->
              <div class="border border-slate-200 bg-[#F8FAFC] rounded-sm p-3 space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <span class="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Users class="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>Daftar Persona Akun Uji Coba (7 Akun Seeded):</span>
                  </span>

                  <!-- Role Category Filter Buttons -->
                  <div class="inline-flex p-0.5 bg-slate-200/70 rounded-sm text-[10px] font-mono font-medium">
                    <button
                      type="button"
                      @click="selectedCategory = 'all'"
                      class="px-2 py-0.5 rounded-sm transition"
                      :class="selectedCategory === 'all' ? 'bg-white text-[#0F172A] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                    >
                      Semua (7)
                    </button>
                    <button
                      type="button"
                      @click="selectedCategory = 'admin'"
                      class="px-2 py-0.5 rounded-sm transition"
                      :class="selectedCategory === 'admin' ? 'bg-white text-[#0F172A] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                    >
                      Admin (1)
                    </button>
                    <button
                      type="button"
                      @click="selectedCategory = 'lecturer'"
                      class="px-2 py-0.5 rounded-sm transition"
                      :class="selectedCategory === 'lecturer' ? 'bg-white text-[#0F172A] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                    >
                      Dosen (2)
                    </button>
                    <button
                      type="button"
                      @click="selectedCategory = 'student'"
                      class="px-2 py-0.5 rounded-sm transition"
                      :class="selectedCategory === 'student' ? 'bg-white text-[#0F172A] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                    >
                      Mahasiswa (4)
                    </button>
                  </div>
                </div>

                <!-- Specimen Grid List -->
                <div v-auto-animate class="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  <button
                    v-for="persona in displayedPersonas"
                    :key="persona.id"
                    type="button"
                    @click="applyPersona(persona)"
                    class="p-2 border text-left transition-all rounded-sm flex flex-col justify-between gap-1 group relative"
                    :class="activePresetId === persona.id
                      ? 'border-[#1E3A8A] bg-white ring-1 ring-[#1E3A8A]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'"
                  >
                    <!-- Row 1: Role badge, Name, and Identifier -->
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 truncate">
                        <span
                          class="px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-wider rounded-sm shrink-0"
                          :class="{
                            'bg-[#1E3A8A] text-white': persona.role === 'admin',
                            'bg-[#0D9488] text-white': persona.role === 'lecturer',
                            'bg-slate-800 text-white': persona.role === 'student'
                          }"
                        >
                          {{ persona.roleBadge }}
                        </span>
                        <span class="text-xs font-semibold text-[#0F172A] font-jakarta truncate">
                          {{ persona.name }}
                        </span>
                      </div>
                      <span class="text-[10px] font-mono text-slate-500 shrink-0">
                        {{ persona.identifier }}
                      </span>
                    </div>

                    <!-- Row 2: Scenario description & EWS Tag -->
                    <div class="flex items-center justify-between gap-1.5 text-[10px] pt-1 border-t border-slate-100">
                      <span class="text-slate-500 font-inter truncate">
                        {{ persona.scenarioDescription }}
                      </span>

                      <!-- EWS Status Tag if Student -->
                      <span
                        v-if="persona.ewsStatus"
                        class="px-1 py-0.2 font-mono text-[9px] font-bold rounded-sm shrink-0"
                        :class="{
                          'bg-emerald-50 text-[#16A34A] border border-emerald-200': persona.ewsStatus === 'SAFE',
                          'bg-amber-50 text-[#D97706] border border-amber-200': persona.ewsStatus === 'WARNING',
                          'bg-red-50 text-[#DC2626] border border-red-200': persona.ewsStatus === 'CRITICAL'
                        }"
                      >
                        {{ persona.ewsLabel }}
                      </span>
                    </div>
                  </button>
                </div>

                <!-- Uniform Password Memo -->
                <div class="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/80">
                  <span>Password Seragam Seluruh Akun:</span>
                  <span class="font-bold text-[#1E3A8A] bg-white px-2 py-0.5 border border-slate-200 rounded-sm">
                    Password123!
                  </span>
                </div>
              </div>

              <!-- ======================================================== -->
              <!-- INLINE FEEDBACK ALERT (ERRORS & SUCCESS)                 -->
              <!-- ======================================================== -->
              <div v-auto-animate>
                <div
                  v-if="errorMessage"
                  class="p-3 bg-red-50/90 border border-red-200 text-[#DC2626] text-xs font-inter flex items-start gap-2 rounded-sm"
                >
                  <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <span class="font-bold font-mono">Autentikasi Ditolak: </span>
                    <span>{{ errorMessage }}</span>
                  </div>
                </div>

                <div
                  v-if="successMessage"
                  class="p-3 bg-emerald-50/90 border border-emerald-200 text-[#16A34A] text-xs font-inter flex items-start gap-2 rounded-sm"
                >
                  <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <span class="font-bold font-mono">Berhasil: </span>
                    <span>{{ successMessage }}</span>
                  </div>
                </div>
              </div>

              <!-- ======================================================== -->
              <!-- FORM INPUTS (HIGH-PRECISION ERGONOMIC CONTROLS)          -->
              <!-- ======================================================== -->
              <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>
                <!-- Email / Identitas Field -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label for="email" class="block text-xs font-bold font-inter tracking-wider text-slate-700 uppercase">
                      Alamat Email Civitas ITW / Identitas
                    </label>
                    <span class="text-[10px] font-mono text-slate-400">
                      RFC-5322 Format
                    </span>
                  </div>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail class="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      v-model="email"
                      type="email"
                      autocomplete="username"
                      placeholder="nama@itw.ac.id"
                      class="w-full pl-9 pr-3 py-2.5 rounded-sm border font-mono text-xs sm:text-sm bg-white transition-colors"
                      :class="emailError
                        ? 'border-red-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none'
                        : 'border-slate-300 focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] focus:outline-none'"
                    />
                  </div>
                  <div v-auto-animate>
                    <p v-if="emailError" class="text-[11px] font-mono text-red-600 flex items-center gap-1 mt-1">
                      <span>⨉</span>
                      <span>{{ emailError }}</span>
                    </p>
                  </div>
                </div>

                <!-- Password Field -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label for="password" class="block text-xs font-bold font-inter tracking-wider text-slate-700 uppercase">
                      Kata Sandi Sesi
                    </label>
                    <div class="flex items-center gap-2">
                      <span
                        v-if="isCapsLockOn"
                        class="px-1.5 py-0.2 bg-amber-100 border border-amber-300 text-[#D97706] font-mono font-bold text-[9px] rounded-sm animate-pulse"
                      >
                        [CAPS LOCK AKTIF]
                      </span>
                      <span class="text-[10px] font-mono text-slate-400">
                        Kunci Enkripsi Sesi
                      </span>
                    </div>
                  </div>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock class="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="••••••••••••"
                      class="w-full pl-9 pr-10 py-2.5 rounded-sm border font-mono text-xs sm:text-sm bg-white transition-colors"
                      :class="passwordError
                        ? 'border-red-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none'
                        : 'border-slate-300 focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] focus:outline-none'"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none"
                      :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                      :aria-pressed="showPassword"
                    >
                      <EyeOff v-if="showPassword" class="w-4 h-4" />
                      <Eye v-else class="w-4 h-4" />
                    </button>
                  </div>
                  <div v-auto-animate>
                    <p v-if="passwordError" class="text-[11px] font-mono text-red-600 flex items-center gap-1 mt-1">
                      <span>⨉</span>
                      <span>{{ passwordError }}</span>
                    </p>
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="pt-2">
                  <button
                    type="submit"
                    :disabled="authStore.isLoading"
                    class="w-full h-11 px-4 bg-[#1E3A8A] hover:bg-blue-900 active:bg-blue-950 text-white font-jakarta font-bold text-sm tracking-wide transition-all border border-[#1E3A8A] rounded-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-none"
                  >
                    <span
                      v-if="authStore.isLoading"
                      class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></span>
                    <span>
                      {{ authStore.isLoading ? 'Memverifikasi Sesi Autentikasi...' : 'Masuk ke Academic Workspace' }}
                    </span>
                    <ArrowRight v-if="!authStore.isLoading" class="w-4 h-4 ml-1" />
                  </button>
                </div>
              </form>
            </div>

            <!-- Guest Link -->
            <div class="pt-4 flex justify-end text-xs text-slate-500 font-inter">
              <NuxtLink
                to="/"
                class="text-[#0D9488] hover:text-teal-800 font-medium inline-flex items-center gap-1 hover:underline"
              >
                <span>Buka Beranda Tamu</span>
                <span class="font-mono">→</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer Copyright -->
    <footer class="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-inter relative z-10">
      <div class="max-w-7xl mx-auto px-4 font-inter">
        &copy; 2026 Institut Teknologi Wakanda. Seluruh Hak Cipta Dilindungi Undang-Undang. Arsitektur Bersih & Sistem Manajemen Pembelajaran Terpadu.
      </div>
    </footer>
  </div>
</template>
