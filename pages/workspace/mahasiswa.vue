<script setup lang="ts">
import WorkspaceShell from '~/components/workspace/WorkspaceShell.vue'
import SessionWorkspace from '~/components/workspace/SessionWorkspace.vue'
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
  <WorkspaceShell :sections="sections" :default-section="defaultSection">
    <template #default="{ section }">
      <SessionWorkspace v-if="section === 'sessions'" />
      <AttendanceRecapView v-else-if="section === 'attendance'" />
      <AssignmentRecapView v-else-if="section === 'assignments'" />
      <StudentGradesView v-else-if="section === 'grades'" />
    </template>
  </WorkspaceShell>
</template>
