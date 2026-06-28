import sys
import os
from google import genai
from google.genai import types

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), 'backend/.env'))
client = genai.Client()

prompt = "Generate a JSON with 5 interview questions. Format: {'questions': [{'id': 1, 'question': 'text'}]}"

models_to_test = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash-latest', 'gemini-pro']

for model in models_to_test:
    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        print(f"SUCCESS {model}:", response.text[:50])
    except Exception as e:
        print(f"ERROR {model}:", e)

