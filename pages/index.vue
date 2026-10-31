<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIntersectionObserver, useTransition, TransitionPresets } from '@vueuse/core'
import {
  ShieldCheck,
  BookOpen,
  Zap,
  AlertTriangle,
  Shield,
  Calendar,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Layers,
  Lock,
  Menu,
  X
} from 'lucide-vue-next'
import { useAuthStore } from '~/stores/useAuthStore'
import InteractiveGraphHero from '~/components/landing/InteractiveGraphHero.vue'

const router = useRouter()
const authStore = useAuthStore()

// State Filter Silabus Perkuliahan (Sesi 1-8 Pra-UTS vs Sesi 9-16 Pasca-UTS)
const activeCurriculumPhase = ref<'all' | 'midterm' | 'final'>('all')
const isMobileNavOpen = ref(false)

// Telemetri Animated Reactive Counter via @vueuse/core
const telemetrySectionRef = ref<HTMLElement | null>(null)
const hasAnimatedTelemetry = ref(false)
const rawSessions = ref(0)
const rawLatency = ref(0)

const displaySessions = useTransition(rawSessions, {
  duration: 1200,
  transition: TransitionPresets.easeOutCubic
})

const displayLatency = useTransition(rawLatency, {
  duration: 1400,
  transition: TransitionPresets.easeOutCubic
})

useIntersectionObserver(telemetrySectionRef, ([entry]) => {
  if (entry?.isIntersecting && !hasAnimatedTelemetry.value) {
    hasAnimatedTelemetry.value = true
    rawSessions.value = 16
    rawLatency.value = 186
  }
})

// 16 Pertemuan IF2041 Struktur Data & Algoritma (Kurikulum Resmi ITW)
interface SyllabusSession {
  sessionNumber: number
  title: string
  category: 'Teori & Lab' | 'Tugas Besar' | 'Kuis & Praktikum' | 'Evaluasi Tengah Semester' | 'Evaluasi Akhir Semester'
  topics: string[]
  badge: 'UTS' | 'UAS' | 'KUIS' | 'TUGAS' | 'MATERI'
  phase: 'midterm' | 'final'
}

