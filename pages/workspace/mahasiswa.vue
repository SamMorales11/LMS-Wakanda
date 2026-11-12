<script setup lang="ts">
import StudentWorkspaceShell from '~/components/workspace/StudentWorkspaceShell.vue'
import StudentSessionWorkspace from '~/components/workspace/StudentSessionWorkspace.vue'
import AttendanceRecapView from '~/components/workspace/AttendanceRecapView.vue'
import AssignmentRecapView from '~/components/workspace/AssignmentRecapView.vue'
import StudentGradesView from '~/components/workspace/StudentGradesView.vue'
import { buildWorkspaceNav, defaultSectionFor } from '~/utils/workspaceNav'

definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'student'
})

const sections = buildWorkspaceNav('student')
const defaultSection = defaultSectionFor('student')
</script>

<template>
  <StudentWorkspaceShell :sections="sections" :default-section="defaultSection">
    <template #default="{ section }">
      <StudentSessionWorkspace v-if="section === 'sessions'" />
      <div v-else-if="section === 'attendance'" class="flex-1 overflow-y-auto">
        <AttendanceRecapView />
      </div>
      <div v-else-if="section === 'assignments'" class="flex-1 overflow-y-auto">
        <AssignmentRecapView />
      </div>
      <div v-else-if="section === 'grades'" class="flex-1 overflow-y-auto">
        <StudentGradesView />
      </div>
    </template>
  </StudentWorkspaceShell>
</template>
