import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'stats.html'
    })
  ],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: [
      'onnxruntime-web',
      '@jsquash/jpeg',
      '@jsquash/webp',
      '@jsquash/png',
      '@jsquash/oxipng'
    ]
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'jszip': ['jszip'],
          'jsquash': ['@jsquash/jpeg', '@jsquash/webp', '@jsquash/png', '@jsquash/oxipng'],
          'onnx': ['onnxruntime-web']
        }
      }
    }
  }
})