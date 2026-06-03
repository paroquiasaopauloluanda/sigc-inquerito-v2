/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPS_SCRIPT_URL: string
  readonly VITE_ADMIN_PASSWORD: string
  readonly VITE_NOME_CENTRO: string
  readonly VITE_ANO_CATEQUETICO: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
