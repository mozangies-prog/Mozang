import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {

  return {
    plugins: [react()],

    build: {
      chunkSizeWarningLimit: 1500
    },

    // Your other config options go here...
  }
})
