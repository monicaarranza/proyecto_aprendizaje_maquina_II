# Visual Assistant Web App

Prototipo funcional de una aplicación web de asistencia visual para personas con discapacidad visual. Incluye reconocimiento de objetos (YOLOv8), OCR (Tesseract) y captioning de imágenes, con retroalimentación auditiva en tiempo real.

## Estructura
- backend/: API en FastAPI con endpoints para cada modelo
- frontend/: Interfaz React accesible
- models/: Modelos preentrenados y scripts de optimización
- tests/: Pruebas unitarias y de integración

## Instalación rápida

### Backend
```
cd backend
pip install -r requirements.txt
```

### Frontend
```
cd frontend
npm install
```

## Ejecución

### Backend
```
uvicorn main:app --reload
```

### Frontend
```
npm start
```

## Créditos

