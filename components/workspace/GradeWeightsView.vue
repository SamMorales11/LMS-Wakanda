<script setup lang="ts">
import { computed } from 'vue'
import { useAcademicStore } from '~/stores/useAcademicStore'

const academicStore = useAcademicStore()
const gradeWeights = computed(() => academicStore.gradeWeights)
const totalWeight = computed(() => academicStore.totalWeight)

const getComponentLabel = (name: string) => {
  switch (name) {
    case 'FINAL_EXAM':
      return 'Ujian Akhir Semester (UAS)'
    case 'MIDTERM_EXAM':
      return 'Ujian Tengah Semester (UTS)'
    case 'ASSIGNMENT':
      return 'Tugas & Praktikum Mandiri'
    case 'QUIZ':
      return 'Kuis Terstruktur'
    case 'ATTENDANCE':
      return 'Presensi & Keaktifan'
    default:
      return name
  }
}

const getComponentBadge = (name: string) => {
  switch (name) {
    case 'FINAL_EXAM':
      return 'bg-blue-100 text-academic-navy border border-blue-300'
    case 'MIDTERM_EXAM':
      return 'bg-amber-100 text-amber-900 border border-amber-300'
    case 'ASSIGNMENT':
      return 'bg-teal-100 text-teal-800 border border-teal-300'
    case 'QUIZ':
      return 'bg-purple-100 text-purple-800 border border-purple-300'
    case 'ATTENDANCE':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header Bobot Nilai -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-scholarly-teal text-xs font-semibold border border-teal-200 font-inter mb-2">
            <span>Standar Evaluasi Akademik ITW</span>
          </div>
          <h2 class="text-2xl font-bold text-academic-navy font-jakarta">
            Komposisi Bobot Nilai & Evaluasi Perkuliahan
          </h2>
          <p class="text-xs text-slate-500 font-inter mt-1 max-w-2xl">
            Struktur bobot penilaian kelas yang diinisialisasi secara otomatis (total 100.00%) melalui transaksi atomik database Neon setiap kali kelas dibuka.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-alabaster-slate border border-slate-200 text-center shrink-0 min-w-[150px]">
          <span class="text-[11px] text-slate-500 font-inter block">Total Akumulasi</span>
          <span
            class="text-2xl font-black font-mono mt-0.5 block"
            :class="totalWeight === 100 ? 'text-semantic-success' : 'text-amber-alert'"
          >
            {{ totalWeight.toFixed(2) }}%
          </span>
          <span class="text-[10px] text-slate-400 font-inter block">Sesuai Kebijakan Akademik</span>
        </div>
      </div>
    </section>

    <!-- Kartu Komponen Bobot Nilai (Tabel / Grid) -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-5">
      <h3 class="text-base font-bold text-academic-navy font-jakarta">
        Daftar Komponen Penilaian Kelas
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="w in gradeWeights"
          :key="w.id"
          class="p-5 rounded-2xl border border-slate-200 bg-white hover:border-scholarly-teal transition space-y-3 font-inter shadow-2xs"
        >
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase" :class="getComponentBadge(w.componentName)">
              {{ w.componentName }}
            </span>
            <span class="text-xl font-black font-mono text-academic-navy">
              {{ parseFloat(w.weightPercentage).toFixed(0) }}%
            </span>
          </div>

          <div>
            <h4 class="text-sm font-bold text-deep-ink font-jakarta">
              {{ getComponentLabel(w.componentName) }}
            </h4>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              {{ w.description || 'Komponen penilaian evaluasi terstandarisasi untuk mahasiswa peserta kelas.' }}
            </p>
          </div>

          <!-- Progress Bar Visualisasi -->
          <div class="pt-2">
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-scholarly-teal rounded-full"
                :style="{ width: `${w.weightPercentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Skala Konversi Nilai Huruf & Bobot SKS -->
    <section class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-4">
      <h3 class="text-base font-bold text-academic-navy font-jakarta">
        Skala Nilai Akhir & Konversi Huruf Mutu
      </h3>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-inter border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold font-jakarta">
              <th class="py-2.5 px-3">Rentang Nilai Angka</th>
              <th class="py-2.5 px-3">Huruf Mutu</th>
              <th class="py-2.5 px-3">Bobot Indeks (IP)</th>
              <th class="py-2.5 px-3">Predikat Kelulusan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-mono text-slate-600">
            <tr>
              <td class="py-2 px-3 font-bold text-deep-ink">85.00 - 100.00</td>
              <td class="py-2 px-3 text-semantic-success font-black">A</td>
              <td class="py-2 px-3">4.00</td>
              <td class="py-2 px-3 font-inter">Istimewa / Sangat Cemerlang</td>
            </tr>
            <tr>
              <td class="py-2 px-3 font-bold text-deep-ink">80.00 - 84.99</td>
              <td class="py-2 px-3 text-semantic-success font-black">A-</td>
              <td class="py-2 px-3">3.70</td>
              <td class="py-2 px-3 font-inter">Hampir Istimewa</td>
            </tr>
            <tr>
              <td class="py-2 px-3 font-bold text-deep-ink">75.00 - 79.99</td>
              <td class="py-2 px-3 text-scholarly-teal font-black">B+</td>
              <td class="py-2 px-3">3.30</td>
              <td class="py-2 px-3 font-inter">Sangat Baik</td>
            </tr>
            <tr>
              <td class="py-2 px-3 font-bold text-deep-ink">70.00 - 74.99</td>
              <td class="py-2 px-3 text-scholarly-teal font-black">B</td>
              <td class="py-2 px-3">3.00</td>
              <td class="py-2 px-3 font-inter">Baik</td>
            </tr>
            <tr>
              <td class="py-2 px-3 font-bold text-deep-ink">65.00 - 69.99</td>
              <td class="py-2 px-3 text-amber-alert font-black">B-</td>
              <td class="py-2 px-3">2.70</td>
              <td class="py-2 px-3 font-inter">Cukup Baik</td>
            </tr>
            <tr>
              <td class="py-2 px-3 font-bold text-deep-ink">60.00 - 64.99</td>
              <td class="py-2 px-3 text-amber-alert font-black">C+</td>
              <td class="py-2 px-3">2.30</td>
              <td class="py-2 px-3 font-inter">Lebih dari Cukup</td>
            </tr>
            <tr>
              <td class="py-2 px-3 font-bold text-deep-ink">55.00 - 59.99</td>
              <td class="py-2 px-3 text-amber-alert font-black">C</td>
              <td class="py-2 px-3">2.00</td>
              <td class="py-2 px-3 font-inter">Cukup (Batas Lulus)</td>
            </tr>
            <tr>
              <td class="py-2 px-3 font-bold text-deep-ink">&lt; 55.00</td>
              <td class="py-2 px-3 text-semantic-danger font-black">E</td>
              <td class="py-2 px-3">0.00</td>
              <td class="py-2 px-3 font-inter text-semantic-danger">Tidak Lulus (Wajib Mengulang)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
