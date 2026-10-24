import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' keeps asset paths working on GitHub Pages
export default defineConfig({ base: './', plugins: [react()] })
