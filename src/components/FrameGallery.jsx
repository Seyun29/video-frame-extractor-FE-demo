import React, { useState } from 'react'
import './FrameGallery.css'

export default function FrameGallery({ frames }) {
  const [selectedFrame, setSelectedFrame] = useState(null)

  const downloadFrame = (frame) => {
    const link = document.createElement('a')
    link.href = frame.url
    link.download = `frame-${frame.index}.jpg`
    link.click()
  }

  return (
    <div className="gallery-container">
      <h2>Extracted Frames ({frames.length})</h2>
      
      <div className="frames-grid">
        {frames.map((frame) => (
          <div
            key={frame.index}
            className="frame-card"
            onClick={() => setSelectedFrame(frame)}
          >
            <img src={frame.url} alt={`Frame ${frame.index}`} />
            <div className="frame-info">
              <span className="frame-number">#{frame.index}</span>
              <span className="frame-time">{frame.timestamp}s</span>
            </div>
          </div>
        ))}
      </div>

      {selectedFrame && (
        <div className="modal-overlay" onClick={() => setSelectedFrame(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedFrame(null)}>×</button>
            <img src={selectedFrame.url} alt={`Frame ${selectedFrame.index}`} />
            <div className="modal-footer">
              <p>Frame #{selectedFrame.index} at {selectedFrame.timestamp}s</p>
              <button 
                className="download-btn"
                onClick={() => downloadFrame(selectedFrame)}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
