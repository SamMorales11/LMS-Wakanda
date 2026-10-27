<script setup lang="ts">
import { ref } from 'vue'
import type { SessionAttendanceOverviewDto, AttendanceStatus } from '~/types'
import { useAttendanceStore } from '~/stores/useAttendanceStore'

const props = defineProps<{
  isOpen: boolean
  overview: SessionAttendanceOverviewDto | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const attendanceStore = useAttendanceStore()
const updatingStudentId = ref<string | null>(null)
const actionError = ref<string | null>(null)

const handleUpdateStatus = async (studentId: string, status: AttendanceStatus) => {
  if (!props.overview) return
  updatingStudentId.value = studentId
  actionError.value = null

  try {
    await attendanceStore.manualUpdate(props.overview.sessionId, studentId, status)
    emit('updated')
  } catch (err: any) {
    actionError.value = err.message || 'Gagal mengubah status presensi'
  } finally {
    updatingStudentId.value = null
  }
}
</script>

<template>
  <div
    v-if="isOpen && overview"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-xs transition-opacity"
    @click.self="emit('close')"
  >
    <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="bg-academic-navy text-white p-4 flex items-center justify-between shrink-0">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-bold">
            Manajemen Presensi Manual Sesi {{ overview.sessionNumber }}
          </span>
          <h3 class="text-sm font-bold font-jakarta line-clamp-1">
            {{ overview.sessionTitle || `Pertemuan #${overview.sessionNumber}` }}
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

      <!-- Stats Bar -->
      <div class="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between text-xs font-inter shrink-0">
        <div class="flex items-center gap-4">
          <span class="text-slate-600">Total Terdaftar: <strong class="text-academic-navy font-mono">{{ overview.totalEnrolled }}</strong></span>
          <span class="text-semantic-success">Hadir: <strong class="font-mono">{{ overview.presentCount }}</strong></span>
          <span class="text-amber-alert">Terlambat: <strong class="font-mono">{{ overview.lateCount }}</strong></span>
          <span class="text-blue-600">Izin/Sakit: <strong class="font-mono">{{ overview.permitCount + overview.sickCount }}</strong></span>
          <span class="text-semantic-danger">Alfa: <strong class="font-mono">{{ overview.absentCount }}</strong></span>
        </div>
      </div>

      <!-- Alert Error -->
      <div v-if="actionError" class="p-3 bg-red-50 text-semantic-danger text-xs border-b border-red-200 font-inter">
        {{ actionError }}
      </div>

      <!-- Body: Student Logs Table -->
      <div class="overflow-y-auto p-4 flex-1">
        <div v-if="!overview.logs || overview.logs.length === 0" class="text-center py-10 text-slate-400 text-xs">
          Belum ada catatan presensi mahasiswa pada sesi ini.
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="log in overview.logs"
            :key="log.id"
            class="py-3 flex items-center justify-between gap-3 text-xs"
          >
            <div class="min-w-0 flex-1">
              <p class="font-bold text-academic-navy font-jakarta truncate">
                {{ log.studentName || 'Mahasiswa' }}
              </p>
              <div class="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>NIM: {{ log.studentNim || '-' }}</span>
                <span>•</span>
                <span>Metode: {{ log.checkInMethod }}</span>
              </div>
            </div>

            <!-- Status Badge & Action Buttons -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                @click="handleUpdateStatus(log.studentId, 'PRESENT')"
                :disabled="updatingStudentId === log.studentId"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition"
                :class="log.status === 'PRESENT'
                  ? 'bg-semantic-success text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'"
              >
                Hadir
              </button>

              <button
                type="button"
                @click="handleUpdateStatus(log.studentId, 'LATE')"
                :disabled="updatingStudentId === log.studentId"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition"
                :class="log.status === 'LATE'
                  ? 'bg-amber-alert text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'"
              >
                Terlambat
              </button>

              <button
                type="button"
                @click="handleUpdateStatus(log.studentId, 'PERMIT')"
                :disabled="updatingStudentId === log.studentId"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition"
                :class="log.status === 'PERMIT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'"
              >
                Izin
              </button>

              <button
                type="button"
                @click="handleUpdateStatus(log.studentId, 'SICK')"
                :disabled="updatingStudentId === log.studentId"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition"
                :class="log.status === 'SICK'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700'"
              >
                Sakit
              </button>

              <button
                type="button"
                @click="handleUpdateStatus(log.studentId, 'ABSENT')"
                :disabled="updatingStudentId === log.studentId"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition"
                :class="log.status === 'ABSENT'
                  ? 'bg-semantic-danger text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700'"
              >
                Alfa
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl bg-academic-navy hover:bg-blue-900 text-white text-xs font-semibold font-jakarta transition"
        >
          Selesai
        </button>
      </div>
    </div>
  </div>
</template>
