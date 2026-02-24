import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// הגדרה שמאפשרת ל-Tailwind לעבוד בתוך Vite החדש
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})