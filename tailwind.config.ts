import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        // Direct PRD Design System Color Palette
        'deep-navy': '#0B132B',
        'academic-navy': '#1E3A8A',
        'scholarly-teal': '#0D9488',
        'alabaster-slate': '#F8FAFC',
        'deep-ink': '#0F172A',
        'amber-alert': '#D97706',
        'semantic-success': '#16A34A',
        'semantic-danger': '#DC2626',

        // Semantic & Hierarchical Aliases
        brand: {
          'deep-navy': '#0B132B',
          navy: '#1E3A8A',
          teal: '#0D9488',
          slate: '#F8FAFC',
          ink: '#0F172A',
          amber: '#D97706',
          success: '#16A34A',
          danger: '#DC2626'
        },
        semantic: {
          success: '#16A34A',
          danger: '#DC2626',
          warning: '#D97706',
          alert: '#D97706'
        }
      },
      fontFamily: {
        // Primary Sans Font: Plus Jakarta Sans with Inter and system fallbacks
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        // Editorial / Academic Serif Font: Source Serif 4
        serif: ['"Source Serif 4"', 'Georgia', 'Cambria', 'serif'],
        'source-serif': ['"Source Serif 4"', 'Georgia', 'serif'],
        // Code / Technical Monospace Font: JetBrains Mono
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        'jetbrains-mono': ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config
