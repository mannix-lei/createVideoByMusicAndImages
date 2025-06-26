import React, { useEffect, useRef, useCallback, useState } from 'react'

interface ImageData {
  file: File
  url: string
  id: string
}

interface ExtendedBlob extends Blob {
  fileExtension?: string
}

interface VideoRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  images: ImageData[]
  isPlaying: boolean
  audioRef: React.RefObject<HTMLAudioElement | null>
  initializeAudioContext: (audioElement: HTMLAudioElement) => Promise<{
    audioContext: AudioContext
    audioSource: MediaElementAudioSourceNode
    audioDestination: MediaStreamAudioDestinationNode
  }>
  onVideoGenerated?: (blob: ExtendedBlob) => void
}

export const VideoRenderer: React.FC<VideoRendererProps> = ({
  canvasRef,
  images,
  isPlaying,
  audioRef,
  initializeAudioContext,
  onVideoGenerated
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isImageVisible, setIsImageVisible] = useState(true)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [shakeX, setShakeX] = useState(0)
  const [shakeY, setShakeY] = useState(0)
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | 'top' | 'bottom'>('left')
  const [glowEffect, setGlowEffect] = useState<{color: string, intensity: number, size: number} | null>(null)
  const [rotation, setRotation] = useState(0)
  const [blur, setBlur] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const [transitionType, setTransitionType] = useState<'slide' | 'zoom' | 'rotate' | 'fade' | 'spiral'>('slide')
  const animationFrameRef = useRef<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const transitionStartTime = useRef<number>(0)
  const lastImageChangeTime = useRef<number>(0)
  const imageDisplayTime = useRef<number>(0)

  // 加载图片到内存
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    const currentMap = loadedImagesRef.current
    const loadImages = async () => {
      const imagePromises = images.map(imageData => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            currentMap.set(imageData.id, img)
            resolve()
          }
          img.onerror = reject
          img.src = imageData.url
        })
      })

      try {
        await Promise.all(imagePromises)
        console.log(`Loaded ${images.length} images`)
      } catch (error) {
        console.error('Failed to load images:', error)
      }
    }

    if (images.length > 0) {
      loadImages()
    }

    return () => {
      currentMap.clear()
    }
  }, [images])

  // 渲染当前帧
  const renderFrame = useCallback(() => {
    if (!canvasRef.current || images.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 如果图片不可见，则不渲染
    if (!isImageVisible) return

    // 获取当前图片
    const currentImage = images[currentImageIndex]
    if (!currentImage) return

    const img = loadedImagesRef.current.get(currentImage.id)
    if (!img) return

    // 计算图片基本尺寸和位置
    const canvasAspect = canvas.width / canvas.height
    const imageAspect = img.width / img.height

    let baseWidth, baseHeight
    if (imageAspect > canvasAspect) {
      baseWidth = canvas.width
      baseHeight = canvas.width / imageAspect
    } else {
      baseWidth = canvas.height * imageAspect
      baseHeight = canvas.height
    }

    // 应用缩放和偏移
    const drawWidth = baseWidth * scale
    const drawHeight = baseHeight * scale
    
    // 基础居中位置
    let x = (canvas.width - drawWidth) / 2
    let y = (canvas.height - drawHeight) / 2

    // 如果正在转场，应用动画偏移
    if (isTransitioning) {
      const elapsed = Date.now() - transitionStartTime.current
      const duration = 800 // 增加转场时间
      const progress = Math.min(elapsed / duration, 1)
      
      // 根据转场方向计算偏移
      const maxOffset = canvas.width * 1.5 // 超出画布宽度
      const easeProgress = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      
      switch (transitionDirection) {
        case 'left':
          x += (1 - easeProgress) * maxOffset
          break
        case 'right':
          x -= (1 - easeProgress) * maxOffset
          break
        case 'top':
          y += (1 - easeProgress) * maxOffset
          break
        case 'bottom':
          y -= (1 - easeProgress) * maxOffset
          break
      }
    }

    // 添加抖动效果
    x += shakeX
    y += shakeY

    // 添加位置偏移
    x += offsetX
    y += offsetY

    // 保存画布状态
    ctx.save()

    // 应用全局透明度
    ctx.globalAlpha = opacity

    // 应用模糊效果
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`
    }

    // 应用旋转效果
    if (rotation !== 0) {
      // 移动到画布中心进行旋转
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
    }

    // 绘制光晕效果
    if (glowEffect) {
      const gradient = ctx.createRadialGradient(
        x + drawWidth / 2, y + drawHeight / 2, 0,
        x + drawWidth / 2, y + drawHeight / 2, glowEffect.size
      )
      gradient.addColorStop(0, `${glowEffect.color}${Math.floor(glowEffect.intensity * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(0.5, `${glowEffect.color}${Math.floor(glowEffect.intensity * 0.5 * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, `${glowEffect.color}00`)
      
      ctx.fillStyle = gradient
      ctx.fillRect(x - glowEffect.size / 2, y - glowEffect.size / 2, 
                   drawWidth + glowEffect.size, drawHeight + glowEffect.size)
    }

    // 绘制图片
    ctx.drawImage(img, x, y, drawWidth, drawHeight)
    
    // 恢复画布状态
    ctx.restore()

    // 添加转场时的动态效果
    if (isTransitioning) {
      const elapsed = Date.now() - transitionStartTime.current
      
      // 根据转场类型添加特殊效果
      if (transitionType === 'spiral' || transitionType === 'rotate') {
        // 旋转时添加径向模糊效果
        const alpha = Math.sin((elapsed / 100)) * 0.05
        ctx.save()
        ctx.globalAlpha = Math.abs(alpha)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
      } else if (transitionType === 'zoom') {
        // 缩放时添加脉冲效果
        const pulse = Math.sin((elapsed / 80)) * 0.03
        ctx.save()
        ctx.globalAlpha = Math.abs(pulse)
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
        )
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
      } else {
        // 其他转场添加闪光效果
        const alpha = Math.sin((elapsed / 120)) * 0.08
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(alpha)})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [canvasRef, images, currentImageIndex, scale, isTransitioning, transitionDirection, shakeX, shakeY, offsetX, offsetY, isImageVisible, glowEffect, rotation, blur, opacity, transitionType])

  // 确保首次加载时显示第一张图片
  useEffect(() => {
    if (images.length > 0 && !isPlaying) {
      console.log('VideoRenderer: Ensuring first image is visible when not playing')
      setIsImageVisible(true)
      // 触发一次渲染以显示静态图片
      renderFrame()
    }
  }, [images.length, isPlaying, renderFrame])

  // TikTok风格的缓动函数
  const easeOutBack = (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  const easeOutElastic = (t: number): number => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  }

  // 处理节拍触发的转场效果
  const triggerBeatTransition = useCallback((intensity: number) => {
    const currentTime = Date.now()
    
    console.log('VideoRenderer: triggerBeatTransition called', { 
      intensity, 
      currentTime, 
      lastImageChangeTime: lastImageChangeTime.current,
      timeSinceLastChange: currentTime - lastImageChangeTime.current,
      imagesLength: images.length 
    })
    
    // 限制切换频率，确保图片有足够的停留时间
    if (currentTime - lastImageChangeTime.current < 1200) {
      console.log('VideoRenderer: Transition blocked due to frequency limit')
      return
    }

    console.log('Beat detected! Starting TikTok-style transition with intensity:', intensity)

    // 随机选择TikTok风格的转场类型
    const transitionTypes: ('slide' | 'zoom' | 'rotate' | 'fade' | 'spiral')[] = ['slide', 'zoom', 'rotate', 'fade', 'spiral']
    const randomTransitionType = transitionTypes[Math.floor(Math.random() * transitionTypes.length)]
    setTransitionType(randomTransitionType)
    
    console.log('VideoRenderer: Selected transition type:', randomTransitionType)

    // 随机选择转场方向
    const directions: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom']
    const randomDirection = directions[Math.floor(Math.random() * directions.length)]
    setTransitionDirection(randomDirection)

    // 随机生成更炫酷的光晕效果
    const glowColors = ['#ff0050', '#00ff88', '#0088ff', '#ff8800', '#8800ff', '#ffff00', '#ff0088']
    const randomColor = glowColors[Math.floor(Math.random() * glowColors.length)]
    const glowIntensity = 0.4 + intensity * 0.5 // 更强的光晕
    const glowSize = 150 + intensity * 250 // 更大的光晕
    
    setGlowEffect({
      color: randomColor,
      intensity: glowIntensity,
      size: glowSize
    })

    setIsTransitioning(true)
    setIsImageVisible(true)
    transitionStartTime.current = currentTime
    imageDisplayTime.current = currentTime
    
    // 切换到下一张图片
    setCurrentImageIndex(prev => (prev + 1) % images.length)
    
    // TikTok风格的分阶段动画
    const animateTransition = (startTime: number) => {
      const elapsed = Date.now() - startTime
      const enterDuration = 600 // 更快的转场
      const stabilizeDuration = 300 // 稳定期
      const totalDuration = enterDuration + stabilizeDuration
      
      if (elapsed < enterDuration) {
        // 进入阶段 - 使用不同的缓动函数让动画更柔顺
        const progress = elapsed / enterDuration
        let easedProgress: number
        
        switch (randomTransitionType) {
          case 'zoom':
            easedProgress = easeOutBack(progress)
            break
          case 'rotate':
            easedProgress = easeOutElastic(progress)
            break
          case 'spiral':
            easedProgress = easeInOutCubic(progress)
            break
          default:
            easedProgress = easeInOutCubic(progress)
        }
        
        // 根据转场类型应用不同效果
        switch (randomTransitionType) {
          case 'zoom': {
            // 缩放转场
            const initialScale = 0.3 + intensity * 0.2
            const finalScale = 1.0
            setScale(initialScale + (finalScale - initialScale) * easedProgress)
            setOpacity(easedProgress)
            break
          }
          case 'rotate': {
            // 旋转转场
            const maxRotation = 360 + intensity * 180
            setRotation(maxRotation * (1 - easedProgress))
            setScale(0.8 + 0.2 * easedProgress)
            break
          }
          case 'fade': {
            // 渐变转场
            setOpacity(easedProgress)
            setScale(0.9 + 0.1 * easedProgress)
            setBlur(20 * (1 - easedProgress))
            break
          }
          case 'spiral': {
            // 螺旋转场
            const spiralRotation = 720 * (1 - easedProgress)
            const spiralScale = 0.1 + 0.9 * easedProgress
            setRotation(spiralRotation)
            setScale(spiralScale)
            setOpacity(easedProgress)
            break
          }
          default: {
            // slide
            setScale(0.8 + 0.2 * easedProgress)
            break
          }
        }
        
        // 只在转场前半段添加抖动效果
        if (progress < 0.5) {
          const shakeIntensity = intensity * 12 * (1 - progress * 2)
          setShakeX((Math.random() - 0.5) * shakeIntensity)
          setShakeY((Math.random() - 0.5) * shakeIntensity)
        } else {
          // 转场后半段停止抖动，让图片稳定下来
          setShakeX(0)
          setShakeY(0)
        }
        
        // 位置偏移动画（仅对slide类型）
        if (randomTransitionType === 'slide') {
          const offsetIntensity = intensity * 25 * (1 - easedProgress)
          setOffsetX((Math.random() - 0.5) * offsetIntensity)
          setOffsetY((Math.random() - 0.5) * offsetIntensity)
        }
        
        requestAnimationFrame(() => animateTransition(startTime))
      } else if (elapsed < totalDuration) {
        // 稳定阶段 - 图片已经稳定，微调到最终状态
        // 所有效果都渐变到最终状态
        setScale(1)
        setRotation(0)
        setBlur(0)
        setOpacity(1)
        setShakeX(0)
        setShakeY(0)
        setOffsetX(0)
        setOffsetY(0)
        
        requestAnimationFrame(() => animateTransition(startTime))
      } else {
        // 转场完全结束，图片完全稳定
        setScale(1)
        setRotation(0)
        setBlur(0)
        setOpacity(1)
        setShakeX(0)
        setShakeY(0)
        setOffsetX(0)
        setOffsetY(0)
        setIsTransitioning(false)
        
        // 逐渐减弱光晕效果
        const fadeGlow = () => {
          setGlowEffect(prev => {
            if (!prev || prev.intensity <= 0.1) {
              return null
            }
            return {
              ...prev,
              intensity: prev.intensity * 0.95 // 更快减弱
            }
          })
          
          if (Date.now() - currentTime < 2000) { // 2秒内完成光晕消退
            setTimeout(fadeGlow, 30)
          }
        }
        
        setTimeout(fadeGlow, 100)
        lastImageChangeTime.current = currentTime
      }
    }

    animateTransition(currentTime)
  }, [images.length, setRotation, setBlur, setOpacity, setTransitionType])

  // 暴露节拍触发函数给父组件
  useEffect(() => {
    // 这里可以通过props传递给父组件
    if (typeof window !== 'undefined') {
      (window as typeof window & { triggerBeatTransition?: (intensity: number) => void }).triggerBeatTransition = triggerBeatTransition
    }
  }, [triggerBeatTransition])

  // 渲染循环
  useEffect(() => {
    console.log('VideoRenderer: Render loop effect called', { 
      isPlaying, 
      imagesLength: images.length,
      currentImageIndex 
    })
    
    const animate = () => {
      renderFrame()
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    if (isPlaying && images.length > 0) {
      console.log('VideoRenderer: Starting animation loop')
      animate()
    } else if (animationFrameRef.current) {
      console.log('VideoRenderer: Stopping animation loop')
      cancelAnimationFrame(animationFrameRef.current)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, images.length, renderFrame, currentImageIndex])

  // 录制视频
  const startRecording = useCallback(async () => {
    if (!canvasRef.current || !audioRef.current) return

    try {
      // 获取视频流
      const videoStream = canvasRef.current.captureStream(30) // 30 FPS
      
      // 使用传入的初始化函数
      const { audioDestination } = await initializeAudioContext(audioRef.current)
      
      // 合并音频和视频流
      const combinedStream = new MediaStream()
      
      // 添加视频轨道
      videoStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track)
      })
      
      // 添加音频轨道
      audioDestination.stream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track)
      })
      
      console.log('Combined stream tracks:', {
        video: combinedStream.getVideoTracks().length,
        audio: combinedStream.getAudioTracks().length
      })
      
      // 尝试不同的视频格式，优先MP4
      let mimeType = 'video/mp4'
      let fileExtension = 'mp4'
      
      // 检查浏览器支持的格式
      if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E"')) {
        mimeType = 'video/mp4; codecs="avc1.42E01E"'
        console.log('Using MP4 format with H.264 codec')
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4'
        console.log('Using MP4 format')
      } else if (MediaRecorder.isTypeSupported('video/webm; codecs="vp9"')) {
        mimeType = 'video/webm; codecs="vp9"'
        fileExtension = 'webm'
        console.log('MP4 not supported, using WebM with VP9 codec')
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm'
        fileExtension = 'webm'
        console.log('MP4 not supported, using WebM format')
      } else {
        console.warn('No supported video format found, using default')
        mimeType = ''
        fileExtension = 'webm'
      }

      console.log(`Recording with format: ${mimeType} (with audio)`)

      const options: MediaRecorderOptions = {}
      if (mimeType) {
        options.mimeType = mimeType
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options)

      recordedChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType || 'video/webm'
        })
        
        // 存储文件扩展名供下载时使用
        Object.defineProperty(blob, 'fileExtension', {
          value: fileExtension,
          writable: false,
          enumerable: false
        })
        
        onVideoGenerated?.(blob)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder

      console.log('Started video recording with audio')
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [canvasRef, audioRef, onVideoGenerated, initializeAudioContext])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      console.log('Stopped video recording')
    }
  }, [])

  // 自动开始/停止录制
  useEffect(() => {
    if (isPlaying && images.length > 0) {
      startRecording()
    } else {
      stopRecording()
    }
  }, [isPlaying, images.length, startRecording, stopRecording])

  return (
    <div className="video-renderer">
      <div className="renderer-info">
        <div>当前图片: {currentImageIndex + 1} / {images.length}</div>
        <div>缩放: {scale.toFixed(2)}x</div>
        <div>转场中: {isTransitioning ? '是' : '否'}</div>
        <div>转场类型: {transitionType}</div>
        <div>方向: {transitionDirection}</div>
        <div>旋转: {rotation.toFixed(1)}°</div>
        <div>模糊: {blur.toFixed(1)}px</div>
        <div>透明度: {(opacity * 100).toFixed(0)}%</div>
        <div>抖动: X:{shakeX.toFixed(1)} Y:{shakeY.toFixed(1)}</div>
        <div>光晕: {glowEffect ? `${glowEffect.color} (${(glowEffect.intensity*100).toFixed(0)}%)` : '无'}</div>
        <div>可见: {isImageVisible ? '是' : '否'}</div>
      </div>
    </div>
  )
}
