import { defineConfig } from 'vite'

import {
  createWebAliases,
  createWebPlugins,
  elementPlusPostcss,
  r,
  scssAdditionalData,
} from './shared.ts'

export default defineConfig({
  root: r('web'),
  base: './',
  publicDir: r('public'),
  plugins: createWebPlugins(),
  resolve: {
    alias: createWebAliases(),
  },
  optimizeDeps: {
    // 禁用运行期依赖发现，避免 unplugin 按需导入在运行时引入新依赖触发整页 reload（白屏）
    noDiscovery: true,
    include: [
      'vue',
      'element-plus/es',
      'element-plus/es/locale/lang/zh-cn',
      'dayjs',
      'dayjs/locale/zh-cn',
      'dayjs/plugin/advancedFormat.js',
      'dayjs/plugin/customParseFormat.js',
      'dayjs/plugin/dayOfYear.js',
      'dayjs/plugin/isSameOrAfter.js',
      'dayjs/plugin/isSameOrBefore.js',
      'dayjs/plugin/localeData.js',
      'dayjs/plugin/weekOfYear.js',
      'dayjs/plugin/weekYear.js',
      'i18next',
      'i18next-vue',
      'i18next-browser-languagedetector',
      '@vueuse/core',
      '@vueuse/components',
      'pinia',
      'idb',
      '@dnd-kit/vue',
    ],
  },
  css: {
    postcss: elementPlusPostcss,
    preprocessorOptions: {
      scss: {
        additionalData: scssAdditionalData,
      },
    },
  },
  build: {
    outDir: r('dist-web'),
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
})
