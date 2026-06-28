import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.gemini_service import generate_interview_flow

try:
    flow = generate_interview_flow(
        role="Software Engineer",
        field="Engineering",
        experience_level="1-3 years",
        company_type="Product",
        interview_language="English",
        is_gauntlet=False
    )
    print("SUCCESS:")
    print(flow)
except Exception as e:
    print("ERROR OCCURRED:")
    print(e)
