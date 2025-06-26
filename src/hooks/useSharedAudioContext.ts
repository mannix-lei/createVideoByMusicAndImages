import { useRef, useCallback } from 'react'

interface SharedAudioContext {
  audioContext: AudioContext | null
  audioSource: MediaElementAudioSourceNode | null
  audioDestination: MediaStreamAudioDestinationNode | null
}

export const useSharedAudioContext = () => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)

  const initializeAudioContext = useCallback(async (audioElement: HTMLAudioElement) => {
    if (audioContextRef.current && audioSourceRef.current && audioDestinationRef.current) {
      // 已经初始化过了
      return {
        audioContext: audioContextRef.current,
        audioSource: audioSourceRef.current,
        audioDestination: audioDestinationRef.current
      }
    }

    // 创建音频上下文
    const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported')
    }

    const audioContext = audioContextRef.current || new AudioContextClass()
    if (!audioContextRef.current) {
      audioContextRef.current = audioContext
    }

    // 确保音频元素已经加载
    if (audioElement.readyState < 2) {
      await new Promise((resolve) => {
        const handler = () => {
          audioElement.removeEventListener('canplaythrough', handler)
          resolve(void 0)
        }
        audioElement.addEventListener('canplaythrough', handler)
      })
    }

    // 创建音频源和目标（只创建一次）
    if (!audioSourceRef.current) {
      audioSourceRef.current = audioContext.createMediaElementSource(audioElement)
    }
    
    if (!audioDestinationRef.current) {
      audioDestinationRef.current = audioContext.createMediaStreamDestination()
    }

    // 连接音频源到目标和扬声器
    audioSourceRef.current.connect(audioDestinationRef.current)
    audioSourceRef.current.connect(audioContext.destination) // 保持音频播放

    return {
      audioContext,
      audioSource: audioSourceRef.current,
      audioDestination: audioDestinationRef.current
    }
  }, [])

  const getSharedAudioContext = useCallback((): SharedAudioContext => {
    return {
      audioContext: audioContextRef.current,
      audioSource: audioSourceRef.current,
      audioDestination: audioDestinationRef.current
    }
  }, [])

  const cleanupAudioContext = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect()
      } catch (e) {
        console.warn('Failed to disconnect audio source:', e)
      }
      audioSourceRef.current = null
    }
    
    if (audioDestinationRef.current) {
      audioDestinationRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  return {
    initializeAudioContext,
    getSharedAudioContext,
    cleanupAudioContext
  }
}
