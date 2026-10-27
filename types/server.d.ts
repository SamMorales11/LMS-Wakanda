// Definisi tipe global Nitro / H3 v1 untuk server handlers
declare global {
  type H3Event = InstanceType<typeof import('h3').H3Event>
}

export {}
