import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read VITE_API_URL from .env so the dev server can proxy API calls to the
  // backend (avoids CORS in development). The real address stays only in .env.
  const env = loadEnv(mode, rootDir)
  let apiOrigin: string | undefined
  try {
    if (env.VITE_API_URL) {
      apiOrigin = new URL(env.VITE_API_URL).origin
    }
  } catch {
    apiOrigin = undefined
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    server: apiOrigin
      ? {
          proxy: {
            '/api/v1': {
              target: apiOrigin,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
  }
})
