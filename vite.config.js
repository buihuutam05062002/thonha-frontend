import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'


export default defineConfig({
  plugins: [react(), mkcert()],
  server: { 
    host: true,
    https: true,
    proxy:{
          '/api': { target: 'http://localhost:8080', changeOrigin: true },
          '/ws':  { target: 'ws://localhost:8080', ws: true, changeOrigin: true },
    } },
})