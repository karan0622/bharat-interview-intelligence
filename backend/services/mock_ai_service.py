import json
import random
import time

def generate_mock_question(role: str, company_type: str, experience_level: str) -> str:
    """Mock the Claude API response for generating a question."""
    time.sleep(1) # Simulate network delay
    questions = [
        "Tell me about a time you had to optimize a slow-performing API or database query.",
        "Describe a situation where you disagreed with a senior engineer or product manager on an architectural decision. How did you handle it?",
        "How do you ensure your code is maintainable and scalable when working under tight deadlines?",
        "Can you walk me through the most complex bug you've ever had to debug and fix?"
    ]
    return random.choice(questions)

def mock_transcribe_audio(file_bytes: bytes) -> str:
    """Mock the Whisper/AssemblyAI API response for transcription."""
    time.sleep(2) # Simulate processing delay
    return "Um, actually, I worked on a project where the database query was very slow. So we added an index and, like, it got faster."

def evaluate_mock_answer(question: str, transcript: str) -> dict:
    """Mock the Claude API response for evaluating the answer."""
    time.sleep(2)
    return {
        "content_score": 6.5,
        "communication_score": 5.0,
        "pace_score": 7.0,
        "feedback": "Your answer hit the basic technical point (adding an index), but lacked the STAR method structure. Additionally, filler words ('um', 'like', 'actually') distracted from your core message. Try to pause instead of using fillers."
    }
