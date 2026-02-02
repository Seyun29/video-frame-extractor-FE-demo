import React, { useState, useRef } from 'react'
import './FrameExtractor.css'

const FRAME_COUNTS = [30, 20, 40]

export default function FrameExtractor({ video, onFramesExtracted, onError }) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const extractFrames = async (frameCount) => {
    setIsExtracting(true)
    setProgress(0)

    try {
      const videoElement = document.createElement('video')
      videoElement.src = URL.createObjectURL(video)
      
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = resolve
        videoElement.onerror = reject
      })

      const duration = videoElement.duration
      const interval = duration / frameCount
      const frames = []
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Set canvas to match video dimensions
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight

      for (let i = 0; i < frameCount; i++) {
        const time = i * interval
        videoElement.currentTime = time

        await new Promise((resolve) => {
          videoElement.onseeked = () => {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob)
              frames.push({
                url,
                timestamp: time.toFixed(2),
                index: i + 1
              })
              setProgress(Math.round(((i + 1) / frameCount) * 100))
              resolve()
            }, 'image/jpeg', 0.95)
          }
        })
      }

      onFramesExtracted(frames)
      setProgress(100)
    } catch (err) {
      onError('Failed to extract frames: ' + err.message)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="extractor-container">
      <div className="buttons-group">
        {FRAME_COUNTS.map((count) => (
          <button
            key={count}
            className="extract-btn"
            onClick={() => extractFrames(count)}
            disabled={isExtracting}
          >
            Extract to {count} frames
          </button>
        ))}
      </div>

      {isExtracting && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{progress}%</p>
        </div>
      )}
    </div>
  )
}
