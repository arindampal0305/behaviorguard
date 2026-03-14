import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow login.html to be served alongside the React app
    open: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        login: './login.html',
      },
    },
  },
})
