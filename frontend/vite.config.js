import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const isProduction = process.env.NODE_ENV === 'dev'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 프로덕션 환경이 아닐 때만 vueDevTools 활성화
    isProduction && vueDevTools(), 
  ].filter(Boolean), // 배열에서 false 값(비활성화된 플러그인) 제거
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    global: 'window',
    // 'process.env': {}
  }
})
