# 音频文件说明

请将您的音乐文件放置在此目录下。

## 支持的格式
- MP3
- WAV
- OGG
- M4A

## 建议
- 文件名: default-beat.mp3
- 时长: 30-120秒
- 品质: 良好的节拍感，适合制作视频

## 示例文件名
- default-beat.mp3 (默认)
- electronic-beat.mp3
- hip-hop-beat.mp3
- rock-beat.mp3

修改 `src/App.tsx` 中的音频源路径来使用不同的音乐文件：

```typescript
<audio
  ref={audioRef}
  src="/music/your-music-file.mp3"
  // ...
/>
```
