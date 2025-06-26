import React, { useEffect, useRef, useCallback, useState } from 'react'

interface AudioAnalyzerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  onBeatDetected: (intensity: number) => void
  sharedAudioContext?: AudioContext | null
  sharedAudioSource?: MediaElementAudioSourceNode | null
}

export const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({
  audioRef,
  isPlaying,
  onBeatDetected,
  sharedAudioContext,
  sharedAudioSource
}) => {
  const [analyzer, setAnalyzer] = useState<AnalyserNode | null>(null)
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const animationFrameRef = useRef<number>(0)
  const lastBeatTime = useRef<number>(0)

  // 初始化音频分析器 - 使用共享的音频上下文和源
  useEffect(() => {
    console.log('AudioAnalyzer useEffect called', { 
      hasAudioRef: !!audioRef.current, 
      hasSharedContext: !!sharedAudioContext, 
      hasSharedSource: !!sharedAudioSource 
    })
    
    if (!audioRef.current || !sharedAudioContext || !sharedAudioSource) {
      console.log('AudioAnalyzer: Missing required dependencies, skipping initialization')
      return
    }

    const initAudioAnalyzer = async () => {
      try {
        console.log('AudioAnalyzer: Starting initialization with shared context')
        const analyserNode = sharedAudioContext.createAnalyser()
        
        analyserNode.fftSize = 256
        analyserNode.smoothingTimeConstant = 0.85
        
        // 使用共享的音频源连接到分析器
        sharedAudioSource.connect(analyserNode)
        // 注意：不再连接到destination，因为VideoRenderer已经连接了
        
        const bufferLength = analyserNode.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        setAnalyzer(analyserNode)
        setFrequencyData(dataArray)
        
        console.log('Audio analyzer initialized successfully with shared context')
      } catch (error) {
        console.error('Failed to initialize audio analyzer:', error)
      }
    }

    initAudioAnalyzer()

    return () => {
      if (sharedAudioContext) {
        sharedAudioContext.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioRef, sharedAudioContext, sharedAudioSource])

  // 分析音频数据
  const analyzeAudio = useCallback(() => {
    if (!analyzer || !frequencyData) return

    analyzer.getByteFrequencyData(frequencyData)
    
    // 计算低频段的平均值（用于节拍检测）
    const bassRange = frequencyData.slice(0, 32) // 低频段
    const bassAverage = bassRange.reduce((sum, value) => sum + value, 0) / bassRange.length
    
    // 节拍检测逻辑 - 调整为更精确的节拍响应
    const currentTime = Date.now()
    const beatThreshold = 130 // 适中的节拍检测阈值
    const minBeatInterval = 600 // 增加最小节拍间隔，与图片停留时间匹配
    
    if (bassAverage > beatThreshold && 
        currentTime - lastBeatTime.current > minBeatInterval) {
      
      // 计算节拍强度，适当提高敏感度以配合新的动画
      const intensity = Math.min((bassAverage - beatThreshold) / (255 - beatThreshold), 1) * 0.9
      console.log(`Beat detected! Intensity: ${intensity.toFixed(2)}, Bass: ${bassAverage.toFixed(1)}`)
      onBeatDetected(intensity)
      lastBeatTime.current = currentTime
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio)
    }
  }, [analyzer, frequencyData, isPlaying, onBeatDetected])

  // 开始/停止分析
  useEffect(() => {
    if (isPlaying && analyzer) {
      // 恢复音频上下文
      if (sharedAudioContext?.state === 'suspended') {
        sharedAudioContext.resume()
      }
      analyzeAudio()
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isPlaying, analyzer, analyzeAudio, sharedAudioContext])

  // 可视化频谱（可选）
  const renderSpectrum = () => {
    if (!frequencyData) return null

    const barCount = 64
    const dataStep = Math.floor(frequencyData.length / barCount)
    const bars = []

    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i * dataStep]
      const height = (value / 255) * 100
      
      bars.push(
        <div
          key={i}
          className="spectrum-bar"
          style={{
            height: `${height}%`,
            backgroundColor: `hsl(${(i / barCount) * 360}, 70%, 50%)`
          }}
        />
      )
    }

    return bars
  }

  return (
    <div className="audio-analyzer">
      <div className="analyzer-info">
        <h4>音频分析器</h4>
        <div className="status">
          状态: {isPlaying ? '正在分析' : '暂停'}
        </div>
      </div>
      
      <div className="spectrum-visualizer">
        {renderSpectrum()}
      </div>
    </div>
  )
}
