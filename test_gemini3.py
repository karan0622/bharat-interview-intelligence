import sys
import os
from google import genai
from google.genai import types

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), 'backend/.env'))
client = genai.Client()

prompt = "Generate a JSON with 5 interview questions. Format: {'questions': [{'id': 1, 'question': 'text'}]}"

try:
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    print("SUCCESS 2.0-flash:", response.text[:100])
except Exception as e:
    print("ERROR 2.0-flash:", e)

try:
    response = client.models.generate_content(
        model='gemini-1.5-pro',
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    print("SUCCESS 1.5-pro:", response.text[:100])
except Exception as e:
    print("ERROR 1.5-pro:", e)
