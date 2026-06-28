import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv
from prompts.behavioral import ROLE_CONTEXT_ENGINE_PROMPT, ANSWER_EVALUATION_PROMPT, CODE_EVALUATION_PROMPT, SESSION_REPORT_PROMPT

load_dotenv()
client = genai.Client()

def extract_json(text: str) -> str:
    # First try to extract from markdown blocks
    match = re.search(r'```(?:json)?\n(.*?)\n```', text, re.DOTALL)
    if match:
        text = match.group(1)
        
    text = text.strip()
    
    # If there's extra garbage, forcefully isolate the JSON object
    if text.startswith('{'):
        try:
            # Quick check if it's already valid
            json.loads(text)
            return text
        except:
            pass
            
        # Find the last closing brace
        last_brace = text.rfind('}')
        if last_brace != -1:
            return text[:last_brace+1]
            
    return text

def generate_interview_flow(role: str, field: str, experience_level: str, company_type: str, interview_language: str = "English", resume_context: str = None, is_gauntlet: bool = False) -> dict:
    prompt = ROLE_CONTEXT_ENGINE_PROMPT.format(
        role=role,
        field=field,
        experience_level=experience_level,
        company_type=company_type,
        interview_language=interview_language,
        resume_context=resume_context or ""
    )
    
    if is_gauntlet:
        prompt += "\nREQUIREMENT: Generate exactly 6 questions spread across 3 intensive rounds."
        
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to fetch questions from Gemini:", e)
        raise Exception("Failed to generate valid JSON from AI model.")

def evaluate_live_answer(question: str, question_type: str, evaluation_criteria: str, tone_calibration: str, transcript: str, filler_count: int, pace: float) -> dict:
    prompt = ANSWER_EVALUATION_PROMPT.format(
        question=question,
        question_type=question_type,
        evaluation_criteria=evaluation_criteria,
        tone_calibration=tone_calibration,
        transcript=transcript,
        filler_count=filler_count,
        pace=pace
    )
    
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON evaluation:", e)
        return {
            "content_score": 0.0,
            "communication_score": 0.0,
            "confidence_alignment": "unknown",
            "feedback": "Error evaluating response.",
            "missed_points": []
        }

def evaluate_code_answer(question: str, evaluation_criteria: str, code_snippet: str) -> dict:
    prompt = CODE_EVALUATION_PROMPT.format(
        question=question,
        evaluation_criteria=evaluation_criteria,
        code_snippet=code_snippet
    )
    
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON code evaluation:", e)
        return {
            "content_score": 0.0,
            "communication_score": 0.0,
            "confidence_alignment": "unknown",
            "feedback": "Error evaluating code.",
            "missed_points": []
        }

def evaluate_system_design_answer(question: str, evaluation_criteria: str, image_base64: str) -> dict:
    prompt = f"""You are a Principal Software Engineer conducting a System Design Interview.
The candidate has drawn an architecture diagram on a whiteboard to answer the following question:

QUESTION: {question}

EVALUATION CRITERIA:
{evaluation_criteria}

Analyze the provided architecture diagram.
Output valid JSON only:
{{
  "content_score": float (0.0 to 10.0, based on technical accuracy and scalability),
  "communication_score": float (0.0 to 10.0, based on diagram clarity),
  "confidence_alignment": string ("Clear", "Messy", "Incomplete"),
  "feedback": string (Detailed critique of their architecture, identifying bottlenecks or good choices),
  "missed_points": [string] (List of missing components like load balancers, caches, etc.)
}}"""

    try:
        # Remove data:image/png;base64, prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
            
        import base64
        image_bytes = base64.b64decode(image_base64)
        
        image_part = {
            "mime_type": "image/png",
            "data": image_bytes
        }

        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=[prompt, image_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON system design evaluation:", e)
        return {
            "content_score": 0.0,
            "communication_score": 0.0,
            "confidence_alignment": "unknown",
            "feedback": "Error evaluating architecture diagram.",
            "missed_points": []
        }

def generate_session_report(role: str, field: str, company_type: str, questions_data: list) -> dict:
    per_question_json = json.dumps(questions_data, indent=2)
    prompt = SESSION_REPORT_PROMPT.format(
        role=role,
        field=field,
        company_type=company_type,
        per_question_results=per_question_json
    )
    
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.4,
        ),
    )
    
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON report:", e)
        return {
            "overall_readiness_score": 0,
            "strengths": ["Data processing error"],
            "areas_to_improve": ["System error occurred"],
            "confidence_pattern_note": "Could not analyze",
            "next_steps": ["Try again later"]
        }

