import React, { useState, useRef } from 'react'
import VideoUploader from './components/VideoUploader'
import VideoMetadata from './components/VideoMetadata'
import CropTool from './components/CropTool'
import FrameExtractor from './components/FrameExtractor'
import FrameGallery from './components/FrameGallery'
import './App.css'

export default function App() {
  const [videos, setVideos] = useState([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [stage, setStage] = useState('upload') // 'upload' | 'crop' | 'extract' | 'result'
  const [error, setError] = useState('')
  const [showCropTool, setShowCropTool] = useState(false)
  const [mergedFrames, setMergedFrames] = useState([])

  const handleVideoUpload = (videoFile) => {
    const newVideo = {
      file: videoFile,
      cropSettings: null,
      frames: []
    }
    setVideos([...videos, newVideo])
    setShowCropTool(true)
    setError('')
  }

  const handleError = (errorMsg) => {
    setError(errorMsg)
  }

  const handleCropApply = (settings) => {
    const updatedVideos = [...videos]
    updatedVideos[currentVideoIndex].cropSettings = settings
    setVideos(updatedVideos)
    setShowCropTool(false)

    // If this is the first video, show "Upload Next Video" button
    // If this is the second video, start extraction
    if (currentVideoIndex === 0) {
      setStage('waiting-for-second-video')
    } else if (currentVideoIndex === 1) {
      // Start extraction for both videos
      setTimeout(() => {
        setStage('extract')
      }, 100)
    }
  }

  const handleNextVideo = () => {
    setCurrentVideoIndex(1)
    setStage('upload')
  }

  const handleFramesExtracted = (extractedFrames) => {
    const updatedVideos = [...videos]
    updatedVideos[currentVideoIndex].frames = extractedFrames
    setVideos(updatedVideos)

    // If both videos have frames, merge them
    if (updatedVideos[0].frames.length > 0 && updatedVideos[1].frames.length > 0) {
      mergeFrames(updatedVideos[0].frames, updatedVideos[1].frames)
    }
  }

  const mergeFrames = async (frames1, frames2) => {
    try {
      const merged = []
      const frameCount = Math.min(frames1.length, frames2.length)

      for (let i = 0; i < frameCount; i++) {
        const mergedFrame = await mergeTwoImages(frames1[i], frames2[i])
        merged.push(mergedFrame)
      }

      setMergedFrames(merged)
      setStage('result')
    } catch (err) {
      setError('Failed to merge frames: ' + err.message)
    }
  }

  const mergeTwoImages = (frame1, frame2) => {
    return new Promise((resolve) => {
      const img1 = new Image()
      const img2 = new Image()
      let loadedCount = 0

      const onLoad = () => {
        loadedCount++
        if (loadedCount === 2) {
          // Create temporary canvas for rotated images
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')
          
          // Rotate each image 90 degrees clockwise
          const rotatedImg1 = rotateImage90(img1)
          const rotatedImg2 = rotateImage90(img2)
          
          // Merge rotated images side by side
          tempCanvas.width = rotatedImg1.width + rotatedImg2.width
          tempCanvas.height = Math.max(rotatedImg1.height, rotatedImg2.height)
          
          tempCtx.drawImage(rotatedImg1, 0, 0)
          tempCtx.drawImage(rotatedImg2, rotatedImg1.width, 0)

          // Resize to 6 inch wide x 4 inch tall (576x384 @ 96 DPI)
          const finalCanvas = document.createElement('canvas')
          const finalCtx = finalCanvas.getContext('2d')
          finalCanvas.width = 576  // 6 inch horizontal
          finalCanvas.height = 384 // 4 inch vertical
          
          finalCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, 576, 384)

          finalCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            resolve({
              url,
              index: frame1.index,
              timestamp: frame1.timestamp
            })
          }, 'image/jpeg', 0.95)
        }
      }

      img1.onload = onLoad
      img2.onload = onLoad
      img1.src = frame1.url
      img2.src = frame2.url
    })
  }

  const rotateImage90 = (img) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.height
    canvas.height = img.width
    const ctx = canvas.getContext('2d')
    
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    
    return canvas
  }

  const currentVideo = videos[currentVideoIndex]

  return (
    <div className="app-container">
      <div className="app-card">
        <h1>Video Frame Extractor (Dual Mode)</h1>

        {stage === 'upload' && (
          <>
            <div className="stage-indicator">
              <span>Video {currentVideoIndex + 1} of 2</span>
            </div>
            <VideoUploader onUpload={handleVideoUpload} onError={handleError} />
          </>
        )}

        {stage === 'waiting-for-second-video' && (
          <>
            <div className="video-info">
              <p>Video 1: <strong>{videos[0].file.name}</strong> ✓</p>
              <button className="btn-next-video" onClick={handleNextVideo}>
                Upload Video 2
              </button>
            </div>
          </>
        )}

        {stage === 'extract' && videos.length === 2 && (
          <>
            <div className="extraction-progress">
              <h3>Extracting frames from both videos...</h3>
              {videos.map((v, idx) => (
                <div key={idx} className="video-extraction-item">
                  <p>Video {idx + 1}: <strong>{v.file.name}</strong></p>
                  {v.frames.length === 0 && (
                    <FrameExtractor
                      video={v.file}
                      onFramesExtracted={(frames) => {
                        const updatedVideos = [...videos]
                        updatedVideos[idx].frames = frames
                        setVideos(updatedVideos)
                        
                        // Check if both videos are done
                        if (updatedVideos[0].frames.length > 0 && updatedVideos[1].frames.length > 0) {
                          mergeFrames(updatedVideos[0].frames, updatedVideos[1].frames)
                        }
                      }}
                      onError={handleError}
                      cropSettings={v.cropSettings}
                      frameCount={30}
                    />
                  )}
                  {v.frames.length > 0 && (
                    <p className="extraction-done">✓ {v.frames.length} frames extracted</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {stage === 'result' && (
          <FrameGallery
            frames={mergedFrames}
            originalFrames={videos}
          />
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {showCropTool && currentVideo && (
        <CropTool
          video={currentVideo.file}
          onCropApply={handleCropApply}
          onCancel={() => setShowCropTool(false)}
        />
      )}
    </div>
  )
}
