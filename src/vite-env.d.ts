/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_RPC_ENDPOINT?: string
  readonly SOLANA_RPC_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