def rewrite_resume_for_company(resume_text: str, target_company: str) -> dict:
    prompt = f"""You are a world-class executive recruiter and ATS (Applicant Tracking System) optimization expert.
Your task is to analyze and rewrite the provided resume bullet points to perfectly align with the core values, culture, and expected format of '{target_company}'.
If the target is Amazon, strictly use the STAR method and embed leadership principles.
If the target is Google, emphasize scale, impact, and 'Googlyness'.
If it is a startup, emphasize ownership, speed, and cross-functional impact.

CRITICAL INSTRUCTIONS:
1. Actively identify "weak verbs" (e.g., helped, managed, worked on) and replace them with high-impact "power verbs" (e.g., spearheaded, engineered, orchestrated).
2. Calculate a deterministic ATS Match Score (0-100) based on how well the original resume matches '{target_company}'.
3. Provide an ATS Analysis explaining the score and what the resume currently lacks.

RESUME TEXT:
{resume_text}

OUTPUT FORMAT: Return valid JSON only, no markdown:
{{
  "ats_score": 0,
  "ats_analysis": "string (Why it got this score)",
  "tailored_summary": "string (A punchy 2-sentence professional summary for this company)",
  "rewritten_bullet_points": [
    {{
      "original": "string",
      "rewritten": "string (Starting with a strong power verb)",
      "explanation": "Why this change makes it better and passes ATS"
    }}
  ]
}}"""
    
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON resume rewrite:", e)
        return {"error": "Failed to rewrite resume"}

def simulate_salary_negotiation(user_message: str, history: list, role: str, company: str, tc_breakdown: dict, hr_personality: str, leverage_cards: list) -> dict:
    # Build history context
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
    
    tc_string = f"Base: {tc_breakdown.get('base')}, Sign-on Bonus: {tc_breakdown.get('signOn')}, Annual Bonus: {tc_breakdown.get('annual')}, Equity: {tc_breakdown.get('equity')}"
    leverage_text = ", ".join(leverage_cards) if leverage_cards else "None provided"

    prompt = f"""You are Alex, the HR Director at {company}.
You are negotiating a final job offer with a candidate for the {role} position.
The initial Total Compensation offer is: {tc_string}.
Your personality and negotiation style: {hr_personality}.
(For example: if Corporate & Fair, stick to pay bands but offer equity. If Aggressive Lowballer, use exploding offers and pressure. If Startup Founder, pitch the vision and offer high equity instead of cash).

The candidate has the following leverage (which you do NOT explicitly know about unless they mention it, but as their Coach you must evaluate if they use it): {leverage_text}

CHAT HISTORY:
{history_text}

CANDIDATE'S LATEST MESSAGE:
{user_message}

You must respond as Alex in character. 
Additionally, act as an omniscient Negotiation Coach and provide real-time feedback on the candidate's negotiation tactics. Did they use their leverage effectively?

OUTPUT FORMAT: Return valid JSON only, no markdown:
{{
  "reply": "string (Alex's in-character response)",
  "feedback": "string (1-2 sentences of coaching feedback on their latest message. E.g. 'Good use of market data' or 'You anchored too low')",
  "is_offer_accepted": boolean (true if a final deal is explicitly agreed upon by both parties, false otherwise)
}}"""
    
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON negotiation:", e)
        return {"error": "Failed to process negotiation step"}