const syllabusSessions: SyllabusSession[] = [
  {
    sessionNumber: 1,
    title: 'Paradigma Abstract Data Type (ADT) & Memory Management',
    category: 'Teori & Lab',
    topics: ['Prinsip Enkapsulasi Modular', 'Struktur Data Statis vs Dinamis', 'Pointer Memory Addressing di C/TypeScript'],
    badge: 'MATERI',
    phase: 'midterm'
  },
  {
    sessionNumber: 2,
    title: 'Array Dinamis, Amortized Analysis & Dynamic Sizing',
    category: 'Teori & Lab',
    topics: ['Geometric Expansion Factor', 'Amortized Time Complexity O(1)', 'Alokasi Memori Heap vs Stack'],
    badge: 'MATERI',
    phase: 'midterm'
  },
  {
    sessionNumber: 3,
    title: 'Single & Doubly Linked List dengan Sentinel Nodes',
    category: 'Kuis & Praktikum',
    topics: ['Operasi Insert & Delete O(1)', 'Circular Linked List', 'Sentinel Nodes Pattern'],
    badge: 'KUIS',
    phase: 'midterm'
  },
  {
    sessionNumber: 4,
    title: 'Stack & Queue: Operasi Push-Pop & Circular Buffering',
    category: 'Tugas Besar',
    topics: ['LIFO & FIFO Architecture', 'Ring Buffer Queue', 'Aplikasi Parser Ekspresi Infix-Postfix'],
    badge: 'TUGAS',
    phase: 'midterm'
  },
  {
    sessionNumber: 5,
    title: 'Rekursi, Call Stack Frame & Divide-and-Conquer',
    category: 'Teori & Lab',
    topics: ['Base Case & Recursive Step', 'Stack Overflow Mitigation', 'Master Theorem for Divide-and-Conquer'],
    badge: 'MATERI',
    phase: 'midterm'
  },
  {
    sessionNumber: 6,
    title: 'Struktur Hirarkis: Binary Tree & Tree Traversals',
    category: 'Teori & Lab',
    topics: ['In-Order, Pre-Order, Post-Order', 'Level-Order Traversal dengan Queue', 'Kedalaman & Keseimbangan Pohon'],
    badge: 'MATERI',
    phase: 'midterm'
  },
  {
    sessionNumber: 7,
    title: 'Binary Search Tree (BST) & Algoritma Rebalancing',
    category: 'Kuis & Praktikum',
    topics: ['Sifat Keterurutan BST', 'Operasi Search, Insert, Delete Node', 'Degradasi Menjadi Linked List'],
    badge: 'KUIS',
    phase: 'midterm'
  },
  {
    sessionNumber: 8,
    title: 'Evaluasi Tengah Semester (UTS Terstandarisasi)',
    category: 'Evaluasi Tengah Semester',
    topics: ['Ujian Teori & Implementasi Mandiri', 'Analisis Kompleksitas Sesi 1-7', 'Validasi Anti-Plagiasi Kode'],
    badge: 'UTS',
    phase: 'midterm'
  },
  {
    sessionNumber: 9,
    title: 'Self-Balancing Trees: AVL Trees & Red-Black Invariants',
    category: 'Teori & Lab',
    topics: ['Rotasi Tunggal (LL/RR) & Ganda (LR/RL)', 'Balance Factor Calculation', 'Pemberian Warna Node Red-Black'],
    badge: 'MATERI',
    phase: 'final'
  },
  {
    sessionNumber: 10,
    title: 'Graf: Representasi Adjacency Matrix & Adjacency List',
    category: 'Tugas Besar',
    topics: ['Directed vs Undirected Graphs', 'Weighted Edges Representation', 'Token Presensi Sesi 10 Aktif (481920)'],
    badge: 'TUGAS',
    phase: 'final'
  },
  {
    sessionNumber: 11,
    title: 'Algoritma Penelusuran Graf: Breadth-First & Depth-First Search',
    category: 'Teori & Lab',
    topics: ['Eksplorasi Tingkat dengan Queue (BFS)', 'Penelusuran Mendalam dengan Stack/Rekursi (DFS)', 'Deteksi Siklus pada Graf'],
    badge: 'MATERI',
    phase: 'final'
  },
  {
    sessionNumber: 12,
    title: 'Shortest Path Algorithms: Dijkstra & Bellman-Ford',
    category: 'Kuis & Praktikum',
    topics: ['Algoritma Greedy Dijkstra dengan Min-Heap', 'Relaksasi Edge & Deteksi Negative Cycle', 'Aplikasi Routing Jaringan'],
    badge: 'KUIS',
    phase: 'final'
  },
  {
    sessionNumber: 13,
    title: 'Hash Tables, Hash Functions & Collision Resolution',
    category: 'Teori & Lab',
    topics: ['Separate Chaining vs Open Addressing', 'Linear/Quadratic Probing & Double Hashing', 'Load Factor & Rehashing Dynamic'],
    badge: 'MATERI',
    phase: 'final'
  },
  {
    sessionNumber: 14,
    title: 'Binary Heaps, Priority Queues & HeapSort',
    category: 'Teori & Lab',
    topics: ['Max-Heap & Min-Heap Array Storage', 'Operasi Sift-Up & Sift-Down', 'Algoritma HeapSort O(n log n) In-Place'],
    badge: 'MATERI',
    phase: 'final'
  },
  {
    sessionNumber: 15,
    title: 'Pemrograman Dinamis: Memoization & Tabulation Strategy',
    category: 'Tugas Besar',
    topics: ['Optimal Substructure & Overlapping Subproblems', 'Pendekatan Top-Down vs Bottom-Up', 'Knapsack Problem & String Alignment'],
    badge: 'TUGAS',
    phase: 'final'
  },
  {
    sessionNumber: 16,
    title: 'Evaluasi Akhir Semester (UAS & Penutupan Nilai Gradebook)',
    category: 'Evaluasi Akhir Semester',
    topics: ['Ujian Komprehensif Seluruh Silabus', 'Perhitungan Nilai Akhir Indeks A-E', 'Sinkronisasi BAA Laporan Berita Acara'],
    badge: 'UAS',
    phase: 'final'
  }
]

