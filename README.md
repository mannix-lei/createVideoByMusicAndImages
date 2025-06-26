# 🎵 音乐节拍视频生成器

一个基于React + TypeScript的Web应用，可以将用户上传的图片配合音乐节拍制作成酷炫的视频。

## ✨ 功能特点

- 📸 **图片上传**: 支持拖拽上传多张图片
- 🎵 **音频分析**: 使用Web Audio API进行实时节拍检测
- 🎬 **视频生成**: Canvas实时渲染，支持WebM格式导出
- 💫 **动效转场**: 缩放动画跟随音乐节拍（大→小→大）
- 🎛️ **实时控制**: 播放/暂停/停止/下载功能
- 📊 **频谱可视化**: 实时音频频谱显示
- 📱 **响应式设计**: 适配不同屏幕尺寸

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **音频处理**: Web Audio API
- **视频处理**: Canvas API + MediaRecorder API
- **UI组件**: Lucide React Icons
- **样式**: CSS3 + Flexbox + Grid

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 📋 使用说明

1. **上传图片**: 点击上传区域或拖拽图片文件
2. **生成视频**: 点击"生成视频"按钮开始处理
3. **播放预览**: 使用播放控制按钮预览效果
4. **下载视频**: 生成完成后点击"下载视频"

## 🎯 核心原理

### 节拍检测
- 使用`AnalyserNode`分析音频频谱
- 监测低频段能量变化识别节拍
- 通过阈值和时间间隔过滤误触发

### 视频渲染
- Canvas逐帧绘制图片
- 根据节拍强度计算缩放比例
- 使用`sin`函数创建平滑的缩放动画
- MediaRecorder录制Canvas流

### 转场效果
```typescript
// 缩放动画：大 → 小 → 大
const scaleValue = 1 + Math.sin(progress * Math.PI * 2) * intensity * 0.5
```

## 📁 项目结构

```
src/
├── components/
│   ├── AudioAnalyzer.tsx    # 音频分析组件
│   ├── ImageUploader.tsx    # 图片上传组件
│   ├── VideoRenderer.tsx    # 视频渲染组件
│   └── VideoControls.tsx    # 控制面板组件
├── App.tsx                  # 主应用组件
├── App.css                 # 样式文件
└── main.tsx                # 入口文件
```

## 🎛️ 配置说明

### 音频设置
- 采样率: 44.1kHz
- FFT大小: 256
- 平滑系数: 0.85

### 视频设置
- 分辨率: 800x600
- 帧率: 30fps
- 格式: WebM (VP9编码)

### 转场参数
- 节拍阈值: 120
- 最小间隔: 200ms
- 动画时长: 300ms

## 🔧 自定义配置

### 添加自定义音乐
将音频文件放置在 `public/music/` 目录下，并在App.tsx中修改音频源:

```typescript
<audio
  ref={audioRef}
  src="/music/your-music.mp3"
  // ...
/>
```

### 调整转场效果
在 `VideoRenderer.tsx` 中修改缩放参数:

```typescript
// 调整缩放强度
const scaleValue = 1 + Math.sin(progress * Math.PI * 2) * intensity * 0.8

// 调整动画时长
const duration = 500 // 毫秒
```

## 🐛 常见问题

### 音频无法播放
- 确保浏览器支持Web Audio API
- 检查音频文件格式和路径
- 某些浏览器需要用户交互后才能播放音频

### 视频录制失败
- 确保浏览器支持MediaRecorder API
- 检查Canvas权限设置
- 尝试不同的视频格式 (webm/mp4)

### 性能优化
- 减少图片尺寸和数量
- 降低Canvas分辨率
- 使用`requestAnimationFrame`优化动画

## 🌟 未来规划

- [ ] 支持更多音频格式 (MP3, WAV, FLAC)
- [ ] 增加更多转场效果 (淡入淡出、旋转、滑动)
- [ ] 支持自定义转场时机
- [ ] 添加滤镜和特效
- [ ] 支持视频导出多种格式
- [ ] 音频可视化增强
- [ ] 批量处理功能

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
