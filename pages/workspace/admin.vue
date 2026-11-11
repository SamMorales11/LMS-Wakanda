<script setup lang="ts">
import WorkspaceShell from '~/components/workspace/WorkspaceShell.vue'
import AdminOverviewView from '~/components/workspace/AdminOverviewView.vue'
import AdminUserManagement from '~/components/workspace/AdminUserManagement.vue'
import AdminClassListView from '~/components/workspace/AdminClassListView.vue'
import { buildWorkspaceNav, defaultSectionFor } from '~/utils/workspaceNav'

definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'admin'
})

const sections = buildWorkspaceNav('admin')
const defaultSection = defaultSectionFor('admin')
</script>

<template>
  <WorkspaceShell :sections="sections" :default-section="defaultSection">
    <template #default="{ section }">
      <AdminOverviewView v-if="section === 'overview'" />
      <AdminUserManagement v-else-if="section === 'directory'" />
      <AdminClassListView v-else-if="section === 'classes-list'" />
    </template>
  </WorkspaceShell>
</template>
