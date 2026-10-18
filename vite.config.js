import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import path from "path"
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig({
  plugins: [react(), mkcert()],
  resolve:{
    alias: {
      '@': path.resolve(__dirname,'src'),
    }
  },
  server: { 
    host: true,
    https: true,
    proxy:{
          '/api': { target: 'http://localhost:8080', changeOrigin: true },
          '/ws':  { target: 'ws://localhost:8080', ws: true, changeOrigin: true },
    } },
})