// Computed Silabus Berdasarkan Filter Tab
const filteredSessions = computed(() => {
  if (activeCurriculumPhase.value === 'midterm') {
    return syllabusSessions.filter(s => s.phase === 'midterm')
  }
  if (activeCurriculumPhase.value === 'final') {
    return syllabusSessions.filter(s => s.phase === 'final')
  }
  return syllabusSessions
})

// Navigasi Action Masuk
const handleNavigateWorkspace = () => {
  if (authStore.isAuthenticated) {
    router.push('/workspace')
  } else {
    router.push('/login')
  }
}

onMounted(async () => {
  if (!authStore.isInitialized) {
    await authStore.fetchUser()
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col selection:bg-[#0D9488]/20 selection:text-[#0D9488] relative overflow-x-hidden font-inter">
    <!-- Architectural Drafting Grid Overlay with Subtle Layering -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      style="
        background-image:
          linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
        background-size: 24px 24px;
      "
    ></div>

    <!-- ============================================================== -->
    <!-- TOP NAVIGATION BAR: SWISS MINIMALIST EDITORIAL BAR (DARK NAVY) -->
    <!-- ============================================================== -->
    <header class="border-b border-slate-800 bg-[#0B132B]/95 backdrop-blur-md sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Brand & Institutional Identity -->
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 bg-[#1E3A8A] text-white flex items-center justify-center font-mono font-bold text-xs tracking-wider border border-teal-500/40 rounded-sm shrink-0 shadow-sm">
            ITW
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-extrabold tracking-tight font-jakarta text-white">
                Institut Teknologi Wakanda
              </span>
              <span class="text-slate-600 hidden sm:inline">/</span>
              <span class="text-xs text-teal-400 font-mono hidden sm:inline">
                WAS Portal
              </span>
            </div>
          </div>
        </div>

        <!-- Desktop Navigation Anchor Links -->
        <nav class="hidden lg:flex items-center space-x-6 text-xs font-medium font-inter text-slate-300">
          <a href="#kurikulum" class="hover:text-teal-400 transition-colors">Silabus 16 Pertemuan</a>
          <a href="#telemetri" class="hover:text-teal-400 transition-colors">Telemetri &amp; Metrik</a>
          <a href="#pilar" class="hover:text-teal-400 transition-colors">3 Pilar Ekosistem</a>
        </nav>

        <!-- Right Action Group -->
        <div class="flex items-center space-x-3">
          <!-- Auth CTA Button -->
          <button
            type="button"
            @click="handleNavigateWorkspace"
            class="h-9 px-3.5 sm:px-4 bg-[#0D9488] hover:bg-teal-700 active:bg-teal-800 text-white font-jakarta font-bold text-xs tracking-wide transition-all border border-teal-400/40 rounded-sm flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span v-if="authStore.isAuthenticated" class="truncate max-w-[120px] sm:max-w-none">
              Workspace ({{ authStore.displayName }})
            </span>
            <span v-else>
              Masuk ke Workspace
            </span>
            <ArrowRight class="w-3.5 h-3.5 shrink-0" />
          </button>

          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            @click="isMobileNavOpen = !isMobileNavOpen"
            class="p-2 text-slate-300 hover:text-white lg:hidden border border-slate-700 rounded-sm"
            aria-label="Toggle menu"
          >
            <X v-if="isMobileNavOpen" class="w-4 h-4" />
            <Menu v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation Menu -->
      <div
        v-if="isMobileNavOpen"
        class="lg:hidden border-t border-slate-800 bg-[#0F172A] px-4 py-3 space-y-2 text-xs font-medium font-inter"
      >
        <a
          href="#kurikulum"
          @click="isMobileNavOpen = false"
          class="block py-2 text-slate-300 hover:text-teal-400"
        >
          Silabus 16 Pertemuan
        </a>
        <a
          href="#telemetri"
          @click="isMobileNavOpen = false"
          class="block py-2 text-slate-300 hover:text-teal-400"
        >
          Telemetri &amp; Metrik
        </a>
        <a
          href="#pilar"
          @click="isMobileNavOpen = false"
          class="block py-2 text-slate-300 hover:text-teal-400"
        >
          3 Pilar Ekosistem
        </a>
      </div>
    </header>

    <!-- ============================================================== -->
    <!-- HERO SECTION: THE CINEMATIC RESEARCH OBSERVATORY (DARK CANVAS) -->
    <!-- ============================================================== -->
    <section class="relative z-10 pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-800 bg-[#0B132B] text-white overflow-hidden">
      <!-- Ambient Technical Lighting in Hero -->
      <div
        class="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0"
        style="background: radial-gradient(circle at 60% 40%, rgba(13, 148, 136, 0.18) 0%, rgba(30, 58, 138, 0.14) 40%, transparent 70%); filter: blur(36px);"
      ></div>
      <div
        class="absolute inset-0 pointer-events-none z-0 opacity-40"
        style="
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        "
      ></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <!-- Left Column (lg:col-span-7): Institutional Statement & Actions -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Institutional Badge Tag -->
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-teal-950/70 border border-teal-500/40 text-teal-300 font-mono text-[11px] font-semibold tracking-wider uppercase rounded-sm backdrop-blur-xs">
              <ShieldCheck class="w-3.5 h-3.5 text-[#2DD4BF]" />
              <span>Pusat Riset Komputasi &amp; Rekayasa Sistem ITW</span>
            </div>

            <!-- Main Hero Title -->
            <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-jakarta text-white leading-[1.14]">
              Ekosistem Akademik &amp; Pembelajaran Terpadu.
            </h1>

            <!-- Hero Subtitle -->
            <p class="text-sm sm:text-base md:text-lg text-slate-300 font-inter leading-relaxed max-w-2xl">
              Platform perkuliahan terpusat bagi sivitas akademika Institut Teknologi Wakanda untuk pengelolaan materi 16 pertemuan, presensi real-time, evaluasi ujian, dan pemantauan akademik terintegrasi.
            </p>

            <!-- Action Button Group -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                @click="handleNavigateWorkspace"
                class="h-11 px-6 bg-[#0D9488] hover:bg-teal-700 active:bg-teal-800 text-white font-jakarta font-bold text-sm tracking-wide transition-all border border-teal-400/40 rounded-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>{{ authStore.isAuthenticated ? 'Lanjutkan ke Workspace Akademik' : 'Masuk ke Academic Workspace Civitas' }}</span>
                <ArrowRight class="w-4 h-4" />
              </button>

              <a
                href="#kurikulum"
                class="h-11 px-5 bg-slate-800/80 hover:bg-slate-800 active:bg-slate-900 text-slate-200 hover:text-white font-jakarta font-semibold text-sm transition-all border border-slate-700 rounded-sm flex items-center justify-center gap-2 backdrop-blur-xs"
              >
                <BookOpen class="w-4 h-4 text-teal-400" />
                <span>Eksplorasi Silabus 16 Pertemuan</span>
              </a>
            </div>

            <!-- Latin Institutional Motto Callout -->
            <div class="pt-2 max-w-xl">
              <div class="border-l-2 border-[#0D9488] pl-3.5 py-1">
                <p class="text-xs font-serif italic text-teal-300">
                  "Scientia, Virtus, et Excellentia."
                </p>
                <p class="text-[11px] text-slate-400 font-inter mt-0.5">
                  Mendedikasikan rekayasa perangkat lunak untuk keunggulan sains masa depan melalui tata kelola akademik berbasis Clean Architecture.
                </p>
              </div>
            </div>
          </div>

          <!-- Right Column (lg:col-span-5): Interactive Algorithmic Node-Graph Canvas -->
          <div class="lg:col-span-5 relative w-full">
            <InteractiveGraphHero />
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================== -->
    <!-- TELEMETRY STRIP SECTION: 4 KEY METRICS (TECHNICAL SLATE BODY)   -->
    <!-- ============================================================== -->
    <section ref="telemetrySectionRef" id="telemetri" class="relative z-10 py-14 bg-[#F1F5F9] border-b border-slate-300/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span class="text-[11px] font-mono uppercase font-bold tracking-wider text-[#0D9488]">
              Indikator Standar Operasi
            </span>
            <h2 class="text-2xl font-extrabold tracking-tight font-jakarta text-[#0F172A] mt-1">
              Telemetri Keandalan &amp; Rekayasa Sistem
            </h2>
          </div>
          <p class="text-xs text-slate-500 font-inter max-w-md">
            Metrik operasional perkuliahan semester berjalan yang terukur dan terverifikasi secara presisi.
          </p>
        </div>

        <!-- 4 Grid Metric Cards (Solid White on Technical Slate) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Metric 1 -->
          <div class="p-5 bg-white border border-slate-300/90 hover:border-[#1E3A8A] transition-all rounded-sm space-y-2 shadow-xs group">
            <div class="flex items-center justify-between">
              <span class="text-2xl sm:text-3xl font-extrabold font-mono text-[#1E3A8A]">
                {{ Math.round(displaySessions) }}
              </span>
              <BookOpen class="w-5 h-5 text-slate-400 group-hover:text-[#1E3A8A] transition-colors" />
            </div>
            <div class="font-jakarta font-bold text-sm text-[#0F172A]">
              Sesi Silabus Terstruktur
            </div>
            <p class="text-xs text-slate-500 font-inter leading-relaxed">
              Mata kuliah inti IF2041 Struktur Data &amp; Algoritma lengkap dengan modul teori, tugas, kuis, UTS, dan UAS.
            </p>
          </div>

          <!-- Metric 2 -->
          <div class="p-5 bg-white border border-slate-300/90 hover:border-[#0D9488] transition-all rounded-sm space-y-2 shadow-xs group">
            <div class="flex items-center justify-between">
              <span class="text-2xl sm:text-3xl font-extrabold font-mono text-[#0D9488]">
                &lt; {{ Math.round(displayLatency) || 200 }}ms
              </span>
              <Zap class="w-5 h-5 text-slate-400 group-hover:text-[#0D9488] transition-colors" />
            </div>
            <div class="font-jakarta font-bold text-sm text-[#0F172A]">
              Latensi Respons Engine
            </div>
            <p class="text-xs text-slate-500 font-inter leading-relaxed">
              Optimasi Nitro in-memory cache dan query Drizzle ORM untuk check-in presensi PIN/QR dan auto-save ujian daring.
            </p>
          </div>

          <!-- Metric 3 -->
          <div class="p-5 bg-white border border-slate-300/90 hover:border-[#D97706] transition-all rounded-sm space-y-2 shadow-xs group">
            <div class="flex items-center justify-between">
              <span class="text-2xl sm:text-3xl font-extrabold font-mono text-[#D97706]">EWS</span>
              <AlertTriangle class="w-5 h-5 text-slate-400 group-hover:text-[#D97706] transition-colors" />
            </div>
            <div class="font-jakarta font-bold text-sm text-[#0F172A]">
              Early Warning System
            </div>
            <p class="text-xs text-slate-500 font-inter leading-relaxed">
              Deteksi dini otomatis risiko kelulusan berdasarkan kehadiran &lt; 75% serta simulasi nilai akhir indeks A–E.
            </p>
          </div>

          <!-- Metric 4 -->
          <div class="p-5 bg-white border border-slate-300/90 hover:border-slate-800 transition-all rounded-sm space-y-2 shadow-xs group">
            <div class="flex items-center justify-between">
              <span class="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A]">3-Role</span>
              <Shield class="w-5 h-5 text-slate-400 group-hover:text-slate-800 transition-colors" />
            </div>
            <div class="font-jakarta font-bold text-sm text-[#0F172A]">
              Clean RBAC Integrity
            </div>
            <p class="text-xs text-slate-500 font-inter leading-relaxed">
              Isolasi wewenang terenkripsi ketat antara Administrator BAA, Dosen Pengampu/Pendamping, dan Mahasiswa.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================== -->
    <!-- CURRICULUM SECTION: OPEN SYLLABUS 16 SESSIONS (CLEAN STUDIO)   -->
    <!-- ============================================================== -->
    <section id="kurikulum" class="relative z-10 py-16 bg-[#F8FAFC] border-b border-slate-300/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header & Filter Tabs -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-5">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-200/80 border border-slate-300 text-[10px] font-mono font-bold text-slate-700 uppercase rounded-sm mb-2">
              <Calendar class="w-3 h-3 text-[#1E3A8A]" />
              <span>Silabus Terbuka Civitas ITW</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight font-jakarta text-[#0F172A]">
              IF2041: Struktur Data &amp; Algoritma (Kelas A)
            </h2>
            <p class="text-xs text-slate-500 font-inter mt-1">
              Koordinator: Prof. Shuri Udaku • Pendamping: Dr. T'Challa • Semester Ganjil 20261
            </p>
          </div>

          <!-- Phase Filter Tabs -->
          <div class="inline-flex p-0.5 bg-slate-200/80 border border-slate-300 rounded-sm text-xs font-mono">
            <button
              type="button"
              @click="activeCurriculumPhase = 'all'"
              class="px-3 py-1 rounded-sm transition"
              :class="activeCurriculumPhase === 'all' ? 'bg-white text-[#0F172A] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              Semua (16)
            </button>
            <button
              type="button"
              @click="activeCurriculumPhase = 'midterm'"
              class="px-3 py-1 rounded-sm transition"
              :class="activeCurriculumPhase === 'midterm' ? 'bg-white text-[#0F172A] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              Pra-UTS (1-8)
            </button>
            <button
              type="button"
              @click="activeCurriculumPhase = 'final'"
              class="px-3 py-1 rounded-sm transition"
              :class="activeCurriculumPhase === 'final' ? 'bg-white text-[#0F172A] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              Pasca-UTS (9-16)
            </button>
          </div>
        </div>

        <!-- 16 Sessions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="session in filteredSessions"
            :key="session.sessionNumber"
            class="p-4 border rounded-sm flex flex-col justify-between transition-all duration-200 bg-white hover:shadow-md hover:-translate-y-0.5 group"
            :class="{
              'border-[#1E3A8A] bg-blue-50/40 ring-1 ring-[#1E3A8A]/30': session.badge === 'UTS' || session.badge === 'UAS',
              'border-slate-300/80 hover:border-slate-400': session.badge !== 'UTS' && session.badge !== 'UAS'
            }"
          >
            <!-- Card Header -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-mono font-bold text-slate-700">
                  SESI {{ String(session.sessionNumber).padStart(2, '0') }}
                </span>
                <span
                  class="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-sm tracking-wider uppercase"
                  :class="{
                    'bg-[#1E3A8A] text-white': session.badge === 'UTS' || session.badge === 'UAS',
                    'bg-[#D97706] text-white': session.badge === 'KUIS',
                    'bg-[#0D9488] text-white': session.badge === 'TUGAS',
                    'bg-slate-100 text-slate-700 border border-slate-200': session.badge === 'MATERI'
                  }"
                >
                  {{ session.badge }}
                </span>
              </div>

              <h3 class="font-jakarta font-bold text-xs sm:text-sm text-[#0F172A] leading-snug">
                {{ session.title }}
              </h3>
            </div>

            <!-- Card Topics -->
            <div class="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <div
                v-for="(topic, idx) in session.topics"
                :key="idx"
                class="flex items-start gap-1.5 text-[11px] text-slate-600 font-inter"
              >
                <span class="text-slate-400 font-mono mt-0.5">•</span>
                <span class="line-clamp-1">{{ topic }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================== -->
    <!-- 3 PILLARS OF WAS SECTION (SOLID WHITE CARDS)                    -->
    <!-- ============================================================== -->
    <section id="pilar" class="relative z-10 py-16 bg-[#F1F5F9] border-b border-slate-300/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span class="text-[11px] font-mono uppercase font-bold tracking-wider text-[#0D9488]">
            Arsitektur Solusi
          </span>
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight font-jakarta text-[#0F172A]">
            Tiga Pilar Ekosistem Wakanda Academic Space
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 font-inter">
            Dirancang secara modular untuk menjamin ketelitian data evaluasi, kenyamanan pengajaran, dan transparansi kelulusan.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Pilar 1 -->
          <div class="bg-white border border-slate-300/80 hover:border-slate-400 transition-all p-6 rounded-sm space-y-4 shadow-xs">
            <div class="w-10 h-10 bg-blue-50 border border-blue-200 text-[#1E3A8A] flex items-center justify-center rounded-sm">
              <Layers class="w-5 h-5" />
            </div>
            <h3 class="font-jakarta font-bold text-base text-[#0F172A]">
              1. 3-Zone Ergonomic Workspace
            </h3>
            <p class="text-xs text-slate-600 font-inter leading-relaxed">
              Memisahkan zona navigasi 16 sesi di kiri, ruang interaksi materi/tugas/rekapitulasi di tengah, serta panel kontekstual presensi PIN dinamis dan tenggat di kanan.
            </p>
            <ul class="text-xs text-slate-500 font-inter space-y-1.5 pt-2 border-t border-slate-100">
              <li class="flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                <span>Navigasi instan tanpa reload halaman</span>
              </li>
              <li class="flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                <span>Responsif mobile drawer untuk mahasiswa</span>
              </li>
            </ul>
          </div>

          <!-- Pilar 2 -->
          <div class="bg-white border border-slate-300/80 hover:border-slate-400 transition-all p-6 rounded-sm space-y-4 shadow-xs">
            <div class="w-10 h-10 bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center rounded-sm">
              <GraduationCap class="w-5 h-5" />
            </div>
            <h3 class="font-jakarta font-bold text-base text-[#0F172A]">
              2. Early Warning System (EWS) &amp; Gradebook
            </h3>
            <p class="text-xs text-slate-600 font-inter leading-relaxed">
              Melakukan pemantauan aktif terhadap kehadiran mahasiswa dengan ambang batas regulasi 75% serta kalkulasi indeks nilai multi-komponen secara transparan.
            </p>
            <ul class="text-xs text-slate-500 font-inter space-y-1.5 pt-2 border-t border-slate-100">
              <li class="flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                <span>Ekspor resmi Excel (.xlsx) &amp; Berita Acara</span>
              </li>
              <li class="flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                <span>Simulasi target nilai UAS untuk mahasiswa</span>
              </li>
            </ul>
          </div>

          <!-- Pilar 3 -->
          <div class="bg-white border border-slate-300/80 hover:border-slate-400 transition-all p-6 rounded-sm space-y-4 shadow-xs">
            <div class="w-10 h-10 bg-amber-50 border border-amber-200 text-[#D97706] flex items-center justify-center rounded-sm">
              <Lock class="w-5 h-5" />
            </div>
            <h3 class="font-jakarta font-bold text-base text-[#0F172A]">
              3. Ujian Terproteksi &amp; Presensi Real-Time
            </h3>
            <p class="text-xs text-slate-600 font-inter leading-relaxed">
              Infrastruktur ujian online dengan auto-save interval sub-200ms, timer desinkronisasi toleran, serta token presensi PIN 6-digit dinamis (contoh: 481920).
            </p>
            <ul class="text-xs text-slate-500 font-inter space-y-1.5 pt-2 border-t border-slate-100">
              <li class="flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                <span>Pencegahan kehilangan jawaban saat koneksi terputus</span>
              </li>
              <li class="flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                <span>Audit trail waktu submit dan durasi pengerjaan</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================== -->
    <!-- INSTITUTIONAL FOOTER (DARK NAVY ANCHOR)                        -->
    <!-- ============================================================== -->
    <footer class="relative z-10 bg-[#0F172A] border-t border-slate-800 py-12 font-inter text-xs text-slate-400">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-[#1E3A8A] text-white flex items-center justify-center font-mono font-bold text-xs border border-teal-500/40 rounded-sm">
              ITW
            </div>
            <div>
              <div class="font-jakarta font-extrabold text-white text-sm">
                Institut Teknologi Wakanda
              </div>
              <div class="text-[11px] text-slate-400">
                Fakultas Teknologi Informasi, Matematika Komputasi &amp; Rekayasa Vibranium
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-4 text-xs font-inter">
            <NuxtLink to="/login" class="text-teal-400 hover:underline font-medium">
              Portal Autentikasi Civitas
            </NuxtLink>
            <span class="text-slate-600">•</span>
            <a href="#kurikulum" class="text-slate-300 hover:text-white transition-colors">
              Silabus IF2041
            </a>
            <span class="text-slate-600">•</span>
            <a href="#telemetri" class="text-slate-300 hover:text-white transition-colors">
              Telemetri Sistem
            </a>
          </div>
        </div>

        <div class="text-[11px] text-slate-500 text-center sm:text-left">
          &copy; 2026 Institut Teknologi Wakanda. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </div>
    </footer>
  </div>
</template>
