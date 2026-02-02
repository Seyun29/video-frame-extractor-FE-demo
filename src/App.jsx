import React, { useState, useRef } from 'react'
import VideoUploader from './components/VideoUploader'
import FrameExtractor from './components/FrameExtractor'
import FrameGallery from './components/FrameGallery'
import './App.css'

export default function App() {
  const [video, setVideo] = useState(null)
  const [frames, setFrames] = useState([])
  const [error, setError] = useState('')

  const handleVideoUpload = (videoFile) => {
    setVideo(videoFile)
    setFrames([])
    setError('')
  }

  const handleError = (errorMsg) => {
    setError(errorMsg)
  }

  const handleFramesExtracted = (extractedFrames) => {
    setFrames(extractedFrames)
  }

  return (
    <div className="app-container">
      <div className="app-card">
        <h1>Video Frame Extractor</h1>
        
        {!video ? (
          <VideoUploader onUpload={handleVideoUpload} onError={handleError} />
        ) : (
          <>
            <div className="video-info">
              <p>Video: <strong>{video.name}</strong></p>
              <button 
                className="btn-reset"
                onClick={() => {
                  setVideo(null)
                  setFrames([])
                  setError('')
                }}
              >
                Upload Different Video
              </button>
            </div>
            
            <FrameExtractor 
              video={video} 
              onFramesExtracted={handleFramesExtracted}
              onError={handleError}
            />
            
            {frames.length > 0 && (
              <FrameGallery frames={frames} />
            )}
          </>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
