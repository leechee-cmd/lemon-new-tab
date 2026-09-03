# 自动化测试指南 (Testing Guide)

本项目采用 **Playwright** 作为端到端（E2E）黑盒自动化测试框架，用于保障前端页面核心交互、设置与复杂依赖组件在真实浏览器环境下的稳定性。

---

## 常用命令

| 命令 | 说明 | 适用场景 |
|---|---|---|
| `pnpm test:e2e` | 运行全部 E2E 测试（默认 Headless 无头模式） | 提交代码前门禁检查、CI/CD 流水线 |
| `pnpm test:e2e --headed` | 以有头可视化窗口运行 Edge 浏览器 | 本地直观观察自动化操作过程与界面渲染 |
| `pnpm test:e2e:ui` | 打开 Playwright 交互式图形调试面板 | 单步执行、查看 DOM 快照、网络瀑布流与调试排错 |
| `pnpm test:e2e e2e/search-suggestions.spec.ts` | 运行单个测试文件 | 针对特定功能模块进行聚焦调试 |

---

## 环境与运行原则

1. **浏览器通道固定为 Microsoft Edge**：
   - 本机测试环境收敛在 Edge（`channel: 'msedge'`），由 [playwright.config.ts](file:///c:/Users/leech/Documents/mine/lemon-new-tab/playwright.config.ts) 统一配置；
   - 严禁在测试中指定 Chrome 或依赖外部 CDP 调试端口。
2. **开发服务自动复用**：
   - Playwright 配置了 `reuseExistingServer: true`；
   - 本地已启动 `pnpm dev:web` 时会直接复用端口，测试结束后不会影响现有服务；未启动时会自动按需拉起。

---

## 测试用例编写规范与最佳实践

测试用例目录为 [e2e/](file:///c:/Users/leech/Documents/mine/lemon-new-tab/e2e)。新增或修改用例时必须遵循以下原则：

### 1. 优先使用无障碍语义选择器，杜绝脆弱的内部类名
- **推荐**：
  - 用户可见文本正则匹配：`page.locator('.el-dropdown-menu__item', { hasText: /设置|Settings/i })`（兼顾多语言）；
  - 标准 ARIA 语义角色：`page.locator('.search-suggestion-area [role="option"]')`、`page.locator('input[role="combobox"]')`；
- **禁止**：
  - 滥用易变或嵌套极深的 CSS 类名（如 `.el-select > div > div:nth-child(2)`）；
  - 勿将带有隐藏状态的辅助按钮（如 `.search-suggestion-area__clear-history`）与常规选项混淆。

### 2. 时序与异步等待（Timing & Async）
- 涉及网络请求或防抖（Debounce）的浮层（例如搜索联想词、壁纸切换），**直接等待目标子项可见**：
  ```ts
  const items = page.locator('.search-suggestion-area [role="option"]')
  await expect(items.first()).toBeVisible({ timeout: 10000 })
  ```
  避免去断言高度为 0 且带展开动画的外部包裹容器。

### 3. 控制台异常捕获（Page Error Assertions）
- 对于引入了第三方复杂库（如拖拽、图表等）的组件，建议通过 `page.on('pageerror')` 监听未捕获异常：
  ```ts
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))
  // ...进行界面操作...
  expect(pageErrors).toEqual([])
  ```

---

## 现有测试矩阵覆盖清单

- [e2e/search-suggestions.spec.ts](file:///c:/Users/leech/Documents/mine/lemon-new-tab/e2e/search-suggestions.spec.ts)：中英文联想词网络请求、键盘上下箭头导航、清空回退；
- [e2e/search-engine-switcher.spec.ts](file:///c:/Users/leech/Documents/mine/lemon-new-tab/e2e/search-engine-switcher.spec.ts)：搜索引擎偏好设置弹窗渲染、拖拽组件无异常报错；
- [e2e/theme-settings.spec.ts](file:///c:/Users/leech/Documents/mine/lemon-new-tab/e2e/theme-settings.spec.ts)：设置弹窗主题页、跟随壁纸颜色开关与主色调禁用联动；
- [e2e/wallpaper-switch.spec.ts](file:///c:/Users/leech/Documents/mine/lemon-new-tab/e2e/wallpaper-switch.spec.ts)：壁纸偏好弹窗与精选壁纸“换一张”按钮。