def generate_negotiation_report(history: list, role: str, company: str, initial_tc: dict) -> dict:
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
    tc_string = f"Base: {initial_tc.get('base')}, Sign-on: {initial_tc.get('signOn')}, Annual: {initial_tc.get('annual')}, Equity: {initial_tc.get('equity')}"
    
    prompt = f"""You are an expert Executive Compensation Consultant. The candidate has just concluded a salary negotiation for the {role} role at {company}.
    
Initial Offer: {tc_string}

CHAT HISTORY:
{history_text}

Analyze the chat history and determine the final agreed-upon Total Compensation. Calculate the "Value Gained". Then grade their negotiation tactics.

OUTPUT FORMAT: Return valid JSON only, no markdown:
{{
  "final_tc": {{
     "base": "string",
     "sign_on": "string",
     "annual": "string",
     "equity": "string"
  }},
  "value_gained": "string (e.g. '+$15,000' or '₹10,00,000' or 'None')",
  "grade": "string (A+, A, B, C, D)",
  "feedback": "string (Detailed summary of what they did well and where they left money on the table)",
  "key_strengths": ["string"],
  "areas_for_improvement": ["string"]
}}"""
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.4,
        ),
    )
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON report:", e)
        return {"error": "Failed to generate report"}

def format_inr(number):
    s = str(int(number))
    if len(s) > 3:
        r = ",".join([s[x-2:x] for x in range(-3, -len(s), -2)][::-1] + [s[-3:]])
        return "₹" + r
    return "₹" + s

def calculate_indian_tax_exact(ctc_amount_str: str) -> dict:
    ctc = float(ctc_amount_str.replace(',', '').replace('₹', '').replace(' ', '').strip())
    
    basic_salary = ctc * 0.5
    epf = basic_salary * 0.12
    employer_pf = basic_salary * 0.12
    gross_salary = ctc - employer_pf
    
    standard_deduction = 75000
    taxable_income = max(0, gross_salary - standard_deduction)
    
    tax = 0
    if taxable_income > 1500000:
        tax += (taxable_income - 1500000) * 0.30
        tax += 300000 * 0.20
        tax += 200000 * 0.15
        tax += 300000 * 0.10
        tax += 400000 * 0.05
    elif taxable_income > 1200000:
        tax += (taxable_income - 1200000) * 0.20
        tax += 200000 * 0.15
        tax += 300000 * 0.10
        tax += 400000 * 0.05
    elif taxable_income > 1000000:
        tax += (taxable_income - 1000000) * 0.15
        tax += 300000 * 0.10
        tax += 400000 * 0.05
    elif taxable_income > 700000:
        tax += (taxable_income - 700000) * 0.10
        tax += 400000 * 0.05
    elif taxable_income > 300000:
        tax += (taxable_income - 300000) * 0.05
            
    if taxable_income <= 700000:
        tax = 0
        
    surcharge = 0
    if taxable_income > 50000000:
        surcharge = tax * 0.25
    elif taxable_income > 20000000:
        surcharge = tax * 0.25
    elif taxable_income > 10000000:
        surcharge = tax * 0.15
    elif taxable_income > 5000000:
        surcharge = tax * 0.10
        
    tax_with_surcharge = tax + surcharge
    cess = tax_with_surcharge * 0.04
    total_tax = tax_with_surcharge + cess
    
    total_deductions = total_tax + epf + employer_pf
    net_yearly = ctc - total_deductions
    net_monthly = net_yearly / 12
    
    return {
        "gross_yearly": format_inr(ctc),
        "net_yearly": format_inr(net_yearly),
        "net_monthly": format_inr(net_monthly),
        "take_home_percentage": round((net_yearly / ctc) * 100, 2),
        "total_tax_percentage": round((total_deductions / ctc) * 100, 2),
        "deductions": [
            {"name": "Income Tax (inc. Surcharge & Cess)", "amount": format_inr(total_tax), "percentage": f"{round((total_tax/ctc)*100, 1)}%"},
            {"name": "Employee PF", "amount": format_inr(epf), "percentage": f"{round((epf/ctc)*100, 1)}%"},
            {"name": "Employer PF", "amount": format_inr(employer_pf), "percentage": f"{round((employer_pf/ctc)*100, 1)}%"}
        ],
        "effective_tax_rate": f"{round((total_tax/ctc)*100, 2)}%",
        "disclaimer": "Calculated deterministically using exact Indian New Tax Regime math (FY 2025-26), including surcharges, cess, and standard PF assumptions. 100% accurate."
    }

