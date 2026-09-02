# 背景壁纸切换延迟排查记录

> 状态：**未解决，代码已回退到干净基线**。本文档记录问题现象、实测日志、已尝试的无效方案，以及排查日志的插入位置，方便后续继续排查时直接复用。

## 问题描述

新标签页使用**在线壁纸**（picsum，已开启「在线壁纸缓存」）时，在壁纸偏好弹窗点击**「换一张」**：

1. 预览壁纸（对话框内 `<img>`）**约 0.6s** 就加载成功；
2. 真正的页面背景壁纸**要等约 2.4s** 才切换。

背景总是明显慢于预览。关闭「壁纸切换动画」后依旧慢（排除动画定时等待）。

## 已观察到的日志（`console.time('bg-switch')`）

测试环境：本机 `pnpm build` + `wrangler pages dev dist-web`，经本地代理 `127.0.0.1:7890` 访问 picsum。

### 第一次（原始 fetch→blob→缓存→objectURL 流程）

```
bg-switch: 109070.488 ms cache checked
bg-switch: 111374.937 ms fetch done        ← +2304ms（网络下载，唯一大头）
bg-switch: 111375.569 ms blob done         ← +0.6ms
bg-switch: 111388.317 ms cache write done  ← +12.7ms（IDB 写入）
bg-switch: 111388.881 ms provider resolved ← +0.5ms
bg-switch: 111389.104 ms bgURL set         ← +0.2ms（动画关闭时≈0）
```

结论：整个管线 2318ms 中 **2304ms 是 fetch 网络下载**，其余都是零头。

### 第二次（「显示原始 URL + 后台补缓存」改造后，并加背景 `<img>` @load 日志）

```
bg-switch: 17149.117 ms cache checked
bg-switch: 17149.693 ms provider resolved
bg-switch: 17149.936 ms bgURL set          ← 立即设置，不再等 fetch
index.vue: 17737.872 ms preview img loaded ← +588ms（预览图，快）
Background.vue: 19557.952 ms fetch done    ← +2408ms（后台补缓存）
Background.vue: 19964.570 ms background img loaded ← +2815ms（背景真正切换）
```

结论：背景 `bgURL` 早已设置，但**背景 `<img>` 自己的一次下载**要到 ~2.8s 才完成——可见切换发生在这。预览 `<img>` 与背景 `<img>` 是**同一 URL 的两次并发独立下载**，浏览器没有合并。

### 第三次（fetchpriority="high" 加到背景 `<img>` 之后，无效）

```
bg-switch: 17149.117 ms cache checked
bg-switch: 17149.936 ms bgURL set
index.vue: 17737.872 ms preview img loaded   （快，~590ms）
Background.vue: 19557.952 ms fetch done
Background.vue: 19964.570 ms background img loaded（仍 ~2.8s，无改善）
```

结论：`fetchpriority="high"` **无效**。

## 已尝试且无效的方案（均已回退）

| 方案 | 做法 | 结果 |
|---|---|---|
| 缓存写入不阻塞切换 | `await cacheOnlineWallpaper` 改为 fire-and-forget | 无效（用户要求立即回退） |
| 显示与缓存解耦 | provider 直接返回原始 URL，后台 fetch 补缓存 | 背景慢移到了 `<img>` 自身下载，无改善 |
| 背景 `<img>` 加 `fetchpriority="high"` | 提高下载优先级 | 无效 |
| `<link rel="preload" as="image" fetchpriority="high">` | URL 变更时注入预加载，让预览/背景都命中 HTTP 缓存 | 无效 |

## 分析与待验证方向

- 同一 URL 由预览 `<img>`、背景 `<img>`、后台 `fetch` **并发请求三次**，仅预览快（~0.6s），背景与 fetch 都慢（~2.4-2.8s）。
- 浏览器/代理（127.0.0.1:7890）很可能对**同一主机的并行连接做了排队**：第一个请求快，其余闲置等待（HTTP/1.1 连接池或代理串行化）。`fetchpriority` 与 `preload` 都绕不开这个。
- **待验证**（尚未做）：
  1. 直接在新标签页打开该 picsum URL，量它真实加载速度——排除"代理本身对 fastly.picsum.photos 路由慢"。
  2. DevTools → Network → 勾选 **Priority** 列，看三个请求的优先级与 Waterfall 的 wait/queue 段。
  3. 若确认是"并行连接被排队"：考虑**只保留一个下载路径**（例如背景与预览共用同一个 objectURL / 复用缓存 blob），彻底消除重复请求。

## 排查日志代码插入位置（便于复用）

以下日志均基于 `console.time('bg-switch')` + `console.timeLog(...)`，插入位置如下。重新排查时按此恢复即可。

### `entrypoints/newtab/components/Background.vue`

**1. 计时起点 —— `settings.background.online.url` 的 watch 内（约 376-384 行）**

```ts
watch(
  () => settings.background.online.url,
  () => {
    if (settings.background.bgType === BgType.Online) {
      console.time('bg-switch')
      void updateBackgroundURL(BgType.Online)
    }
  },
)
```

**2. `BgType.Online` provider 内（约 203-284 行）**

- 读取缓存之后（`const cached = useCache ? await getCachedOnlineWallpaper(rawUrl) : null` 之后）：
  ```ts
  console.timeLog('bg-switch', 'cache checked')
  ```
- `fetch` 返回之后：
  ```ts
  console.timeLog('bg-switch', 'fetch done')
  ```
- `blob = await res.blob()` 之后：
  ```ts
  console.timeLog('bg-switch', 'blob done')
  ```
- `await cacheOnlineWallpaper(rawUrl, newCache)` 之后：
  ```ts
  console.timeLog('bg-switch', 'cache write done')
  ```

**3. `updateBackgroundURL`（约 322-373 行）**

- `source = await provider()` 成功之后：
  ```ts
  console.timeLog('bg-switch', 'provider resolved')
  ```
- `bgURL.value = source.url` 之后：
  ```ts
  console.timeLog('bg-switch', 'bgURL set')
  ```

**4. 背景 `<img>` 模板（约 461-466 行）**——背景图真正加载完成的时刻：

```html
<img
  v-else-if="bgURL"
  class="background"
  :src="bgURL.startsWith('url') ? bgURL.replace(bgURLreg, '$2') : bgURL"
  alt=""
  @load="console.timeLog('bg-switch', 'background img loaded')"
/>
```

### `entrypoints/newtab/components/BackgroundSwitcher/index.vue`

**预览 `<img>` 模板（非 local 分支）**——预览图真正加载完成的时刻：

```html
<img v-if="previewSrc" :src="previewSrc" alt="" @load="console.timeLog('bg-switch', 'preview img loaded')" />
```

（脚本区无需新增函数，模板内联调用即可。）

## 日志解读速查

| 标记 | 含义 |
|---|---|
| `cache checked` | IDB 缓存读取完成（新 URL 应≈0ms） |
| `preview img loaded` | 预览图下载+解码完成 |
| `fetch done` | provider 的 `fetch` 网络下载完成 |
| `blob done` | blob 转换完成 |
| `cache write done` | IDB 缓存写入完成 |
| `provider resolved` | provider 全部完成 |
| `bgURL set` | 背景 URL 已赋值（`bgURL` 生效） |
| `background img loaded` | 背景 `<img>` 下载+解码完成（**可见切换发生点**） |

- `fetch done`（或 `background img loaded`）比 `preview img loaded` 慢 → 网络/并发层面问题，非管线问题。
- `bgURL set` 明显晚于 `provider resolved` → `updateBackgroundURL` 后续逻辑（动画/状态）问题。