<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import { useSystemStore } from '~/stores/useSystemStore'
import type { UserRole } from '~/types'

const userStore = useUserStore()
const systemStore = useSystemStore()

const newUserName = ref('')
const newUserEmail = ref('')
const newUserNimNidn = ref('')
const newUserRole = ref<UserRole>('student')
const formMessage = ref<string | null>(null)
const formError = ref<string | null>(null)

const activeTab = ref<'design' | 'architecture' | 'users'>('design')

onMounted(async () => {
  await Promise.all([
    systemStore.checkHealth(),
    userStore.fetchUsers()
  ])
})

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
    sample: 'const wakandaLms = new CleanArchitecture({ strict: true, zod: true, orm: "drizzle" });'
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
            <p class="text-xs text-slate-300 font-inter">Clean Architecture & Neon Serverless PostgreSQL</p>
          </div>
        </div>

        <!-- System & Database Status Badge -->
        <div class="flex items-center space-x-3">
          <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-inter bg-deep-ink/50 border border-slate-700">
            <span
              class="w-2 h-2 rounded-full mr-2"
              :class="systemStore.status === 'healthy' ? 'bg-semantic-success animate-pulse' : 'bg-amber-alert'"
            />
            <span class="text-slate-200">Neon DB: {{ systemStore.status }}</span>
            <span class="ml-2 text-scholarly-teal font-mono text-[11px] hidden sm:inline">
              (17 Tables)
            </span>
          </div>

          <button
            @click="systemStore.checkHealth()"
            class="px-3 py-1 rounded text-xs bg-scholarly-teal hover:bg-teal-700 transition font-medium text-white shadow-sm"
          >
            Refresh
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
              <span>Neon PostgreSQL</span>
              <span>•</span>
              <span>Drizzle ORM</span>
              <span>•</span>
              <span>17 Domain Tables</span>
              <span>•</span>
              <span>Clean Architecture</span>
            </div>
            <h2 class="text-3xl font-extrabold text-deep-ink tracking-tight font-jakarta">
              Sistem Basis Data & Desain Pembelajaran LMS Wakanda
            </h2>
            <p class="text-slate-600 font-serif text-lg leading-relaxed">
              Arsitektur terisolasi bersih yang mengintegrasikan Neon Serverless PostgreSQL via Drizzle ORM, validasi Zod, dan manajemen state Pinia dengan sistem desain komprehensif Tailwind CSS.
            </p>
          </div>

          <!-- Quick Metrics from Pinia / Neon -->
          <div class="grid grid-cols-2 gap-3 min-w-[240px]">
            <div class="p-3 bg-alabaster-slate rounded-xl border border-slate-200 text-center">
              <span class="text-xs text-slate-500 font-inter">Pengguna Terdaftar</span>
              <p class="text-2xl font-bold text-academic-navy font-mono">{{ systemStore.userCount }}</p>
            </div>
            <div class="p-3 bg-alabaster-slate rounded-xl border border-slate-200 text-center">
              <span class="text-xs text-slate-500 font-inter">Tabel Database</span>
              <p class="text-2xl font-bold text-scholarly-teal font-mono">{{ systemStore.tableCount }}</p>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex border-b border-slate-200 mt-8 space-x-6 text-sm font-medium font-inter">
          <button
            @click="activeTab = 'design'"
            class="pb-3 border-b-2 transition flex items-center gap-2"
            :class="activeTab === 'design' ? 'border-academic-navy text-academic-navy font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
          >
            <span>🎨 Sistem Desain & Tipografi</span>
          </button>
          <button
            @click="activeTab = 'architecture'"
            class="pb-3 border-b-2 transition flex items-center gap-2"
            :class="activeTab === 'architecture' ? 'border-academic-navy text-academic-navy font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
          >
            <span>🏛️ Clean Architecture & Neon (17 Tabel)</span>
          </button>
          <button
            @click="activeTab = 'users'"
            class="pb-3 border-b-2 transition flex items-center gap-2"
            :class="activeTab === 'users' ? 'border-academic-navy text-academic-navy font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
          >
            <span>👥 Demo Pengguna (Neon + Zod + Pinia)</span>
          </button>
        </div>
      </section>

      <!-- TAB 1: DESIGN SYSTEM SHOWCASE -->
      <div v-if="activeTab === 'design'" class="space-y-8">
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

      <!-- TAB 2: CLEAN ARCHITECTURE & NEON 17 TABLES -->
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
                index.ts, schema/*.ts, migrations/*.sql
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
                Logika bisnis murni (domain rules, validasi konflik, koordinasi use cases).
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                user.service.ts, system.service.ts
              </div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/api/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Endpoint HTTP Nitro (defineEventHandler), memvalidasi input via Zod dan memanggil service.
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                health.get.ts, users/*.ts
              </div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/middleware/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Middleware Nitro untuk logging request, tracking timing, dan context ID per request.
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                01.logger.ts
              </div>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-2">
              <div class="flex items-center gap-2 text-scholarly-teal font-mono font-bold text-sm">
                <span>📁 server/utils/</span>
              </div>
              <p class="text-xs text-slate-600 font-inter leading-relaxed">
                Standardisasi response ApiResponse&lt;T&gt;, Zod validator helper, dan DomainError mappers.
              </p>
              <div class="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
                response.ts, errors.ts, validation.ts, schemas.ts
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
                Telah tersinkronisasi via <code class="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-scholarly-teal">drizzle-kit push</code>
              </p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-semantic-success border border-emerald-200">
              Synchronized & Active
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

      <!-- TAB 3: LIVE USERS DEMO (ZOD + PINIA + NEON BACKEND) -->
      <div v-else-if="activeTab === 'users'" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Create Form with Zod Backend Validation -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 class="text-lg font-bold text-academic-navy font-jakarta">Tambah Pengguna Baru</h3>
          <p class="text-xs text-slate-500 font-inter">
            Tersimpan langsung ke database Neon via Drizzle ORM dengan validasi Zod.
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
                placeholder="nama@wakanda-academy.edu"
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
    </main>

    <!-- Footer -->
    <footer class="bg-deep-ink text-slate-400 py-6 border-t border-slate-800 mt-auto text-xs font-inter">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 LMS Wakanda. Seluruh hak cipta dilindungi. Terhubung ke Neon Serverless PostgreSQL via Drizzle ORM.</p>
        <div class="flex items-center space-x-4 font-mono text-[11px] text-slate-400">
          <span>Nuxt 3</span>
          <span>•</span>
          <span>Neon Serverless</span>
          <span>•</span>
          <span>Drizzle ORM</span>
          <span>•</span>
          <span>Zod</span>
          <span>•</span>
          <span>Pinia</span>
        </div>
      </div>
    </footer>
  </div>
</template>
