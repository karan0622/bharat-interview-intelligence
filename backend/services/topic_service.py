import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

def extract_json(text: str) -> str:
    match = re.search(r'```(?:json)?\n(.*?)\n```', text, re.DOTALL)
    if match:
        text = match.group(1)
    text = text.strip()
    if text.startswith('{') or text.startswith('['):
        try:
            json.loads(text)
            return text
        except:
            pass
        last_brace = max(text.rfind('}'), text.rfind(']'))
        if last_brace != -1:
            return text[:last_brace+1]
    return text

def generate_syllabus(role: str, experience_level: str) -> list:
    prompt = f"""
    You are an elite technical interviewer and career coach.
    A candidate is preparing for a {role} role with {experience_level} experience.
    
    They want to study EXCLUSIVELY from our website instead of using external resources.
    Therefore, you must generate an EXHAUSTIVE, COMPREHENSIVE curriculum covering EVERY major subject and topic they need to master for FAANG-level interviews.
    
    CRITICAL CONSTRAINT: To ensure fast processing, limit your response to EXACTLY 5 major categories, with EXACTLY 5 key topics per category.
    
    Group the curriculum into major categories (e.g., "Data Structures & Algorithms", "Operating Systems", "System Design", "Behavioral").
    
    Return ONLY a valid JSON array of category objects, with NO markdown formatting:
    [
      {{
        "category": "Name of the major category",
        "topics": [
          {{
            "id": "unique_id_string",
            "title": "Short descriptive title (e.g. Dynamic Programming)",
            "description": "1-2 sentences on what this covers and why it's important."
          }}
        ]
      }}
    ]
    """
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.7,
            response_mime_type="application/json"
        )
    )
    return json.loads(extract_json(response.text))

def generate_study_material(topic_title: str, role: str) -> str:
    prompt = f"""
    You are an elite software engineering instructor.
    Teach the topic "{topic_title}" specifically for someone preparing for a {role} interview.
    
    Provide your answer in strict, clean Markdown format. 
    
    CRITICAL REQUIREMENT: You MUST include highly visual and interactive diagrams using Mermaid.js syntax. Use ````mermaid` code blocks. 
    Whenever explaining a concept, an algorithm, a system architecture, or a lifecycle, draw a beautiful flowchart, sequence diagram, state diagram, or class diagram to visualize it.
    
    Include:
    1. A brief introduction.
    2. Core Concepts (explain visually with at least 1-2 Mermaid.js diagrams, and use code blocks if applicable).
    3. Common Interview Pitfalls.
    4. Top 3 frequently asked interview questions on this topic.
    """
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.5)
    )
    return response.text

def generate_practice_test(topic_title: str, role: str) -> list:
    prompt = f"""
    Generate exactly 3 challenging practice interview questions about "{topic_title}" for a {role}.
    
    Return ONLY a valid JSON array of objects, with NO markdown formatting:
    [
      {{
        "id": "q1",
        "question_text": "The actual question",
        "difficulty": "Medium or Hard",
        "expected_key_points": "1 sentence on what a good answer must include"
      }}
    ]
    """
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.7)
    )
    return json.loads(extract_json(response.text))

def evaluate_test_answers(topic_title: str, q_and_a: list) -> dict:
    prompt = f"""
    You are a strict FAANG interviewer evaluating a candidate's written answers to a test on "{topic_title}".
    
    Here are the Questions and the Candidate's Answers:
    {json.dumps(q_and_a, indent=2)}
    
    Evaluate them and return ONLY a valid JSON object, with NO markdown formatting:
    {{
      "overall_score_percentage": 85,
      "strengths": ["string"],
      "areas_to_improve": ["string"],
      "detailed_feedback": [
        {{
          "question_id": "q1",
          "is_correct": true,
          "feedback": "Why it was good or bad"
        }}
      ]
    }}
    """
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.4)
    )
    return json.loads(extract_json(response.text))
