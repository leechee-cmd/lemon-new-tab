import { fileURLToPath } from 'node:url'

import Vue from '@vitejs/plugin-vue'
import postcss from 'postcss'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import Markdown from 'unplugin-vue-markdown/vite'
import i18nextLoader from 'vite-plugin-i18next-loader'
import svgLoader from 'vite-svg-loader'

import { keepFirst5H2Plugin } from '../scripts/mdit-keep-first-5-h2.ts'
import { removeH1Plugin } from '../scripts/mdit-remove-h1.ts'

const projectRoot = new URL('..', import.meta.url)

/** 将输入转为当前项目根目录 URL 的绝对文件路径。 */
export const r = (path: string): string => fileURLToPath(new URL(`./${path}`, projectRoot))

const elementPlusResolver = ElementPlusResolver({
  importStyle: 'sass',
})

/** 将 Element Plus CSS 包裹进 @layer，避免未分层的用户样式被覆盖（Vite 8+）。 */
const elementPlusLayerPlugin: postcss.Plugin = {
  postcssPlugin: 'element-plus-layer',
  Once(root, { result }) {
    const from: string = (result.opts.from ?? '').replace(/\\/g, '/')
    if (!from.includes('/node_modules/element-plus/')) return
    if (!root.nodes?.length) return

    const nodes = root.nodes.map((n) => n.clone())
    root.removeAll()
    const layer = postcss.atRule({ name: 'layer', params: 'element-plus' })
    layer.append(...nodes)
    root.append(layer)
  },
}

export const elementPlusPostcss = {
  plugins: [elementPlusLayerPlugin],
}

export const scssAdditionalData = `@use "@/assets/styles/element/index.scss" as *;`

/** Web 构建独有的文件路径别名，不含扩展专用路径（保证扩展构建零改动）。 */
export function createWebAliases() {
  return [
    { find: '#imports', replacement: r('web/shims/imports.ts') },
    { find: '@', replacement: r('') },
    { find: '@newtab', replacement: r('entrypoints/newtab') },
  ]
}

/** 生成 web 构建所需的各种插件。 */
export function createWebPlugins() {
  return [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    i18nextLoader({
      paths: ['./locales'],
      namespaceResolution: 'basename',
    }),
    svgLoader(),
    Icons({ compiler: 'vue3' }),
    Markdown({
      include: [/CHANGELOG.*\.md$/],
      markdownItSetup(md) {
        md.use(removeH1Plugin)
        md.use(keepFirst5H2Plugin)
      },
    }),
    Markdown({
      include: [/\.md$/],
      exclude: [/CHANGELOG.*\.md$/],
    }),
    AutoImport({
      include: [
        /\.[tj]sx?$/,
        /\.vue$/,
        /\.vue\?vue/,
        /\.vue\.[tj]sx?\?vue/,
      ],
      imports: ['vue'],
      resolvers: [elementPlusResolver],
      viteOptimizeDeps: true,
      dts: r('types/auto-imports.d.ts'),
    }),
    Components({
      resolvers: [elementPlusResolver],
      dts: r('types/components.d.ts'),
    }),
  ]
}
