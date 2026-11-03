<script setup lang="ts">
import WorkspaceShell from '~/components/workspace/WorkspaceShell.vue'
import SessionWorkspace from '~/components/workspace/SessionWorkspace.vue'
import AttendanceRecapView from '~/components/workspace/AttendanceRecapView.vue'
import AssignmentRecapView from '~/components/workspace/AssignmentRecapView.vue'
import GradebookView from '~/components/workspace/GradebookView.vue'
import EwsDashboardView from '~/components/workspace/EwsDashboardView.vue'
import { buildWorkspaceNav, defaultSectionFor } from '~/utils/workspaceNav'

definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'lecturer'
})

const sections = buildWorkspaceNav('lecturer')
const defaultSection = defaultSectionFor('lecturer')
</script>

<template>
  <WorkspaceShell :sections="sections" :default-section="defaultSection">
    <template #default="{ section }">
      <SessionWorkspace v-if="section === 'sessions'" />
      <AttendanceRecapView v-else-if="section === 'attendance'" />
      <AssignmentRecapView v-else-if="section === 'assignments'" />
      <GradebookView v-else-if="section === 'grades'" />
      <EwsDashboardView v-else-if="section === 'ews'" />
    </template>
  </WorkspaceShell>
</template>
