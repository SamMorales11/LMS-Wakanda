<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Tampilkan NIDN di samping nama. */
    showNidn?: boolean
    /** Tampilkan alamat email repositories. */
    showEmail?: boolean
  }>(),
  {
    showNidn: false,
    showEmail: false
  }
)

// Sumber tunggal nama dosen pengampu kelas
const lecturer = usePrimaryLecturer()
</script>

<template>
  <span class="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
    <span class="font-semibold text-slate-800">{{ lecturer.name }}</span>
    <span v-if="props.showNidn" class="font-mono text-[11px] text-slate-500">
      NIDN {{ lecturer.nimNidn }}
    </span>
    <span v-if="props.showEmail" class="font-mono text-[11px] text-slate-500 truncate">
      {{ lecturer.email }}
    </span>
  </span>
</template>
