import React, { useState, useEffect, useRef } from 'react';
import './App.css'; 

function speak(text) {
  if (!text || typeof window.speechSynthesis === 'undefined') {
    return;
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const englishVoice = voices.find(v => v.lang.startsWith('en')); 
  utter.voice = englishVoice || null;
  utter.lang = englishVoice ? englishVoice.lang : 'en-US';

  window.speechSynthesis.speak(utter);
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('Upload an image to start.');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          videoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error("Error accessing the camera: ", err);
          setIsCameraOpen(false);
          setStatusMessage("Error: Could not access the camera.");
        });
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isCameraOpen]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);
  
  useEffect(() => {
    speak(statusMessage);
  }, [statusMessage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsCameraOpen(false); 
      setStatusMessage(`File selected: ${file.name}. Choose an action.`);
    }
  };

  const handleCameraOpen = () => {
    setSelectedFile(null); 
    setPreviewUrl('');
    setIsCameraOpen(true);
    setStatusMessage("Camera is on. Press 'Capture' to take a picture.");
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(blob => {
        const file = new File([blob], "camera-capture.png", { type: "image/png" });
        setSelectedFile(file);
        setIsCameraOpen(false);
        setStatusMessage("Photo captured! Choose an action.");
      }, 'image/png');
    }
  };

  const handleRetake = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setIsCameraOpen(false); // Close camera view
    setStatusMessage("Please, upload an image or capture a new one.");
  };

  const handleAnalysis = async (endpoint, resultKey, description) => {
    if (!selectedFile) return;

    setIsLoading(true);
    setStatusMessage(`Processing: ${description}...`);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('There was a problem with the server request.');
      }

      const data = await res.json();
      let resultText = data[resultKey] || data.result || 'Could not get a result.';
      
      if (Array.isArray(resultText)) {
        resultText = resultText.join(', ');
      }
      
      setStatusMessage(resultText);

    } catch (error) {
      console.error('Analysis error:', error);
      setStatusMessage('Error: action not completed.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="app-container">
      <header className="app-header">
        <h1>Visual Assistant</h1>
        <p>Your AI companion for image understanding.</p>
      </header>

      <div className="main-content-wrapper">
        <section className="image-input-section">
          {/* Section for Upload/Capture options when no image is selected */}
          {!selectedFile && !isCameraOpen && (
            <div className="input-options">
              <label htmlFor="file-upload" className="input-option">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.5V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.5"></path><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="2"></line></svg>
                <span>Upload Image</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              <button onClick={handleCameraOpen} className="input-option">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                <span>Capture Photo</span>
              </button>
            </div>
          )}
          
          {/* Section for live camera view */}
          {isCameraOpen && (
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline muted className="camera-feed"></video>
              <button onClick={handleCapture} className="capture-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="3.51" y1="3.51" x2="5.65" y2="5.65"></line><line x1="18.35" y1="18.35" x2="20.49" y2="20.49"></line><line x1="3.51" y1="20.49" x2="5.65" y2="18.35"></line><line x1="18.35" y1="5.65" x2="20.49" y2="3.51"></line></svg>
              </button>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>
          )}

          {/* Section for image preview */}
          {previewUrl && (
            <div className="image-preview-container">
              <img 
                src={previewUrl} 
                alt="Preview of the selected image" 
                className="image-preview" 
              />
              <button onClick={handleRetake} className="retake-button">
                Change/Retake Photo
              </button>
            </div>
          )}
        </section>

        <section className="analysis-section">
          <div className="action-buttons-container">
            <button
              onClick={() => handleAnalysis('/ocr/', 'text', 'Reading text')}
              disabled={!selectedFile || isLoading}
              className="action-button"
              aria-label="Read text from the image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Read Text</span>
            </button>
            
            <button
              onClick={() => handleAnalysis('/detect/', 'objects', 'Detecting objects')}
              disabled={!selectedFile || isLoading}
              className="action-button"
              aria-label="Detect objects in the image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
              <span>Detect Objects</span>
            </button>
            
            <button
              onClick={() => handleAnalysis('/caption/', 'caption', 'Describing scene')}
              disabled={!selectedFile || isLoading}
              className="action-button"
              aria-label="Describe the scene in the image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <span>Describe Scene</span>
            </button>
          </div>
          <div role="status" aria-live="polite" className="status-message">
            {statusMessage}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;