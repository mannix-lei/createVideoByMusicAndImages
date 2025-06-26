import React, { useCallback, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface ImageData {
  file: File
  url: string
  id: string
}

interface ImageUploaderProps {
  onImagesUpload: (files: File[]) => void
  images: ImageData[]
  onRemoveImage: (id: string) => void
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesUpload,
  images,
  onRemoveImage
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      onImagesUpload(files)
    }
  }, [onImagesUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      onImagesUpload(files)
    }
    
    // 清空input值以允许重复选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onImagesUpload])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="image-uploader">
      {/* 上传区域 */}
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <Upload size={48} />
        <h3>上传图片</h3>
        <p>拖拽图片到这里或点击选择文件</p>
        <p className="format-hint">支持 JPG, PNG, GIF 格式</p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="image-gallery">
          <h4>已上传的图片 ({images.length})</h4>
          <div className="image-grid">
            {images.map((image) => (
              <div key={image.id} className="image-item">
                <img 
                  src={image.url} 
                  alt={image.file.name}
                  className="image-preview"
                />
                <button
                  className="remove-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveImage(image.id)
                  }}
                  title="删除图片"
                >
                  <X size={16} />
                </button>
                <div className="image-name">{image.file.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
