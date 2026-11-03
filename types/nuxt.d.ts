/**
 * Augmentasi meta route untuk penjaga role workspace.
 * Route Protected mendefinisikan `requiredRole` lewat `definePageMeta`.
 */
declare module '#app' {
  interface PageMeta {
    requiredRole?: 'admin' | 'lecturer' | 'student'
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    requiredRole?: 'admin' | 'lecturer' | 'student'
  }
}

export {}
