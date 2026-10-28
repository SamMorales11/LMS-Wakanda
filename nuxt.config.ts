// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Developer Tools
  devtools: { enabled: true },

  // Experimental Features
  experimental: {
    appManifest: false
  },

  // Runtime Configuration
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    sessionSecret: process.env.SESSION_SECRET || 'wakanda-super-secure-session-secret-key-32chars-min-2026!',
    // Cloudflare R2 Object Storage
    r2AccountId: process.env.R2_ACCOUNT_ID || '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.R2_BUCKET_NAME || '',
    r2PublicUrl: process.env.R2_PUBLIC_URL || '',
    storageDriver: process.env.STORAGE_DRIVER || 'auto',
    public: {}
  },

  // Nuxt Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],

  // TypeScript Strict Mode
  typescript: {
    strict: true,
    typeCheck: false
  },

  // Global Stylesheets
  css: ['~/assets/css/main.css'],

  // HTML Head and Typography Setup
  app: {
    head: {
      title: 'LMS Wakanda - Clean Architecture Learning Management System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'LMS Wakanda - Full-stack Nuxt 3 with TypeScript, Pinia, Zod, and Tailwind CSS'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap'
        }
      ]
    }
  },

  // Pinia auto-imports configuration
  pinia: {
    storesDirs: ['./stores/**']
  },

  // Tailwind CSS configuration options
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
    exposeConfig: false,
    viewer: false
  }
})
