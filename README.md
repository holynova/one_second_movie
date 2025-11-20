# One Second Movie / 一眼看电影

> Transform any video into a comprehensive contact sheet - see an entire movie at a glance.
> 
> 将任何视频转换为联系表 - 一眼看完整部电影。

![Main Interface](./docs/screenshot_main.png)

## ✨ Features / 功能特点

### 🎬 Smart Video Processing / 智能视频处理
- **Fixed 4K Output** - All contact sheets are generated at 3840×2160 resolution
- **固定 4K 输出** - 所有联系表均以 3840×2160 分辨率生成

### 🎯 Quality Presets / 质量预设
Choose from three quality levels based on your needs:

根据需求选择三种质量级别：

| Quality / 质量 | Grid / 网格 | Screenshots / 截图数 | Use Case / 适用场景 |
|----------------|-------------|---------------------|-------------------|
| **Low / 低** | 32×32 | 1,024 | Quick preview / 快速预览 |
| **Medium / 中** | 64×64 | 4,096 | Balanced detail / 均衡细节 |
| **High / 高** | 128×128 | 16,384 | Maximum coverage / 最大覆盖 |

### 📊 Real-time Progress / 实时进度
- Live progress bar with percentage and status updates
- 实时进度条显示百分比和状态更新

### 📁 Flexible Input / 灵活输入
- **File Upload** - Drag and drop or select video files
- **URL Processing** - Process videos directly from URLs
- **文件上传** - 拖放或选择视频文件
- **URL 处理** - 直接从 URL 处理视频

### 📈 Detailed Statistics / 详细统计
After processing, view comprehensive information:
- Total screenshots captured
- Grid dimensions (rows × columns)
- Capture interval
- Output resolution

处理后查看详细信息：
- 总截图数
- 网格尺寸（行×列）
- 截图间隔
- 输出分辨率

## 🚀 Quick Start / 快速开始

### Prerequisites / 前置要求

- Node.js 18+
- pnpm
- FFmpeg (must be installed and available in PATH)

### Installation / 安装

```bash
# Clone the repository / 克隆仓库
git clone <repository-url>
cd one_second_movie

# Install dependencies / 安装依赖
pnpm install

# Start development server / 启动开发服务器
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

应用将在以下地址可用：
- 前端：http://localhost:5173
- 后端：http://localhost:3000

## 📖 How to Use / 使用方法

### 1. Select Quality / 选择质量
Choose your desired quality preset (Low/Medium/High) based on the video length and detail needed.

根据视频长度和所需细节选择质量预设（低/中/高）。

### 2. Upload Video / 上传视频
- **Option A**: Drag and drop a video file
- **Option B**: Click to browse and select a file
- **Option C**: Switch to URL mode and paste a video URL

- **选项 A**：拖放视频文件
- **选项 B**：点击浏览并选择文件
- **选项 C**：切换到 URL 模式并粘贴视频 URL

### 3. Wait for Processing / 等待处理
Watch the progress bar as your video is processed. Processing time varies based on:
- Video duration
- Selected quality level
- System performance

观察进度条显示处理进度。处理时间取决于：
- 视频时长
- 选择的质量级别
- 系统性能

### 4. Download Result / 下载结果
Once complete, download your 4K contact sheet image.

完成后，下载您的 4K 联系表图片。

## 🏗️ Technology Stack / 技术栈

### Frontend / 前端
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling

### Backend / 后端
- **Node.js** - Runtime
- **Express** - Web framework
- **FFmpeg** - Video processing
- **TypeScript** - Type safety

## 📁 Project Structure / 项目结构

```
one_second_movie/
├── client/                 # Frontend application / 前端应用
│   ├── src/
│   │   ├── App.tsx        # Main component / 主组件
│   │   └── components/    # UI components / UI 组件
│   └── package.json
├── server/                # Backend application / 后端应用
│   ├── src/
│   │   ├── index.ts       # Express server / Express 服务器
│   │   └── services/      # Business logic / 业务逻辑
│   └── package.json
└── package.json           # Root package / 根包
```

## ⚙️ Configuration / 配置

### Quality Settings / 质量设置

Quality presets are defined in `server/src/services/VideoProcessor.ts`:

质量预设定义在 `server/src/services/VideoProcessor.ts`：

```typescript
private static readonly QUALITY_GRIDS = {
  high: { columns: 128, rows: 128 },    // 16,384 screenshots
  medium: { columns: 64, rows: 64 },    // 4,096 screenshots
  low: { columns: 32, rows: 32 }        // 1,024 screenshots
};
```

### Output Resolution / 输出分辨率

Fixed at 3840×2160 (4K):

固定为 3840×2160 (4K)：

```typescript
private static readonly OUTPUT_WIDTH = 3840;
private static readonly OUTPUT_HEIGHT = 2160;
```

## 🔧 Development / 开发

### Run in Development Mode / 开发模式运行

```bash
# Start both client and server / 同时启动客户端和服务器
pnpm dev

# Or start separately / 或分别启动
cd client && pnpm dev  # Frontend on :5173
cd server && pnpm dev  # Backend on :3000
```

### Build for Production / 生产构建

```bash
# Build client / 构建客户端
cd client && pnpm build

# Build server / 构建服务器
cd server && pnpm build
```

## 📝 API Endpoints / API 端点

### POST /upload
Upload and process a video file.

上传并处理视频文件。

**Request:**
- `video`: Video file (multipart/form-data)
- `quality`: Quality preset ('low' | 'medium' | 'high')

**Response:**
```json
{
  "jobId": "1234567890-abc123",
  "filename": "video.mp4"
}
```

### GET /progress/:jobId
Get processing progress for a job.

获取任务的处理进度。

**Response:**
```json
{
  "progress": 75,
  "status": "Processing: 1:30",
  "complete": false
}
```

### POST /process-url
Process a video from URL.

从 URL 处理视频。

**Request:**
```json
{
  "url": "http://example.com/video.mp4",
  "quality": "medium"
}
```

## ⚠️ Limitations / 限制

- **High Quality Processing**: Generating 16,384 screenshots takes significant time (10-20 minutes for a 2-hour movie)
- **Memory Usage**: High quality processing requires substantial memory
- **FFmpeg Required**: FFmpeg must be installed and accessible in system PATH

- **高质量处理**：生成 16,384 张截图需要大量时间（2 小时电影需 10-20 分钟）
- **内存使用**：高质量处理需要大量内存
- **需要 FFmpeg**：必须安装 FFmpeg 并在系统 PATH 中可访问

## 🤝 Contributing / 贡献

Contributions are welcome! Please feel free to submit a Pull Request.

欢迎贡献！请随时提交 Pull Request。

## 📄 License / 许可证

MIT License

## 🙏 Acknowledgments / 致谢

- FFmpeg for powerful video processing capabilities
- React and Vite for excellent development experience
- Tailwind CSS for beautiful UI components

---

**Made with ❤️ by [Your Name]**
