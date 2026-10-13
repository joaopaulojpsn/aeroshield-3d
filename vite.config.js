import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // no GitHub Pages o site fica em /aeroshield-3d/ (nome do repositório)
  base: command === 'build' ? '/aeroshield-3d/' : '/',
}))
