import os
import sys
import requests

from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), 'backend/.env'))
API_KEY = os.environ.get("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
response = requests.get(url)
models = response.json()

for model in models.get("models", []):
    if "generateContent" in model.get("supportedGenerationMethods", []):
        print(model["name"])
