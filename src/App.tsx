import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioAnalyzer } from './components/AudioAnalyzer'
import { ImageUploader } from './components/ImageUploader'
import { VideoRenderer } from './components/VideoRenderer'
import { VideoControls } from './components/VideoControls'
import { useSharedAudioContext } from './hooks/useSharedAudioContext'
import './App.css'
import Audio from './assets/music/default-beat.mp3'
interface ImageData {
  file: File
  url: string
  id: string
}

interface ExtendedBlob extends Blob {
  fileExtension?: string
}

function App() {
  const [images, setImages] = useState<ImageData[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentVideoBlob, setCurrentVideoBlob] = useState<ExtendedBlob | null>(null)
  const [audioContextInitialized, setAudioContextInitialized] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // 使用共享的音频上下文
  const { initializeAudioContext, getSharedAudioContext, cleanupAudioContext } = useSharedAudioContext()

  // 初始化音频上下文的函数
  const handleInitializeAudio = useCallback(async () => {
    if (audioRef.current && !audioContextInitialized) {
      try {
        await initializeAudioContext(audioRef.current)
        setAudioContextInitialized(true)
        console.log('Audio context initialized successfully')
      } catch (error) {
        console.error('Failed to initialize audio context:', error)
      }
    }
  }, [initializeAudioContext, audioContextInitialized])

  // 处理图片上传
  const handleImagesUpload = useCallback((files: File[]) => {
    const newImages: ImageData[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }))
    setImages(prev => [...prev, ...newImages])
  }, [])

  // 删除图片
  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      // 清理URL对象
      const toRemove = prev.find(img => img.id === id)
      if (toRemove) {
        URL.revokeObjectURL(toRemove.url)
      }
      return filtered
    })
  }, [])

  // 开始生成视频
  const handleGenerateVideo = useCallback(async () => {
    if (images.length === 0) {
      alert('请先上传图片')
      return
    }

    setIsGenerating(true)
    try {
      // 这里会调用VideoRenderer组件来生成视频
      console.log('开始生成视频...')
    } catch (error) {
      console.error('生成视频失败:', error)
      alert('生成视频失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }, [images])

  // 播放/暂停
  const handlePlayPause = useCallback(async () => {
    if (audioRef.current) {
      console.log('=============adf========================');
      console.log(audioRef.current);
      console.log('=====================================');
      
      // 首次播放时初始化音频上下文
      if (!audioContextInitialized && !isPlaying) {
        await handleInitializeAudio()
      }
      
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying, audioContextInitialized, handleInitializeAudio])

  // 下载视频
  const handleDownload = useCallback(() => {
    if (currentVideoBlob) {
      const url = URL.createObjectURL(currentVideoBlob)
      const a = document.createElement('a')
      a.href = url
      
      // 获取文件扩展名，优先使用MP4
      const fileExtension = currentVideoBlob.fileExtension || 'mp4'
      a.download = `music-video-${Date.now()}.${fileExtension}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [currentVideoBlob])

  // 清理资源
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url))
      if (currentVideoBlob) {
        URL.revokeObjectURL(URL.createObjectURL(currentVideoBlob))
      }
      cleanupAudioContext()
    }
  }, [images, currentVideoBlob, cleanupAudioContext])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 音乐节拍视频生成器</h1>
        <p>上传图片，跟随音乐节拍创建酷炫视频</p>
      </header>

      <main className="app-main">
        {/* 图片上传区域 */}
        <section className="upload-section">
          <ImageUploader 
            onImagesUpload={handleImagesUpload}
            images={images}
            onRemoveImage={handleRemoveImage}
          />
        </section>

        {/* 视频渲染区域 */}
        <section className="video-section">
          <div className="video-container">
            <canvas 
              ref={canvasRef}
              width={360}
              height={640}
              className="video-canvas"
            />
            <VideoRenderer 
              canvasRef={canvasRef}
              images={images}
              isPlaying={isPlaying}
              audioRef={audioRef}
              initializeAudioContext={initializeAudioContext}
              onVideoGenerated={setCurrentVideoBlob}
            />
          </div>

          {/* 控制面板 */}
          <VideoControls
            onGenerateVideo={handleGenerateVideo}
            onPlayPause={handlePlayPause}
            onDownload={handleDownload}
            isGenerating={isGenerating}
            isPlaying={isPlaying}
            hasVideo={!!currentVideoBlob}
            hasImages={images.length > 0}
          />
        </section>

        {/* 音频分析器 */}
        <AudioAnalyzer 
          audioRef={audioRef}
          isPlaying={isPlaying}
          sharedAudioContext={audioContextInitialized ? getSharedAudioContext().audioContext : null}
          sharedAudioSource={audioContextInitialized ? getSharedAudioContext().audioSource : null}
          onBeatDetected={(intensity: number) => {
            // 触发视频渲染器中的节拍转场效果
            if (typeof window !== 'undefined') {
              const globalWindow = window as typeof window & { triggerBeatTransition?: (intensity: number) => void }
              globalWindow.triggerBeatTransition?.(intensity)
            }
          }}
        />

        {/* 隐藏的音频元素 */}
        <audio
          ref={audioRef}
          src={Audio}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          preload="auto"
          crossOrigin="anonymous"
          loop={false}
        />
      </main> 
    </div>
  )
}

export default App
