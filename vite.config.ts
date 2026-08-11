import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveBuildDeployEnv } from './src/config/deploy-env.ts'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const buildDeployEnv = resolveBuildDeployEnv(process.env)

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.DEPLOY_ENV': JSON.stringify(buildDeployEnv),
    // Compat alias for any remaining readers; mirrors DEPLOY_ENV on Netlify builds
    'import.meta.env.VERCEL_ENV': JSON.stringify(buildDeployEnv),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  optimizeDeps: {
    include: ['framer-motion'],
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/react-icons')) {
            return 'vendor-icons'
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router'
          }
          if (
            id.includes('node_modules/three') ||
            id.includes('node_modules/@react-three')
          ) {
            return 'vendor-three'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
