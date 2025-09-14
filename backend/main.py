from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import pytesseract
from PIL import Image
import io

import torch
try:
    from ultralytics import YOLO
    yolo_model = YOLO('yolov8n.pt')
except ImportError:
    yolo_model = None

# Captioning setup
try:
    from transformers import BlipProcessor, BlipForConditionalGeneration
    import requests
    caption_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    caption_model = BlipForConditionalGeneration.from_pretrained(
        "Salesforce/blip-image-captioning-base",
        use_safetensors=True
    )
except ImportError:
    caption_processor = None
    caption_model = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Visual Assistant API"}

@app.post("/ocr/")
async def ocr_endpoint(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    # Use Spanish language for OCR
    text = pytesseract.image_to_string(image, lang='spa')
    return {"text": text}



# Endpoint de detección de objetos (YOLOv8 real)
@app.post("/detect/")
async def detect_objects(file: UploadFile = File(...)):
    if yolo_model is None:
        return JSONResponse(status_code=500, content={"error": "YOLOv8 no está instalado"})
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = yolo_model(image)
    names = yolo_model.model.names if hasattr(yolo_model.model, 'names') else None
    detected = set()
    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0]) if hasattr(box, 'cls') else None
            if names and cls is not None:
                detected.add(names[cls])
    return {"objects": list(detected)}


# Endpoint de captioning de imagen (BLIP real + traducción Google Translate API)
@app.post("/caption/")
async def caption_image(file: UploadFile = File(...)):
    if caption_processor is None or caption_model is None:
        return JSONResponse(status_code=500, content={"error": "BLIP no está instalado"})
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = caption_processor(images=image, return_tensors="pt")
    out = caption_model.generate(**inputs)
    caption_en = caption_processor.decode(out[0], skip_special_tokens=True)
    # Traducción usando Google Translate API pública (no oficial)
    try:
        resp = requests.get(
            "https://translate.googleapis.com/translate_a/single",
            params={
                "client": "gtx",
                "sl": "en",
                "tl": "es",
                "dt": "t",
                "q": caption_en
            },
            timeout=5
        )
        resp.raise_for_status()
        data = resp.json()
        caption_es = data[0][0][0] if data and data[0] and data[0][0] else caption_en
    except Exception:
        caption_es = caption_en
    return {"caption": caption_es}
