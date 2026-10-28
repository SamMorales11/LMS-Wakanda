<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGradebookStore } from '~/stores/useGradebookStore'
import { useAcademicStore } from '~/stores/useAcademicStore'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const gradebookStore = useGradebookStore()
const academicStore = useAcademicStore()

const loadLogs = async () => {
  const classId = academicStore.selectedClassId
  if (classId) {
    await gradebookStore.fetchAuditLogs(classId)
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadLogs()
  },
  { immediate: true }
)

const logs = computed(() => gradebookStore.auditLogs)

const formatDateTime = (isoString: string) => {
  try {
    const d = new Date(isoString)
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoString
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-deep-ink/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none overflow-y-auto"
  >
    <div class="max-w-4xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[85vh] flex flex-col">
      <!-- Header Modal -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <div>
          <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            Jejak Audit Keamanan Nilai
          </span>
          <h3 class="text-xl font-bold text-academic-navy font-jakarta mt-1">
            Riwayat Audit Log Perubahan Nilai Kelas
          </h3>
          <p class="text-xs text-slate-500 font-inter mt-0.5">
            Log permanen yang mencatat identitas pengubah, alasan revisi, nilai sebelum & sesudah, serta IP Address.
          </p>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tabel Audit Log (Scrollable) -->
      <div class="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
        <div v-if="logs.length === 0" class="p-8 text-center text-slate-400 font-inter text-xs">
          Belum ada riwayat perubahan nilai manual pada kelas ini.
        </div>

        <table v-else class="w-full text-left text-xs font-inter border-collapse">
          <thead class="bg-slate-50 text-slate-600 font-semibold font-jakarta sticky top-0 border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Waktu</th>
              <th class="py-3 px-4">Mahasiswa</th>
              <th class="py-3 px-4">Perubahan Nilai</th>
              <th class="py-3 px-4">Huruf Mutu</th>
              <th class="py-3 px-4">Alasan Perubahan</th>
              <th class="py-3 px-4">Dosen / IP</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-50/70 transition">
              <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                {{ formatDateTime(log.createdAt) }}
              </td>

              <td class="py-3 px-4">
                <div class="font-bold text-deep-ink font-jakarta">{{ log.studentName }}</div>
                <div class="font-mono text-[10px] text-slate-400">{{ log.studentNim || '-' }}</div>
              </td>

              <td class="py-3 px-4 font-mono whitespace-nowrap">
                <span class="text-slate-400 line-through mr-1">
                  {{ log.previousScore !== null ? log.previousScore : '0.00' }}
                </span>
                <span class="text-scholarly-teal font-bold">
                  → {{ log.newScore.toFixed(2) }}
                </span>
              </td>

              <td class="py-3 px-4 font-mono whitespace-nowrap">
                <span class="text-slate-400 mr-1">
                  {{ log.previousLetter || '-' }}
                </span>
                <span class="font-bold text-semantic-success">
                  → {{ log.newLetter }}
                </span>
              </td>

              <td class="py-3 px-4 text-slate-700 max-w-xs">
                <p class="leading-relaxed text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {{ log.reason }}
                </p>
              </td>

              <td class="py-3 px-4 text-[11px] whitespace-nowrap">
                <div class="font-semibold text-academic-navy">{{ log.changedByName }}</div>
                <div class="font-mono text-[10px] text-slate-400">{{ log.ipAddress || '127.0.0.1' }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Modal -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-200 shrink-0">
        <span class="text-[11px] font-mono text-slate-500">
          Total Rekaman: {{ logs.length }} entri
        </span>

        <button
          type="button"
          @click="emit('close')"
          class="px-5 py-2 rounded-xl bg-academic-navy text-white font-bold text-xs font-jakarta hover:bg-blue-900 transition shadow-xs"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
