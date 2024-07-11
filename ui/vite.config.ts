import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  resolve: {
    alias: {
      '@icons': resolve(__dirname, 'src/assets/icons')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'ws://localhost:8000',
        changeOrigin: true,
      }
    },
  },
})
