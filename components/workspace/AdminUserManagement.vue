<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import type { User, UserRole, CreateUserDto } from '~/types'

const userStore = useUserStore()

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

function isProtectedDemo(email?: string | null): boolean {
  if (!email) return false
  return PROTECTED_DEMO_EMAILS.includes(email.trim().toLowerCase())
}

// State Filter & Pencarian
const selectedRole = ref<'all' | 'lecturer' | 'student' | 'admin'>('all')
const searchQuery = ref('')

// State Modals
const showAddUserModal = ref(false)
const showResetPasswordModal = ref(false)
const selectedUserForReset = ref<User | null>(null)

// Form Tambah User
const newUserName = ref('')
const newUserEmail = ref('')
const newUserRole = ref<UserRole>('student')
const newUserNimNidn = ref('')
const newUserPhone = ref('')
const newUserPassword = ref('')
const addUserError = ref<string | null>(null)
const addUserLoading = ref(false)

// Form Reset Password
const resetPasswordCustom = ref(false)
const customNewPassword = ref('')
const resetPasswordError = ref<string | null>(null)
const resetPasswordSuccess = ref<string | null>(null)
const resetPasswordLoading = ref(false)

// Notification Alert
const alertMessage = ref<string | null>(null)
const alertType = ref<'success' | 'error'>('success')

onMounted(async () => {
  await userStore.fetchUsers()
})

// Filtered Users List
const filteredUsers = computed(() => {
  let list = userStore.users

  if (selectedRole.value !== 'all') {
    list = list.filter(u => u.role === selectedRole.value)
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.nimNidn && u.nimNidn.toLowerCase().includes(q))
    )
  }

  return list
})

// Modal Actions
const openAddModal = () => {
  newUserName.value = ''
  newUserEmail.value = ''
  newUserRole.value = 'student'
  newUserNimNidn.value = ''
  newUserPhone.value = ''
  newUserPassword.value = ''
  addUserError.value = null
  showAddUserModal.value = true
}

const handleAddUser = async () => {
  addUserError.value = null

  if (!newUserName.value.trim()) {
    addUserError.value = 'Nama lengkap civitas wajib diisi.'
    return
  }
  if (!newUserEmail.value.trim() || !newUserEmail.value.includes('@')) {
    addUserError.value = 'Email institusi valid wajib diisi.'
    return
  }

  addUserLoading.value = true
  try {
    const payload: CreateUserDto = {
      name: newUserName.value.trim(),
      email: newUserEmail.value.trim().toLowerCase(),
      role: newUserRole.value,
      nimNidn: newUserNimNidn.value.trim() || undefined,
      phoneNumber: newUserPhone.value.trim() || undefined,
      password: newUserPassword.value.trim() || 'Password123!'
    }

    await userStore.createUser(payload)
    showAddUserModal.value = false
    alertType.value = 'success'
    alertMessage.value = `Akun civitas baru '${payload.name}' (${payload.role.toUpperCase()}) berhasil didaftarkan.`
    setTimeout(() => { alertMessage.value = null }, 4000)
  } catch (err: unknown) {
    addUserError.value = err instanceof Error ? err.message : 'Gagal menambahkan akun civitas.'
  } finally {
    addUserLoading.value = false
  }
}

const openResetModal = (user: User) => {
  if (isProtectedDemo(user.email)) {
    alertType.value = 'error'
    alertMessage.value = `Akun demo resmi '${user.email}' dilindungi oleh Protected Demo Account Guard. Kredensial tidak dapat direset.`
    setTimeout(() => { alertMessage.value = null }, 4000)
    return
  }

  selectedUserForReset.value = user
  resetPasswordCustom.value = false
  customNewPassword.value = ''
  resetPasswordError.value = null
  resetPasswordSuccess.value = null
  showResetPasswordModal.value = true
}

