<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="一眼看电影 One Second Movie — 胶片条联系表与色彩长卷，把整部电影一眼看完">
</p>

<p align="center">
  <a href="https://holynova.github.io/one_second_movie/">▶ 在线体验 Live Demo</a>
  ·
  <a href="https://github.com/holynova/one_second_movie">GitHub 仓库</a>
</p>

一眼看电影把一部影片变成可探索的视觉地图：在浏览器本地等间隔抽帧，拼成联系表或色彩长卷，两小时的电影一眼扫完。视频不上传、无需账号与 API Key、没有后台服务；抽帧用浏览器自己的视频解码器完成。

One Second Movie turns a film into an explorable visual map: it samples frames at equal intervals right in your browser and lays them out as a contact sheet or a color strip — a two-hour movie at a single glance. No upload, no account, no API key, no backend; frames are extracted with the browser's own video decoder.

## 截图 / Screenshots

<p align="center">
  <img src="./assets/readme/screenshot-home.png" width="800" alt="首页：把时间铺成画面，左侧选择影片与抽样设置，右侧演示短片 Into the quiet 预览与色彩长卷">
  <img src="./assets/readme/screenshot-sheet.png" width="800" alt="联系表：演示短片 48 帧按 4 列排布，每帧带编号与时间码，点击可定位原片时刻">
</p>

## 功能 / Features

- **本地抽帧**：选本地视频（MP4 / WebM / MOV，取决于浏览器编解码支持），或允许跨域读取的 HTTP(S) 视频直链；视频平台的播放页链接不可直接抽帧。
- **等间隔采样**：在指定时间范围内抽 24 / 48 / 96 帧，显示真实完成进度，可中途取消；是等间隔采样，不是镜头语义识别。
- **联系表**：3 / 4 / 6 列排布，100%–200% 缩放，点击缩略图定位到原片对应时刻。
- **色彩长卷**：每帧取平均颜色拼成长卷，点击色条定位同一时刻。
- **导出海报**：两种模式均可导出 2400 px 宽 PNG 海报（联系表按行数定高，色彩长卷 2400×1200）。
- **演示短片**：随附原创程序化动画 `demo-film.mp4`（6 秒，「暮色行旅」），不用找片就能试。

## 边界 / Limits

- 导出缩略帧为 480×270，以限制内存；原片播放保持原分辨率。
- 远程直链需要服务端允许 CORS；长片耗时取决于解码与随机寻址性能。
- 旧版 `server/` FFmpeg 实现保留供历史参考，默认启动、构建与发布不再调用它。

## 本地运行 / Run Locally

需要 Node.js 24+：

```bash
npm --prefix client ci
npm run dev      # 开发服务器
npm test         # Node 内置测试
npm run build    # 生产输出为 client/dist
```

GitHub Actions 在 push 到 main 时自动构建并更新 `gh-pages` 分支。

## 技术 / Tech

- React 19 + TypeScript + Vite + Tailwind CSS；抽帧在 `client/src/lib/video.ts`，用 `<video>` + `<canvas>` 逐帧 seek、抓图、算平均色。
- 海报导出同在 `video.ts`（`poster()`）：2400 px 宽画布，联系表与色彩长卷两种版式。

```
client/src/App.tsx        主界面：选片、抽样设置、联系表/色彩长卷、导出
client/src/lib/video.ts   抽帧、平均色、海报导出
client/src/components/    Layout、Upload
client/public/demo-film.mp4   演示短片（6 秒原创程序化动画）
server/                   旧版 FFmpeg 实现（历史参考，不再默认使用）
tests/video.test.mjs      时间戳边界等测试
```

## English

**One Second Movie** turns a film into a visual map you can scan in one glance — a contact sheet or a color strip, sampled at equal intervals in your browser.

- **Local extraction**: pick a local video (MP4 / WebM / MOV, depending on browser codec support) or a CORS-enabled HTTP(S) direct link. Video platform watch pages can't be sampled directly.
- **Equal-interval sampling**: 24 / 48 / 96 frames within a chosen time range, with real progress and cancellation. This is interval sampling, not shot detection.
- **Contact sheet**: 3 / 4 / 6 columns, 100%–200% zoom; click any thumbnail to seek the original video to that moment.
- **Color strip**: each frame's average color, laid out as a strip; click a color to jump to the same moment.
- **Export**: both modes export a 2400 px-wide PNG poster (contact sheet height varies by row count; color strip is 2400×1200).
- **Demo short**: a bundled 6-second original procedural animation (`demo-film.mp4`, "暮色行旅") so you can try it without finding a film.
- **Limits**: thumbnails are 480×270 to bound memory; original playback stays full resolution. The legacy `server/` FFmpeg implementation is kept for historical reference only.
- **Run it**: Node.js 24+; `npm --prefix client ci && npm run dev`. Tests: `npm test`. Build: `npm run build` (output: `client/dist`); GitHub Actions deploys to the `gh-pages` branch on push to main.
- **Tech**: React 19 + TypeScript + Vite + Tailwind CSS. Frame extraction and poster export live in `client/src/lib/video.ts` (`<video>` + `<canvas>` seeking, capture, average color).

## 许可 / License

package.json 声明为 ISC，仓库暂无 LICENSE 文件。
