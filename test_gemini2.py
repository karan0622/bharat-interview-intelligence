import sys
import os
import json
from google import genai

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), 'backend/.env'))
client = genai.Client()

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='Write a haiku',
    )
    print("SUCCESS 2.5-flash:", response.text)
except Exception as e:
    print("ERROR 2.5-flash:", e)

try:
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents='Write a haiku',
    )
    print("SUCCESS 1.5-flash:", response.text)
except Exception as e:
    print("ERROR 1.5-flash:", e)
