import requests
from PIL import Image
import io

def test_ocr():
    url = "http://localhost:8000/ocr/"
    with open("test_image.png", "rb") as f:
        files = {"file": ("test_image.png", f, "image/png")}
        response = requests.post(url, files=files)
        print(response.json())

if __name__ == "__main__":
    test_ocr()
