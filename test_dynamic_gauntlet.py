import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from services.gemini_service import generate_interview_flow

try:
    flow = generate_interview_flow(
        role="Human Resources Manager",
        field="Human Resources",
        experience_level="3-5 years",
        company_type="Product",
        interview_language="English",
        is_gauntlet=True
    )
    import json
    print(json.dumps(flow, indent=2))
except Exception as e:
    print(e)
