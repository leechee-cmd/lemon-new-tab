# Lemon New Tab Web 化改造说明

> 状态:已完成(2026-08-27)
> 目标读者:项目维护者

---

## 1. 结论:已从「扩展」转为「纯 Web 应用」

本项目最初是 WXT 构建的浏览器扩展(Chrome/Edge/Firefox)。经过本次改造,**已移除 WXT 扩展构建**,转变为纯静态 Web 应用,可部署到任意静态托管(子路径、GitHub Pages、Cloudflare Pages)。

之前一轮改造为「扩展 + Web 双端共存」设计了大量 `isWeb` 分支与 `web/shims/` 兼容层。本次已将其一并取消:

- 全部 `isWeb` 分支折叠为 Web 直行为;
- 浏览器特权 API(`topSites`、`bookmarks`、`permissions`、`storage.sync`)与对应功能整体删除;
- WXT 构建、popup/background 入口、manifest 等扩展产物全部移除。

## 2. 构建与命令

单一 Vite 构建(配置在 `web/vite.config.ts`),产物输出到 `dist-web/`,与旧的 `.output/` 物理隔离。

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器(Vite) |
| `pnpm build` | 生产构建 → `dist-web/` |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm type-check` | `vue-tsc -p tsconfig.web.json --noEmit` |
| `pnpm lint` / `pnpm lint:check` | 样式与静态检查 |

> 旧的 `dev:web` / `build:web` / `preview:web` / `typecheck:web` 脚本已并入主脚本,保留同名别名不再需要,可移除。

## 3. 关键架构变化

### 3.1 入口
- Web 入口:`web/index.html` → `web/main.web.ts` → `import('@newtab/init')` → `entrypoints/newtab/init.ts` → `main.ts`。
- UI 根组件仍为 `entrypoints/newtab/App.vue`(沿用 `@newtab` 别名指向 `entrypoints/newtab`)。

### 3.2 存储层(`#imports` → `web/shims/imports.ts`)
- 所有 `storage` 数据走 `web/shims/storage.ts`:localStorage + IndexedDB 语义,含 `defineItem`(fallback/version/migrations/watch)、跨标签页 BroadcastChannel 同步。
- `storage` 是唯一保留的 shim,`browser`/`chrome` shim 已删除;代码里不再有 `browser` 对象。

### 3.3 移除的扩展独有能力
- 书签侧栏 `Bookmark/*`、`BookmarkBtn`、`BookmarkSidebarSettings` 及 `bookmark`/`perf.bookmark` 设置。
- 最常访问 `topSites`(其开关/存储/合并逻辑)。
- 权限申请流程 `usePermission`/`PermissionDialog`;`checkAndRequestPermission` 简化为恒返回 `GrantedAll`,不再弹框。
- 云同步 `sync`(退役弹窗 `SyncRetirementDialog`、`useRetiredCloudSync`、`retiredCloudSync.ts` 及 `sync` 设置)。

### 3.4 设置 Schema 升级到 v12
- 新增 `shared/settings/types/v12.ts`,移除 `bookmark`/`sync`/`perf.bookmark`/`quickLinks.topSites`/`dock.topSites`/`dock.launchpad.topSites`。
- 新增迁移 `migrate/fromVer11.ts`;历史版本链 7→…→12 同步更新(`current`/`default`/`normalize`/`settingsStorage`/`migrateToCurrent`)。
- 历史迁移文件(ver7–ver11)为正确产出旧版本结构,保留字段不变,仅剥离对 `defaultSettings.*` 的依赖。

### 3.5 网络与 CORS(Web 直连)
- 一言:直连 `v1.hitokoto.cn`;今日诗词因 CORS 在 Web 端自动降级为一体言。
- 搜索建议:Google / 百度走 script-tag JSONP(绕过 CORS);Bing 建议在 Web 端隐藏。
- Bing 壁纸:Web 端无 CORS,背景设置默认避开;`bingWallpaper` 刷新失败不弹错误通知。
- favicon:无主机权限,走 Image 探测 + DuckDuckGo 公共 favicon 服务兜底(不再依赖 `chrome.runtime.getURL('/_favicon/')`)。

## 4. 依赖与配置清单

- 移除依赖:`wxt`、`@wxt-dev/webextension-polyfill`、`webextension-polyfill`、`web-ext`、`@types/chrome`、`@types/webextension-polyfill`。
- 删除文件:
  - `wxt.config.ts`、`web-ext.config.ts`
  - `entrypoints/{background,popup}/`、`entrypoints/newtab/index.html`
  - `shared/env.ts`、`web/shims/{browser,install,env.web}.ts`、`types/wxt.d.ts`
  - `tsconfig.app.json`
- `tsconfig.web.json`:`#imports` 经 paths 映射到 `web/shims/imports.ts`;不再引用 `.wxt/*`。
- `eslint.config.ts`:新增忽略 `dist-web` 构建产物。

## 5. WXT-vs-Web 差异注意点(已处理)

- `.wxt/` 生成物已移除,不参与 Web 构建。
- i18n:Web 直接用 `locales` 源文件,`navigator.language` 做语言检测,不再有 `_locales/*/messages.json`。
- 无 Chrome 内部 favicon API、无 host permission、无 `browser.tabs`,相应路径替换为 `location.reload()` / `window.open`。
- `shared/worker.ts` 的 `createExtensionWorker` 已简化为直接 `new Worker(workerUrl)`(Vite 处理模块 worker)。

## 6. 部署

`pnpm build` 后上传 `dist-web/` 到任意静态托管即可。子路径部署需调整 `web/vite.config.ts` 的 `base`。
