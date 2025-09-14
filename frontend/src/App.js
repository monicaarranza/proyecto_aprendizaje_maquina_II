import React, { useRef, useState } from 'react';

function speak(text) {
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(text);
    // Buscar una voz en español
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) {
      utter.voice = spanishVoice;
      utter.lang = spanishVoice.lang;
    } else {
      utter.lang = 'es-ES'; // fallback
    }
    window.speechSynthesis.speak(utter);
  }
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [objectResult, setObjectResult] = useState('');
  const [captionResult, setCaptionResult] = useState('');
  const inputRef = useRef();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setOcrResult('');
    setObjectResult('');
    setCaptionResult('');
  };

  const handleOcr = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    const res = await fetch('http://localhost:8000/ocr/', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setOcrResult(data.text);
    speak(data.text);
  };

  const handleDetectObjects = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    const res = await fetch('http://localhost:8000/detect/', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setObjectResult(data.objects || data.result || '');
    speak(data.objects ? data.objects.join(', ') : data.result || '');
  };

  const handleCaption = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    const res = await fetch('http://localhost:8000/caption/', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setCaptionResult(data.caption || data.result || '');
    speak(data.caption || data.result || '');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Visual Assistant Web App</h1>
      <p>Prototipo de asistencia visual para personas con discapacidad visual.</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={inputRef}
        aria-label="Subir imagen para análisis"
        style={{ margin: '1rem' }}
      />
      <div style={{ margin: '1rem' }}>
        <button
          onClick={handleOcr}
          disabled={!selectedFile}
          style={{ fontSize: '1.1rem', padding: '0.5rem 1.2rem', marginRight: '0.5rem' }}
          aria-label="Leer texto de la imagen"
        >
          Leer texto (OCR)
        </button>
        <button
          onClick={handleDetectObjects}
          disabled={!selectedFile}
          style={{ fontSize: '1.1rem', padding: '0.5rem 1.2rem', marginRight: '0.5rem' }}
          aria-label="Detectar objetos en la imagen"
        >
          Detectar objetos
        </button>
        <button
          onClick={handleCaption}
          disabled={!selectedFile}
          style={{ fontSize: '1.1rem', padding: '0.5rem 1.2rem' }}
          aria-label="Describir la escena de la imagen"
        >
          Describir escena
        </button>
      </div>
      {ocrResult && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Texto detectado:</h2>
          <p style={{ fontSize: '1.1rem' }}>{ocrResult}</p>
        </div>
      )}
      {objectResult && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Objetos detectados:</h2>
          <p style={{ fontSize: '1.1rem' }}>{Array.isArray(objectResult) ? objectResult.join(', ') : objectResult}</p>
        </div>
      )}
      {captionResult && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Descripción de la escena:</h2>
          <p style={{ fontSize: '1.1rem' }}>{captionResult}</p>
        </div>
      )}
    </div>
  );
}

export default App;
