<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useUserStore } from '~/stores/useUserStore'
import { useSystemStore } from '~/stores/useSystemStore'
import type { ApiResponse, UserRole } from '~/types'

const authStore = useAuthStore()
const userStore = useUserStore()
const systemStore = useSystemStore()

// State RBAC Live Tester
interface RbacResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  message: string
  data?: unknown
  timestamp: string
}
const rbacResult = ref<RbacResult | null>(null)
const isTestingRbac = ref(false)

// State Form Tambah Pengguna
const newName = ref('')
const newEmail = ref('')
const newNimNidn = ref('')
const newRole = ref<UserRole>('student')
const formMessage = ref<string | null>(null)
const formError = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([
    userStore.fetchUsers(),
    systemStore.checkHealth()
  ])
})

const testEndpoint = async (endpoint: string) => {
  isTestingRbac.value = true
  rbacResult.value = null

  try {
    const res = await $fetch<ApiResponse<unknown>>(endpoint)
    rbacResult.value = {
      endpoint,
      method: 'GET',
      status: 200,
      success: true,
      message: res.message || 'Akses Berhasil',
      data: res.data,
      timestamp: new Date().toLocaleTimeString()
    }
  } catch (err: unknown) {
    const fetchErr = err as { statusCode?: number; status?: number; data?: { statusMessage?: string; message?: string } }
    const status = fetchErr.statusCode || fetchErr.status || 500
    const msg = fetchErr.data?.statusMessage || fetchErr.data?.message || (err instanceof Error ? err.message : 'Akses Ditolak')

    rbacResult.value = {
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

const handleCreateUser = async () => {
  formMessage.value = null
  formError.value = null

  if (!newName.value.trim() || !newEmail.value.trim()) {
    formError.value = 'Nama dan email wajib diisi.'
    return
  }

  try {
    await userStore.createUser({
      name: newName.value.trim(),
      email: newEmail.value.trim(),
      role: newRole.value,
      nimNidn: newNimNidn.value.trim() || undefined
    })
    formMessage.value = `Pengguna '${newName.value}' berhasil disimpan ke Neon DB!`
    newName.value = ''
    newEmail.value = ''
    newNimNidn.value = ''
    newRole.value = 'student'
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Gagal menambahkan pengguna'
  }
}

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
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header Card -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-2">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-academic-navy text-xs font-semibold border border-blue-200 font-inter">
        <span>Arsitektur Bersih & Neon Serverless</span>
      </div>
      <h2 class="text-2xl font-bold text-academic-navy font-jakarta">
        Backend Inspector & Live RBAC Tester
      </h2>
      <p class="text-xs text-slate-500 font-inter max-w-2xl">
        Alat uji langsung hak akses server middleware Nitro dan pemantauan relasi 17 tabel database Neon.
      </p>
    </section>

    <!-- RBAC Endpoint Tester -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-5">
      <div>
        <h3 class="text-base font-bold text-academic-navy font-jakarta">
          Pengujian Endpoint RBAC (Role-Based Access Control)
        </h3>
        <p class="text-xs text-slate-500 font-inter mt-1">
          Role sesi Anda saat ini: <strong class="font-mono uppercase text-academic-navy">[{{ authStore.role || 'TAMU' }}]</strong>. Klik tombol berikut untuk menguji respon middleware server:
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          @click="testEndpoint('/api/admin/dashboard')"
          :disabled="isTestingRbac"
          class="p-3.5 text-left rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-academic-navy font-mono">/api/admin</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-academic-navy font-mono">Admin Only</span>
          </div>
          <p class="text-[11px] text-slate-600 font-inter mt-1.5">Dashboard & Pengaturan Global</p>
        </button>

        <button
          type="button"
          @click="testEndpoint('/api/lecturer/courses')"
          :disabled="isTestingRbac"
          class="p-3.5 text-left rounded-2xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50 transition"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-scholarly-teal font-mono">/api/lecturer</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-teal-200 text-scholarly-teal font-mono">Dosen/Admin</span>
          </div>
          <p class="text-[11px] text-slate-600 font-inter mt-1.5">Portal Dosen (16 Sesi & Nilai)</p>
        </button>

        <button
          type="button"
          @click="testEndpoint('/api/student/grades')"
          :disabled="isTestingRbac"
          class="p-3.5 text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800 font-mono">/api/student</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">Mhs/Admin</span>
          </div>
          <p class="text-[11px] text-slate-600 font-inter mt-1.5">Portal Mahasiswa (KHS & Presensi)</p>
        </button>
      </div>

      <!-- Hasil Uji RBAC Live -->
      <div v-if="rbacResult" class="p-4 rounded-2xl border font-mono text-xs space-y-2" :class="rbacResult.success ? 'bg-emerald-50/60 border-emerald-300' : 'bg-red-50/60 border-red-300'">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span
              class="px-2 py-0.5 rounded text-[11px] font-bold"
              :class="rbacResult.success ? 'bg-semantic-success text-white' : 'bg-semantic-danger text-white'"
            >
              HTTP {{ rbacResult.status }}
            </span>
            <span class="font-bold text-deep-ink">{{ rbacResult.endpoint }}</span>
          </div>
          <span class="text-slate-400 text-[10px]">{{ rbacResult.timestamp }}</span>
        </div>
        <p class="font-inter text-slate-700 text-xs font-medium">Respon: {{ rbacResult.message }}</p>
      </div>
    </section>

    <!-- Struktur Clean Architecture -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-4">
      <h3 class="text-base font-bold text-academic-navy font-jakarta">
        Pola Clean Architecture (Repository - Service - Controller)
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-inter">
        <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 space-y-2">
          <h4 class="font-mono font-bold text-scholarly-teal">server/repositories/</h4>
          <p class="text-slate-600">
            Abstraksi query Drizzle ORM ke database Neon PostgreSQL, atomic transactions 16 sesi dan 5 bobot nilai.
          </p>
        </div>
        <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 space-y-2">
          <h4 class="font-mono font-bold text-scholarly-teal">server/services/</h4>
          <p class="text-slate-600">
            Logika bisnis murni, validasi domain (tanggal semester, keunikan kode kelas, verifikasi role).
          </p>
        </div>
        <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 space-y-2">
          <h4 class="font-mono font-bold text-scholarly-teal">server/api/</h4>
          <p class="text-slate-600">
            Nitro HTTP endpoints, Zod schema validation, penanganan session cookie terenkripsi.
          </p>
        </div>
      </div>
    </section>

    <!-- 17 Tabel Domain di Neon PostgreSQL -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-academic-navy font-jakarta">
          17 Tabel Domain Relasional PRD di Neon DB
        </h3>
        <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-semantic-success border border-emerald-200">
          Tersinkronisasi & Seeded
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div
          v-for="tbl in domainTables"
          :key="tbl.name"
          class="p-3 rounded-xl bg-alabaster-slate border border-slate-200 text-xs font-inter"
        >
          <div class="font-mono font-bold text-academic-navy flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-scholarly-teal"></span>
            <span>{{ tbl.name }}</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-1 line-clamp-1">{{ tbl.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
