import React from 'react'
import { Play, Pause, Square, Download, Loader } from 'lucide-react'

interface VideoControlsProps {
  onGenerateVideo: () => void
  onPlayPause: () => void
  onDownload: () => void
  isGenerating: boolean
  isPlaying: boolean
  hasVideo: boolean
  hasImages: boolean
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  onGenerateVideo,
  onPlayPause,
  onDownload,
  isGenerating,
  isPlaying,
  hasVideo,
  hasImages
}) => {
  return (
    <div className="video-controls">
      <div className="control-group">
        <button
          className="control-button primary"
          onClick={onGenerateVideo}
          disabled={!hasImages || isGenerating}
          title="生成视频"
        >
          {isGenerating ? (
            <>
              <Loader className="spin" size={20} />
              生成中...
            </>
          ) : (
            '生成视频'
          )}
        </button>
      </div>

      <div className="control-group">
        <button
          className="control-button"
          onClick={onPlayPause}
          disabled={!hasImages}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          {isPlaying ? '暂停' : '播放'}
        </button>

        <button
          className="control-button"
          onClick={() => {
            if (isPlaying) {
              onPlayPause() // 先暂停
            }
          }}
          disabled={!isPlaying}
          title="停止"
        >
          <Square size={20} />
          停止
        </button>
      </div>

      <div className="control-group">
        <button
          className="control-button success"
          onClick={onDownload}
          disabled={!hasVideo}
          title="下载视频"
        >
          <Download size={20} />
          下载视频
        </button>
      </div>

      <div className="status-info">
        <div className="status-item">
          <span className="status-label">图片:</span>
          <span className={`status-value ${hasImages ? 'ready' : 'not-ready'}`}>
            {hasImages ? '已准备' : '未上传'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">视频:</span>
          <span className={`status-value ${hasVideo ? 'ready' : 'not-ready'}`}>
            {hasVideo ? '已生成' : '未生成'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">播放:</span>
          <span className={`status-value ${isPlaying ? 'playing' : 'paused'}`}>
            {isPlaying ? '播放中' : '已暂停'}
          </span>
        </div>
      </div>
    </div>
  )
}
