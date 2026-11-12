<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useAcademicStore } from '~/stores/useAcademicStore'
import StudentTopNav from './StudentTopNav.vue'
import OnlineExamModal from './OnlineExamModal.vue'
import type { WorkspaceNavItem, WorkspaceSectionId } from '~/utils/workspaceNav'

const props = defineProps<{
  sections: WorkspaceNavItem[]
  defaultSection: WorkspaceSectionId
}>()

const authStore = useAuthStore()
const academicStore = useAcademicStore()

const activeSection = ref<WorkspaceSectionId>(props.defaultSection)

watch(
  () => props.defaultSection,
  (val) => {
    activeSection.value = val
  }
)

onMounted(async () => {
  await Promise.all([
    authStore.fetchUser(),
    academicStore.initWorkspace()
  ])
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased">
    <!-- Top Navigation Bar Khusus Mahasiswa -->
    <StudentTopNav
      :sections="sections"
      :active-section="activeSection"
      @update:active-section="(section) => activeSection = section"
    />

    <!-- Main Learning Canvas -->
    <main class="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-hidden relative">
      <!-- Subtle Architectural Grid Pattern -->
      <div
        class="absolute inset-0 pointer-events-none z-0"
        style="
          background-image:
            linear-gradient(to right, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
          background-size: 24px 24px;
        "
      ></div>

      <!-- Container Slot Konten (sessions: 3-kolom; tab lain: full-width bersih) -->
      <div class="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        <slot :section="activeSection"></slot>
      </div>
    </main>

    <!-- Modal Ujian Daring Mahasiswa Global -->
    <OnlineExamModal />
  </div>
</template>
