# AGENTS.md

本仓库是一个基于 Vite 8、Vue 3 和 TypeScript 的纯静态 Web 应用（Lemon New Tab 新标签页）。
请将此文件作为 AI 编码代理的**全局宪法与 Harness 执行手册**。

## 渐进式披露与按需索引

- 项目全局说明：[README.md](README.md) / 英文说明：[README_en.md](README_en.md)
- Web 化改造与架构决策：[docs/web-port-plan.md](docs/web-port-plan.md)
- 自动化测试与编写规范：[docs/testing.md](docs/testing.md)
- 发布历史：[docs/CHANGELOG.md](docs/CHANGELOG.md)

## 环境与核心命令

- 使用 Node.js 24+、TypeScript 6、pnpm 11
- 启动开发：`pnpm dev`（或 `pnpm dev:web`）
- 静态构建：`pnpm build`（输出目录为 `dist-web/`）
- 生产预览：`pnpm preview`
- 类型检查：`pnpm type-check`
- 代码 Lint：`pnpm lint`（集成 oxlint、eslint、stylelint）
- 自动化格式化：`pnpm format`
- 端到端测试：`pnpm test:e2e`（默认无头）、`pnpm test:e2e --headed`（有头调试）、`pnpm test:e2e:ui`（图形面板）

## 架构地图

- Web 入口 HTML：[web/index.html](web/index.html)
- Vite 构建配置：[web/vite.config.ts](web/vite.config.ts)
- 应用启动顺序：[entrypoints/newtab/init.ts](entrypoints/newtab/init.ts) -> [entrypoints/newtab/main.ts](entrypoints/newtab/main.ts)
- 新标签页 UI 根组件：[entrypoints/newtab/App.vue](entrypoints/newtab/App.vue)
- 核心领域模块：
  - 配置与存储：[shared/settings](shared/settings)
  - 主题与取色：[shared/theme](shared/theme)
  - 媒体与缓存：[shared/media](shared/media)
  - 网络与跨域请求：[shared/network](shared/network)
- 国际化体系：运行时 [shared/i18n.ts](shared/i18n.ts)，语言包目录 [locales](locales)

## 仓库规范与代码风格

- UI 组件优先使用 Vue 3 SFC 的 `<script setup lang="ts">`。
- 优先使用 [tsconfig.web.json](tsconfig.web.json) 中已配置的路径别名：`@/*` 和 `@newtab/*`。
- 严禁手动编辑自动生成的声明文件：[types/auto-imports.d.ts](types/auto-imports.d.ts)、[types/components.d.ts](types/components.d.ts)。
- 变更遵循最小化原则，保持聚焦，除非明确要求不做大范围无关重构。
- Git 提交规范：使用 gitmoji 开头（如 `:bug:`、`:sparkles:`、`:white_check_mark:`、`:docs:`），后跟简短描述与详细正文。

## 技术债务结局与高风险防御

- **技术债务已结清**：本项目已彻底完成纯 Web 化，浏览器扩展特权 API（topSites/bookmarks）与 WXT 构建已被物理移除，严禁重新引入扩展专属依赖或构建逻辑。
- **Settings Schema 迁移防线**：新增字段无需升级版本；删除或重命名字段必须在 [shared/settings/migrate](shared/settings/migrate) 补充迁移逻辑，并同步更新：
  - 当前版本定义：[shared/settings/current.ts](shared/settings/current.ts)
  - 存储迁移注册：[shared/settings/settingsStorage.ts](shared/settings/settingsStorage.ts)
  - 默认值：[shared/settings/default.ts](shared/settings/default.ts)
  - 启动兼容性检查：[shared/settings/bootstrap.ts](shared/settings/bootstrap.ts)
- **i18n 规范**：新增或修改翻译键时，必须同步更新 [locales](locales) 下所有语言，命名空间保持一致（`newtab`、`settings`、`sync`、`faq`）。

## 完成前校验门禁（硬性三阶检查）

在声明任务完成或提交代码前，必须按顺序执行以下验证阶梯，确保全部通过：

1. **类型安全阶**：执行 `pnpm type-check`，无类型报错；
2. **规范静态阶**：执行 `pnpm lint`，无语法、样式或 Lint 报错；
3. **行为验证阶**：若涉及交互逻辑、设置项或视觉组件变动，执行 `pnpm test:e2e`，确保自动化测试全绿；
4. **构建验证阶**：若涉及依赖、环境或打包配置变动，执行 `pnpm build`，确保构建产物生成正常。