const handleResetPassword = async () => {
  if (!selectedUserForReset.value) return
  resetPasswordError.value = null
  resetPasswordSuccess.value = null

  const targetPassword = resetPasswordCustom.value
    ? customNewPassword.value.trim()
    : 'Password123!'

  if (resetPasswordCustom.value && (!targetPassword || targetPassword.length < 6)) {
    resetPasswordError.value = 'Kata sandi baru kustom minimal 6 karakter.'
    return
  }

  resetPasswordLoading.value = true
  try {
    const res = await userStore.resetUserPassword(selectedUserForReset.value.id, targetPassword)
    resetPasswordSuccess.value = res?.message || 'Kata sandi berhasil direset ke sandi default: Password123!'
    setTimeout(() => {
      showResetPasswordModal.value = false
      alertType.value = 'success'
      alertMessage.value = `Kata sandi untuk '${selectedUserForReset.value?.name}' berhasil diperbarui.`
      setTimeout(() => { alertMessage.value = null }, 4000)
    }, 1200)
  } catch (err: unknown) {
    resetPasswordError.value = err instanceof Error ? err.message : 'Gagal mereset kata sandi.'
  } finally {
    resetPasswordLoading.value = false
  }
}

const handleDeleteUser = async (user: User) => {
  if (isProtectedDemo(user.email)) {
    alertType.value = 'error'
    alertMessage.value = `Akun demo resmi '${user.email}' dilindungi dan tidak dapat dihapus.`
    setTimeout(() => { alertMessage.value = null }, 4000)
    return
  }

  if (!confirm(`Yakin ingin menghapus akun civitas '${user.name}' (${user.email})? Tindakan ini permanen.`)) {
    return
  }

  try {
    await userStore.deleteUser(user.id)
    alertType.value = 'success'
    alertMessage.value = `Akun civitas '${user.name}' berhasil dihapus dari sistem.`
    setTimeout(() => { alertMessage.value = null }, 4000)
  } catch (err: unknown) {
    alertType.value = 'error'
    alertMessage.value = err instanceof Error ? err.message : 'Gagal menghapus pengguna.'
    setTimeout(() => { alertMessage.value = null }, 4000)
  }
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
    <section class="bg-white rounded-sm border border-slate-200 space-y-4 overflow-hidden font-inter">
    <!-- Header Section -->
    <div class="px-5 pt-5 pb-1 flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h3 class="text-sm font-extrabold text-[#0F172A] font-jakarta">Manajemen Kredensial &amp; Akun Civitas</h3>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Pengelolaan terpusat identitas sivitas akademika ITW, penerbitan akun baru, dan pemulihan kredensial login.
        </p>
      </div>

      <!-- Banner Notification -->
      <div v-if="alertMessage" class="w-full">
        <div
          class="p-2.5 rounded-sm text-xs font-inter flex items-center justify-between"
          :class="alertType === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'"
        >
          <span class="flex items-center gap-1.5 font-medium">
            <span class="font-bold">{{ alertType === 'success' ? '✓' : '⨉' }}</span>
            <span>{{ alertMessage }}</span>
          </span>
          <button type="button" @click="alertMessage = null" class="text-slate-400 hover:text-slate-600 font-bold text-xs ml-2">Tutup</button>
        </div>
      </div>
    </div>

    <!-- Controls Bar: Filter Tabs + Search Input + Action Button Sebaris -->
    <div class="px-5 py-2.5 bg-slate-50/70 border-y border-slate-200 flex items-center justify-between gap-3 flex-wrap">
      <!-- Inline Filter Tabs dengan Total Count -->
      <div class="flex items-center gap-1 bg-white p-1 rounded-sm border border-slate-200 shrink-0">
        <button
          type="button"
          @click="selectedRole = 'all'"
          class="px-2.5 py-1 text-xs font-semibold rounded-xs transition flex items-center gap-1.5"
          :class="selectedRole === 'all'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'"
        >
          <span>Semua</span>
          <span class="font-mono text-[10px] px-1 py-0.2 rounded-xs" :class="selectedRole === 'all' ? 'bg-slate-800 text-teal-300' : 'bg-slate-200/70 text-slate-600'">
            {{ userStore.totalUsers }}
          </span>
        </button>

        <button
          type="button"
          @click="selectedRole = 'lecturer'"
          class="px-2.5 py-1 text-xs font-semibold rounded-xs transition flex items-center gap-1.5"
          :class="selectedRole === 'lecturer'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'"
        >
          <span>Dosen</span>
          <span class="font-mono text-[10px] px-1 py-0.2 rounded-xs" :class="selectedRole === 'lecturer' ? 'bg-slate-800 text-teal-300' : 'bg-slate-200/70 text-slate-600'">
            {{ userStore.lecturerCount }}
          </span>
        </button>

        <button
          type="button"
          @click="selectedRole = 'student'"
          class="px-2.5 py-1 text-xs font-semibold rounded-xs transition flex items-center gap-1.5"
          :class="selectedRole === 'student'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'"
        >
          <span>Mahasiswa</span>
          <span class="font-mono text-[10px] px-1 py-0.2 rounded-xs" :class="selectedRole === 'student' ? 'bg-slate-800 text-teal-300' : 'bg-slate-200/70 text-slate-600'">
            {{ userStore.studentCount }}
          </span>
        </button>

        <button
          type="button"
          @click="selectedRole = 'admin'"
          class="px-2.5 py-1 text-xs font-semibold rounded-xs transition flex items-center gap-1.5"
          :class="selectedRole === 'admin'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'"
        >
          <span>Admin</span>
          <span class="font-mono text-[10px] px-1 py-0.2 rounded-xs" :class="selectedRole === 'admin' ? 'bg-slate-800 text-teal-300' : 'bg-slate-200/70 text-slate-600'">
            {{ userStore.adminCount }}
          </span>
        </button>
      </div>

      <!-- Right: Search Input + Add Button Sebaris -->
      <div class="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
        <div class="relative w-full sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama, email, NIM/NIDN..."
            class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]"
          />
          <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          type="button"
          @click="openAddModal"
          class="px-3.5 py-1.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-jakarta font-bold text-xs rounded-sm transition flex items-center gap-1.5 shrink-0 shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Akun Civitas</span>
        </button>
      </div>
    </div>

    <!-- Tabel Akun Civitas -->
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left font-inter">
        <thead class="bg-slate-50 text-slate-700 font-mono font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th class="py-2.5 px-5">Nama &amp; Email Civitas</th>
            <th class="py-2.5 px-3">Peran</th>
            <th class="py-2.5 px-3">NIM / NIDN</th>
            <th class="py-2.5 px-3 text-center">Status</th>
            <th class="py-2.5 px-5 text-right">Kredensial &amp; Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-sans">
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-slate-50/70 transition">
            <!-- Nama & Email -->
            <td class="py-2.5 px-5">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-7 h-7 rounded-sm flex items-center justify-center font-bold text-white text-[11px] font-jakarta shrink-0"
                  :class="{
                    'bg-[#1E3A8A]': user.role === 'admin',
                    'bg-[#0D9488]': user.role === 'lecturer',
                    'bg-slate-600': user.role === 'student'
                  }"
                >
                  {{ user.name.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-[#0F172A] font-jakarta truncate max-w-[220px]">{{ user.name }}</p>
                  <p class="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">{{ user.email }}</p>
                </div>
              </div>
            </td>

            <!-- Peran Badge -->
            <td class="py-2.5 px-3">
              <span
                class="inline-block px-2 py-0.5 rounded-xs font-mono font-bold text-[10px] tracking-wider uppercase border"
                :class="{
                  'bg-blue-50 text-[#1E3A8A] border-blue-200': user.role === 'admin',
                  'bg-teal-50 text-[#0D9488] border-teal-200': user.role === 'lecturer',
                  'bg-slate-100 text-slate-700 border-slate-200': user.role === 'student'
                }"
              >
                {{ user.role === 'admin' ? 'ADMIN' : user.role === 'lecturer' ? 'DOSEN' : 'MAHASISWA' }}
              </span>
            </td>

            <!-- NIM / NIDN -->
            <td class="py-2.5 px-3 font-mono text-slate-600 font-semibold">
              {{ user.nimNidn || '—' }}
            </td>

            <!-- Status -->
            <td class="py-2.5 px-3 text-center">
              <span
                class="inline-flex items-center gap-1 text-[11px] font-semibold"
                :class="user.isActive ? 'text-emerald-700' : 'text-slate-400'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="user.isActive ? 'bg-[#16A34A]' : 'bg-slate-300'"></span>
                <span>{{ user.isActive ? 'Aktif' : 'Non-aktif' }}</span>
              </span>
            </td>

            <!-- Kredensial & Aksi -->
            <td class="py-2.5 px-5 text-right">
              <!-- Jika Akun Demo Resmi ITW: Badge Monochrome Line-Art SVG (No Emoji!) -->
              <div v-if="isProtectedDemo(user.email)" class="inline-flex items-center justify-end">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-100 border border-slate-300 text-slate-700 font-mono font-bold text-[10px] tracking-wider uppercase shadow-none"
                  title="Kredensial akun demo dilindungi secara permanen untuk menjamin kelancaran simulasi 1-klik login ITW."
                >
                  <!-- Monochrome line-art SVG lock icon -->
                  <svg class="w-3 h-3 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>AKUN DEMO RESMI</span>
                </span>
              </div>

              <!-- Jika Akun Non-Demo: Tombol Reset Sandi & Hapus -->
              <div v-else class="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  @click="openResetModal(user)"
                  class="px-2.5 py-1 text-[11px] font-semibold text-[#1E3A8A] hover:bg-blue-50 border border-blue-200 rounded-sm transition flex items-center gap-1"
                  title="Reset kata sandi pengguna"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset Sandi</span>
                </button>

                <button
                  type="button"
                  @click="handleDeleteUser(user)"
                  class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-sm transition"
                  title="Hapus akun"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="5" class="py-8 text-center text-xs text-slate-400 font-inter">
              Tidak ada data akun civitas yang sesuai dengan kriteria filter.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tambah Akun Civitas -->
    <Teleport to="body">
      <div
        v-if="showAddUserModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none"
        @click.self="showAddUserModal = false"
      >
        <div class="max-w-md w-full bg-white border border-slate-200 rounded-sm shadow-2xl overflow-hidden font-inter text-slate-800">
          <div class="px-5 py-4 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between text-white">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-sm bg-[#1E3A8A] border border-teal-500/40 flex items-center justify-center font-mono font-bold text-xs text-white">
                ITW
              </div>
              <div>
                <h3 class="text-sm font-extrabold font-jakarta tracking-tight">Pendaftaran Akun Civitas Baru</h3>
                <p class="text-[10px] font-mono text-teal-400">Direktorat TI &amp; Admin Akademik ITW</p>
              </div>
            </div>
            <button type="button" @click="showAddUserModal = false" class="text-slate-400 hover:text-white p-1 rounded-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form @submit.prevent="handleAddUser" class="p-5 space-y-3.5 text-xs">
            <div v-if="addUserError" class="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-sm text-[11px]">
              {{ addUserError }}
            </div>

            <div class="space-y-1">
              <label class="block font-bold text-slate-700 uppercase font-mono text-[10px] tracking-wider">Nama Lengkap</label>
              <input v-model="newUserName" type="text" placeholder="misal: Dr. Budi Santoso / Anita Rahayu" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]" required />
            </div>

            <div class="space-y-1">
              <label class="block font-bold text-slate-700 uppercase font-mono text-[10px] tracking-wider">Email Institusi Resmi</label>
              <input v-model="newUserEmail" type="email" placeholder="nama@wakanda.ac.id" class="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]" required />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block font-bold text-slate-700 uppercase font-mono text-[10px] tracking-wider">Peran Civitas</label>
                <select v-model="newUserRole" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]">
                  <option value="student">Mahasiswa</option>
                  <option value="lecturer">Dosen Pengampu</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="block font-bold text-slate-700 uppercase font-mono text-[10px] tracking-wider">NIM / NIDN</label>
                <input v-model="newUserNimNidn" type="text" placeholder="misal: 13523001 / 041508" class="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="block font-bold text-slate-700 uppercase font-mono text-[10px] tracking-wider">Kata Sandi Awal (Opsional)</label>
              <input v-model="newUserPassword" type="text" placeholder="Kosongkan untuk default: Password123!" class="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]" />
              <p class="text-[10px] text-slate-500">Jika dikosongkan, kata sandi awal otomatis diatur ke <span class="font-mono font-bold text-slate-700">Password123!</span></p>
            </div>

            <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" @click="showAddUserModal = false" class="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-sm">Batal</button>
              <button type="submit" :disabled="addUserLoading" class="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-sm disabled:opacity-60">
                {{ addUserLoading ? 'Menyimpan...' : 'Daftarkan Akun' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Reset Kata Sandi -->
    <Teleport to="body">
      <div
        v-if="showResetPasswordModal && selectedUserForReset"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none"
        @click.self="showResetPasswordModal = false"
      >
        <div class="max-w-md w-full bg-white border border-slate-200 rounded-sm shadow-2xl overflow-hidden font-inter text-slate-800">
          <div class="px-5 py-4 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between text-white">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-sm bg-[#1E3A8A] border border-teal-500/40 flex items-center justify-center font-mono font-bold text-xs text-white">
                ITW
              </div>
              <div>
                <h3 class="text-sm font-extrabold font-jakarta tracking-tight">Reset Kata Sandi Akun</h3>
                <p class="text-[10px] font-mono text-teal-400">Pemulihan Kredensial Pengguna</p>
              </div>
            </div>
            <button type="button" @click="showResetPasswordModal = false" class="text-slate-400 hover:text-white p-1 rounded-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="p-5 space-y-4 text-xs">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
              <p class="font-bold text-[#0F172A] font-jakarta">{{ selectedUserForReset.name }}</p>
              <p class="text-slate-500 font-mono text-[11px]">{{ selectedUserForReset.email }} • {{ selectedUserForReset.role.toUpperCase() }}</p>
            </div>

            <div v-if="resetPasswordError" class="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-sm text-[11px]">
              {{ resetPasswordError }}
            </div>

            <div v-if="resetPasswordSuccess" class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-sm text-[11px]">
              {{ resetPasswordSuccess }}
            </div>

            <div class="space-y-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" :value="false" v-model="resetPasswordCustom" class="text-[#1E3A8A] focus:ring-[#0D9488]" />
                <span class="font-medium text-slate-800">Reset ke kata sandi standar (<code class="font-mono font-bold text-[#1E3A8A]">Password123!</code>)</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" :value="true" v-model="resetPasswordCustom" class="text-[#1E3A8A] focus:ring-[#0D9488]" />
                <span class="font-medium text-slate-800">Tentukan kata sandi baru kustom</span>
              </label>

              <div v-if="resetPasswordCustom" class="pt-1 space-y-1">
                <input
                  v-model="customNewPassword"
                  type="text"
                  placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                  class="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" @click="showResetPasswordModal = false" class="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-sm">Batal</button>
              <button
                type="button"
                @click="handleResetPassword"
                :disabled="resetPasswordLoading"
                class="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-sm disabled:opacity-60 flex items-center gap-1.5"
              >
                <span v-if="resetPasswordLoading" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ resetPasswordLoading ? 'Mereset...' : 'Konfirmasi Reset Sandi' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
  </div>
</template>