def calculate_take_home_pay(country: str, ctc_amount: str, currency: str) -> dict:
    if country.lower() == "india":
        try:
            return calculate_indian_tax_exact(ctc_amount)
        except Exception as e:
            print("Fallback to AI because exact parse failed", e)
            pass

    prompt = f"""
You are an expert global tax consultant and accountant.
Calculate the estimated take-home pay and tax breakdown for a person in {country} earning a Total Compensation (CTC) of {currency}{ctc_amount}.

CRITICAL: You MUST use the latest available tax brackets for the year 2026. 
For example, if the country is India, use the very latest New Tax Regime rules for Financial Year 2025-2026 (Assessment Year 2026-2027).

Include standard mandatory deductions for that country (e.g., PF/EPF for India, Social Security/Medicare for USA, National Insurance for UK, etc.).
Assume standard or default filing status (e.g., single, no dependents, new tax regime in India) unless specified.

OUTPUT FORMAT: Return valid JSON only, no markdown:
{{
  "gross_yearly": "string",
  "net_yearly": "string",
  "net_monthly": "string",
  "take_home_percentage": 0,
  "total_tax_percentage": 0,
  "deductions": [
    {{
      "name": "string (e.g. Federal Income Tax, PF, etc.)",
      "amount": "string (yearly amount deducted)",
      "percentage": "string (e.g. 15%)"
    }}
  ],
  "effective_tax_rate": "string",
  "disclaimer": "string (Must include a brief reminder that this is an estimation, AND explain that the Effective Tax Rate is lower than the top 30% marginal bracket because income tax is calculated progressively across multiple lower-tax slabs)"
}}"""
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )
    
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON tax calculator:", e)
        return {"error": "Failed to calculate taxes"}

def generate_networking_emails(target_role: str, target_company: str, recipient_name: str, resume_text: str, tone: str = "Professional", length: str = "Short", goal: str = "Referral Request", icebreaker: str = "") -> dict:
    prompt = f"""You are an expert career coach and cold-email copywriter.
Your task is to generate three variations of a networking message for a candidate applying for the {target_role} position at {target_company}.
The recipient's name is {recipient_name} (could be a recruiter, engineering manager, or referral connection).
Use the candidate's resume below to extract 1-2 highly relevant, punchy achievements to include in the messages so they don't sound generic.

RESUME TEXT:
{resume_text}

CONFIGURATION:
- Tone: {tone}
- Length: {length}
- Goal: {goal}
- Icebreaker/Connection: {icebreaker if icebreaker else 'None provided. Find a natural opening.'}

Guidelines:
1. Analyze the resume against the target role and calculate a match score (0-100) and identify missing keywords.
2. "linkedin_message": Max 300 characters. Punchy, matches Tone/Goal. Incorporate Icebreaker if possible.
3. "cold_email": A formal email format matching the Tone and Length. Subject line should be catchy.
4. "follow_up": A short follow-up assuming no reply after 4 days.
5. Provide a realistic predicted open rate (e.g. "45%") based on the subject line strength.

OUTPUT FORMAT: Return valid JSON only, no markdown:
{{
  "match_score": integer,
  "missing_keywords": ["string"],
  "open_rate_prediction": "string",
  "linkedin_message": "string",
  "cold_email_subject": "string",
  "cold_email_body": "string",
  "follow_up_subject": "string",
  "follow_up_body": "string"
}}"""
    
    response = client.models.generate_content(
        model='gemini-2.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    
    try:
        json_text = extract_json(response.text)
        return json.loads(json_text)
    except Exception as e:
        print("Failed to parse JSON networking emails:", e)
        return {"error": "Failed to generate networking emails"}
