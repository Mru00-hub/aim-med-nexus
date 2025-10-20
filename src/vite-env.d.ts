/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_SYSTEM_ACTOR_ID: string // <-- ADD THIS
  readonly VITE_ADMIN_USER_ID: string   // <-- AND ADD THIS
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
