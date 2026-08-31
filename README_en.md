[![lemon-new-tab](https://socialify.git.ci/redlnn/lemon-new-tab/image?custom_description=A+simple+local+new+tab+page&description=1&font=Jost&language=1&logo=https%3A%2F%2Fraw.githubusercontent.com%2FRedlnn%2Flemon-new-tab%2Frefs%2Fheads%2Fmaster%2Fassets%2Ficon.svg&owner=1&pattern=Circuit+Board&stargazers=1&theme=Auto)](https://lemon.redln.top)

<div align="center">

[Simplified Chinese](README.md) | English  
[Terms of Service](docs/TERMS_OF_SERVICE_en.md) | [Privacy Policy](docs/PRIVACY_POLICY_en.md)

</div>

## Installation

Lemon New Tab is now a **pure web page** — no extension installation required:

Visit the deployed page URL to use it. A reasonably recent version of a modern browser is recommended.

> You can also clone this repository and build a copy to deploy on your own server or any static hosting.

## Features

Make every new tab feel fast, effortless, and enjoyable.

Lemon New Tab is a local-first, open-source new tab page (pure web version) with no account required. Your core settings and personalized content stay in your browser, giving you fast loading, a clean interface, and no distracting news feed or ads.

**🔍 Flexible Search**  
&emsp;&ensp;Use Google, Bing, Baidu, DuckDuckGo, Yandex, and other search engines. Search suggestions, search history, and custom search engines help you quickly find what you need using a familiar workflow.

**🧭 Quick Links**  
&emsp;&ensp;Automatically display your most-visited sites, or add, pin, and rearrange your own links. Organize them into groups, browse with pages or scrolling, and switch to Dock or Launchpad layouts to keep favorite sites within easy reach.

**🖼️ Rich Wallpaper Options**  
&emsp;&ensp;Built-in online wallpaper sources such as Lorem Picsum and Peapix, custom image URLs, and local images and videos as your wallpaper. Daily auto-rotation and manual refresh help bring your background to life.

**🎨 Highly Customizable**  
&emsp;&ensp;A wide range of options lets you customize the layout, theme colors, and the position and appearance of individual components.

**🕒 Useful Without Distractions**  
&emsp;&ensp;Display the time, date, seconds, and lunar calendar. Enjoy a daily poem, motivational quote, or your own custom text, with one-click copying whenever you want to save it.

**⚡ Fast and Easy to Use**  
&emsp;&ensp;Continuously optimized for faster loading and lower resource usage, with responsive layouts and independent controls for performance and visual effects.

**🔄 Easy Backup**
&emsp;&ensp;Import or export settings to back up your current data or move it to another device.

**⚛️ Built for Trust**  
&emsp;&ensp;Lemon New Tab makes all of its source code available under the AGPL-3.0 license and does not actively collect or send private data. No installation required — it works on modern browsers such as Chrome, Edge, and Firefox, providing a consistent experience across browsers.

> [!NOTE]  
> Contributions via PRs are welcome. Issues may not always be implemented.

## Changelog

[English](./docs/CHANGELOG_en.md) | [Chinese](./docs/CHANGELOG.md)

## Browser Compatibility

|                 Browser                  | Supported |             Notes              |
| :--------------------------------------: | :-------: | :-----------------------------: |
|                  Chrome                  |    ✅     | Chrome 116 and above           |
|                   Edge                   |    ✅     | Edge 116 and above             |
|                 Firefox                  |    ✅     | Firefox 128 and above          |
| Other Chromium-based Desktop Browsers    |    ✅     | Expected to work               |
|                 Mobile                   |    ❓     | Not specifically tested        |

> Lemon Start Page adapts to both landscape and portrait modes,
> but has not been specifically tested on mobile browsers, so compatibility is not guaranteed.

## Preview

<details>
<summary>Click to expand screenshots</summary>

![Standard homepage](./preview/1.webp)  
![Solid-color background homepage](./preview/2.webp)  
![Homepage with Dock and large clock](./preview/3.webp)  
![Launchpad](./preview/4.webp)  
![Search page](./preview/5.webp)  
![Settings page](./preview/6.webp)

</details>

## Development

This project is built with Vue 3 (TypeScript) + Element Plus.

> [!WARNING]
>
> 1. I have not systematically studied HTML / CSS / JS / TS / Vue,
>    so the code quality may not be very high.
> 2. This project contains a large amount of AI-generated code.
>    Only basic reviews were performed to ensure the functionality works
>    and that no malicious code is included.
>    The overall quality/performance may still have issues to some extent —
>    thank you for your understanding.
> 3. PRs are welcome.

### Build

```sh
git clone https://github.com/Redlnn/lemon-new-tab.git
cd lemon-new-tab
pnpm install
pnpm dev  # Local development preview
pnpm build  # Build to dist-web/, a pure static site
pnpm preview  # Preview the build output locally
```

> The build output is a pure static bundle (`dist-web/`) that can be deployed to any static hosting, such as GitHub Pages, Vercel, or Nginx.

## Known Issues

1. Some Chromium-based browsers on Windows may freeze at startup.
   Disabling **GPU hardware acceleration** or switching  
   **Choose ANGLE graphics backend** to `OpenGL` in
   [Experiments](chrome://flags/#use-angle) can help.
   > - Likely caused by GPU driver or system issues.
   > - Chromium discourages rendering via OpenGL API, but other settings may also help (might reduce stutter but risk frame drops).

## Credits

- [Lime Start Page](https://limestart.cn/): Inspiration for Lemon Start Page.
  Layout, animations, and some CSS were referenced.
- [Light Tab Page](https://github.com/Devifish/light-tab-page):
  Source of custom wallpaper storage implementation.

## License

This project is open-sourced under the AGPL-3.0 License, except for trademark-related images in `entrypoints/newtab/assets`.

> This project has been open-sourced under the AGPL-3.0 License since version v3.2.3 (commit 65a894c0d8009d274618c5004a634d7359b2b0a6). Previous versions were open-sourced under the MIT License.