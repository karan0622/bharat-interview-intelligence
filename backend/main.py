from fastapi import FastAPI, HTTPException, Depends, Form, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import uuid
import io
import pypdf
import base64
from datetime import datetime

from database import engine, SessionLocal, init_db, get_db
import models
from services.gemini_service import generate_interview_flow, evaluate_live_answer, evaluate_code_answer, evaluate_system_design_answer, generate_session_report, rewrite_resume_for_company
from services import pdf_service
import services.topic_service as topic_service
import bcrypt
import os
import resend
import stripe
from dotenv import load_dotenv
from fastapi import Request
from pydantic import BaseModel

load_dotenv()

class SignupRequest(BaseModel):
    name: str
    email: str
    contact_no: str
    password: str
    profile_icon: str

class LoginRequest(BaseModel):
    email: str
    password: str

app = FastAPI(title="Bharat Interview Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

class OTPRequest(BaseModel):
    contact_no: str

@app.post("/api/auth/send-otp")
def send_otp(req: OTPRequest):
    # In a real app, integrate with Twilio/SNS here
    print(f"Sending mock OTP 123456 to {req.contact_no}")
    return {"message": "OTP sent successfully", "mock_otp": "123456"}

@app.post("/api/auth/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = models.User(
        name=req.name, 
        email=req.email, 
        contact_no=req.contact_no, 
        password_hash=hashed, 
        profile_icon=req.profile_icon
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email, "profile_icon": user.profile_icon, "has_prepare_access": user.has_prepare_access}

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not bcrypt.checkpw(req.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"id": user.id, "name": user.name, "email": user.email, "profile_icon": user.profile_icon, "has_prepare_access": user.has_prepare_access}

@app.get("/api/user/{user_id}/history")
def get_user_history(user_id: int, db: Session = Depends(get_db)):
    sessions = db.query(models.InterviewSession).filter(models.InterviewSession.user_id == user_id, models.InterviewSession.status == "completed").order_by(models.InterviewSession.id.desc()).all()
    history = []
    for s in sessions:
        history.append({
            "session_id": s.id,
            "role": s.role,
            "field": s.field,
            "date": "Just now", # placeholder for real date formatting
            "overall_score": s.overall_score
        })
    return {"history": history}

@app.post("/api/session/start")
async def start_session(
    role: str = Form(...),
    field: str = Form(...),
    experience_level: str = Form(...),
    company_type: str = Form(...),
    interview_language: str = Form("English"),
    is_gauntlet: bool = Form(False),
    user_id: int = Form(None),
    resume: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    session_id = str(uuid.uuid4())
    
    resume_text = ""
    if resume and resume.filename.endswith('.pdf'):
        try:
            pdf_bytes = await resume.read()
            pdf_reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for page in pdf_reader.pages:
                resume_text += page.extract_text() + "\n"
        except Exception as e:
            print("Failed to parse PDF:", e)
    
    try:
        flow_data = generate_interview_flow(
            role=role, 
            field=field, 
            experience_level=experience_level, 
            company_type=company_type,
            interview_language=interview_language,
            is_gauntlet=is_gauntlet,
            resume_context=resume_text
        )
    except Exception as e:
        print("Gemini API Error:", e)
        raise HTTPException(status_code=429, detail="Failed to generate interview. You may have exceeded your Gemini API quota. Please wait a minute and try again.")
    
    questions = flow_data.get("questions", [])
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate interview questions. The AI may be overloaded or rejected the prompt. Please try again.")

    db_session = models.InterviewSession(
        id=session_id,
        user_id=user_id,
        role=role,
        field=field,
        experience_level=experience_level,
        company_type=company_type,
        interview_language=interview_language,
        tone_calibration=flow_data.get("tone_calibration", "standard")
    )
    db.add(db_session)
    db.flush()
    
    for q_data in questions:
        qa = models.QuestionAnswer(
            session_id=session_id,
            question_text=q_data.get("question", ""),
            question_type=q_data.get("type", "behavioral"),
            evaluation_criteria=q_data.get("evaluation_criteria", ""),
            round_number=q_data.get("round_number", 1),
            round_name=q_data.get("round_name", "General"),
            status="pending"
        )
        db.add(qa)
        
    db.commit()
    return {"session_id": session_id}

@app.get("/api/session/{session_id}/question")
def get_next_question(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    qa = db.query(models.QuestionAnswer).filter(
        models.QuestionAnswer.session_id == session_id,
        models.QuestionAnswer.status == "pending"
    ).order_by(models.QuestionAnswer.id).first()
    
    if not qa:
        return {"question_id": None, "message": "No more questions. Ready for report."}
    
    total_q = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.session_id == session_id).count()
    answered_q = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.session_id == session_id, models.QuestionAnswer.status == "answered").count()

    return {
        "question_id": qa.id, 
        "question_text": qa.question_text,
        "question_type": qa.question_type,
        "question_number": answered_q + 1,
        "total_questions": total_q,
        "round_number": qa.round_number or 1,
        "round_name": qa.round_name or "General",
        "interview_language": db_session.interview_language
    }

def background_eval_code(qa_id: int, question: str, evaluation_criteria: str, code_snippet: str):
    db = SessionLocal()
    try:
        qa = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.id == qa_id).first()
        if not qa: return
        evaluation = evaluate_code_answer(question, evaluation_criteria, code_snippet)
        qa.content_score = evaluation.get("content_score", 0.0)
        qa.communication_score = evaluation.get("communication_score", 0.0)
        qa.confidence_alignment = evaluation.get("confidence_alignment", "unknown")
        qa.feedback = evaluation.get("feedback", "")
        qa.missed_points = json.dumps(evaluation.get("missed_points", []))
        db.commit()
    finally:
        db.close()

def background_eval_speech(qa_id: int, question: str, question_type: str, evaluation_criteria: str, tone_calibration: str, transcript: str, filler_count: int, pace: float):
    db = SessionLocal()
    try:
        qa = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.id == qa_id).first()
        if not qa: return
        evaluation = evaluate_live_answer(question, question_type, evaluation_criteria, tone_calibration, transcript, filler_count, pace)
        qa.content_score = evaluation.get("content_score", 0.0)
        qa.communication_score = evaluation.get("communication_score", 0.0)
        qa.confidence_alignment = evaluation.get("confidence_alignment", "unknown")
        qa.feedback = evaluation.get("feedback", "")
        qa.missed_points = json.dumps(evaluation.get("missed_points", []))
        db.commit()
    finally:
        db.close()

def background_eval_system_design(qa_id: int, question: str, evaluation_criteria: str, image_base64: str):
    db = SessionLocal()
    try:
        eval_result = evaluate_system_design_answer(question, evaluation_criteria, image_base64)
        
        qa = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.id == qa_id).first()
        if qa:
            qa.content_score = eval_result.get("content_score", 0.0)
            qa.communication_score = eval_result.get("communication_score", 0.0)
            qa.confidence_alignment = eval_result.get("confidence_alignment", "")
            qa.feedback = eval_result.get("feedback", "")
            qa.missed_points = json.dumps(eval_result.get("missed_points", []))
            
        db.commit()
    finally:
        db.close()

@app.post("/api/session/{session_id}/answer")
def submit_answer(
    session_id: str,
    background_tasks: BackgroundTasks,
    question_id: int = Form(...),
    transcript: str = Form(None),
    pace: float = Form(None),
    filler_count: int = Form(None),
    code_snippet: str = Form(None),
    db: Session = Depends(get_db)
):
    db_session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    qa = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.id == question_id, models.QuestionAnswer.session_id == session_id).first()
    
    if not qa or not db_session:
        raise HTTPException(status_code=404, detail="Session or Question not found")
        
    if transcript:
        qa.answer_transcript = transcript
        qa.filler_count = filler_count
        qa.pace = pace
        if db_session:
            tone = db_session.tone_calibration or "Professional"
            background_tasks.add_task(background_eval_speech, qa.id, qa.question_text, qa.question_type, qa.evaluation_criteria, tone, transcript, filler_count or 0, pace or 0.0)
            
    elif qa.question_type == "coding":
        if not code_snippet:
            raise HTTPException(status_code=400, detail="No code provided")
        qa.code_snippet = code_snippet
        background_tasks.add_task(background_eval_code, qa.id, qa.question_text, qa.evaluation_criteria, code_snippet)
        
    elif qa.question_type == "system_design":
        if not code_snippet:
            raise HTTPException(status_code=400, detail="No diagram provided")
        qa.code_snippet = code_snippet # using code_snippet column to store base64 image
        background_tasks.add_task(background_eval_system_design, qa.id, qa.question_text, qa.evaluation_criteria, code_snippet)
        
    else:
        raise HTTPException(status_code=400, detail="No answer provided")
    
    qa.status = "answered"
    db.commit()
    
    next_qa = db.query(models.QuestionAnswer).filter(
        models.QuestionAnswer.session_id == session_id,
        models.QuestionAnswer.status == "pending"
    ).first()
    
    return {
        "has_more_questions": next_qa is not None,
        "evaluation": "queued"
    }

@app.post("/api/session/{session_id}/send-report")
def send_report_email(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not db_session or not db_session.user_id:
        raise HTTPException(status_code=404, detail="Session or User not found")
        
    user = db.query(models.User).filter(models.User.id == db_session.user_id).first()
    if not user or not user.email:
        raise HTTPException(status_code=404, detail="User email not found")

    api_key = os.environ.get("RESEND_API_KEY", "")
    
    score = db_session.overall_readiness_score or 0.0
    html_content = f"""
    <h2>Bharat Interview Intelligence</h2>
    <p>Hi {user.name},</p>
    <p>Your mock interview for <b>{db_session.role}</b> has concluded!</p>
    <h3>Your Overall Score: {round(score, 1)}%</h3>
    <p>Log in to your dashboard to view the full detailed breakdown of your technical and behavioral performance.</p>
    <br/>
    <p>Attached is your official <b>Certificate of Readiness</b> for this session.</p>
    <p>Keep preparing!<br/>The Bharat Interview Team</p>
    """
    
    # Generate the PDF
    date_str = datetime.now().strftime("%B %d, %Y")
    pdf_bytes = pdf_service.generate_certificate_pdf(
        user_name=user.name,
        role=db_session.role,
        score=score,
        date_str=date_str
    )
    
    # Convert to base64 for Resend
    pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    if api_key and api_key != "YOUR_API_KEY":
        resend.api_key = api_key
        try:
            r = resend.Emails.send({
                "from": "onboarding@resend.dev", # Required for unverified domains on free tier
                "to": user.email,
                "subject": f"Your Interview Report & Certificate: {db_session.role}",
                "html": html_content,
                "attachments": [
                    {
                        "filename": "Certificate_of_Readiness.pdf",
                        "content": pdf_b64
                    }
                ]
            })
            return {"message": "Email sent successfully with certificate attached!"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        print(f"--- MOCK EMAIL TO {user.email} ---")
        print(html_content)
        print("--- ATTACHED: Certificate_of_Readiness.pdf (Mocked) ---")
        print("-----------------------------------")
        return {"message": "Mock email sent (No RESEND_API_KEY configured)"}

@app.post("/api/session/{session_id}/skip")
def skip_question(
    session_id: str,
    question_id: int = Form(...),
    db: Session = Depends(get_db)
):
    db_session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    qa = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.id == question_id, models.QuestionAnswer.session_id == session_id).first()
    
    if not qa or not db_session:
        raise HTTPException(status_code=404, detail="Session or Question not found")
        
    qa.status = "answered"
    qa.answer_transcript = "[SKIPPED]"
    qa.content_score = 0.0
    qa.communication_score = 0.0
    qa.confidence_alignment = "skipped"
    qa.feedback = "The candidate opted to skip this question."
    db.commit()
    
    next_qa = db.query(models.QuestionAnswer).filter(
        models.QuestionAnswer.session_id == session_id,
        models.QuestionAnswer.status == "pending"
    ).first()
    
    return {
        "has_more_questions": next_qa is not None
    }

@app.get("/api/report/{session_id}")
def get_report(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    questions = db.query(models.QuestionAnswer).filter(
        models.QuestionAnswer.session_id == session_id,
        models.QuestionAnswer.status == "answered"
    ).order_by(models.QuestionAnswer.id).all()
    
    if db_session.overall_readiness_score is None:
        q_data = []
        for q in questions:
            q_data.append({
                "question": q.question_text,
                "answer_type": "Code" if q.question_type == "coding" else "Audio",
                "answer": q.code_snippet if q.question_type == "coding" else q.answer_transcript,
                "content_score": q.content_score,
                "communication_score": q.communication_score,
                "confidence_alignment": q.confidence_alignment
            })
            
        report = generate_session_report(
            role=db_session.role,
            field=db_session.field,
            company_type=db_session.company_type,
            questions_data=q_data
        )
        
        db_session.overall_readiness_score = report.get("overall_readiness_score", 0)
        db_session.strengths = json.dumps(report.get("strengths", []))
        db_session.areas_to_improve = json.dumps(report.get("areas_to_improve", []))
        db_session.confidence_pattern_note = report.get("confidence_pattern_note", "")
        db_session.next_steps = json.dumps(report.get("next_steps", []))
        db.commit()

    user = db.query(models.User).filter(models.User.id == db_session.user_id).first()
    user_name = user.name if user else "Candidate"
    user_email = user.email if user else ""

    return {
        "session_id": session_id,
        "user_name": user_name,
        "user_email": user_email,
        "role": db_session.role,
        "field": db_session.field,
        "overall_readiness_score": db_session.overall_readiness_score,
        "strengths": json.loads(db_session.strengths) if db_session.strengths else [],
        "areas_to_improve": json.loads(db_session.areas_to_improve) if db_session.areas_to_improve else [],
        "confidence_pattern_note": db_session.confidence_pattern_note,
        "next_steps": json.loads(db_session.next_steps) if db_session.next_steps else [],
        "details": [
            {
                "question": q.question_text,
                "question_type": q.question_type,
                "transcript": "[System Design Architecture Diagram]" if q.question_type == "system_design" else (q.code_snippet if q.question_type == "coding" else q.answer_transcript),
                "scores": {
                    "content": q.content_score,
                    "communication": q.communication_score,
                    "confidence_alignment": q.confidence_alignment
                },
                "feedback": q.feedback,
                "missed_points": json.loads(q.missed_points) if q.missed_points else [],
                "stats": {
                    "pace_wpm": q.pace,
                    "fillers": q.filler_count
                } if q.question_type != "coding" else {}
            } for q in questions
        ]
    }

# ==========================================
# STRIPE PAYMENTS ENDPOINTS
# ==========================================

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")
YOUR_DOMAIN = os.getenv("FRONTEND_URL", "http://localhost:5173")

@app.post("/api/create-checkout-session")
def create_checkout_session(user_id: int = Form(...), db: Session = Depends(get_db)):
    try:
        # If the user hasn't configured a real Stripe key yet, mock the successful payment flow
        if stripe.api_key == "sk_test_mock":
            # Auto-grant access in the database for the mock test
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user:
                user.has_prepare_access = True
                db.commit()
            return {"url": YOUR_DOMAIN + '?payment=success&mock=true'}

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card', 'upi'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {
                            'name': 'Interview Prepare Access',
                            'description': 'Lifetime access to AI-generated syllabus and practice tests.',
                        },
                        'unit_amount': 5000, # 50.00 INR to meet Stripe's $0.50 minimum
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=YOUR_DOMAIN + '?payment=success',
            cancel_url=YOUR_DOMAIN + '?payment=cancelled',
            client_reference_id=str(user_id),
        )
        return {"url": checkout_session.url}
    except Exception as e:
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    event = None

    try:
        if endpoint_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        else:
            # Fallback if webhook secret is not set (for testing only)
            event = json.loads(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        client_reference_id = session.get('client_reference_id')

        if client_reference_id:
            user = db.query(models.User).filter(models.User.id == int(client_reference_id)).first()
            if user:
                user.has_prepare_access = True
                db.commit()
                print(f"Granted prepare access to user {user.id}")

    return {"status": "success"}

# ==========================================
# NEW TOPICS / LMS API ENDPOINTS
# ==========================================

class TopicSyllabusRequest(BaseModel):
    role: str
    experience_level: str

@app.post("/api/topics/syllabus")
async def generate_syllabus(req: TopicSyllabusRequest):
    try:
        syllabus = topic_service.generate_syllabus(req.role, req.experience_level)
        return {"topics": syllabus}
    except Exception as e:
        print("Error generating syllabus:", e)
        raise HTTPException(status_code=500, detail="Failed to generate syllabus")

class TopicMaterialRequest(BaseModel):
    topic_title: str
    role: str

@app.post("/api/topics/material")
async def generate_material(req: TopicMaterialRequest):
    try:
        material = topic_service.generate_study_material(req.topic_title, req.role)
        return {"material_markdown": material}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate material")

class TopicPracticeRequest(BaseModel):
    topic_title: str
    role: str

@app.post("/api/topics/practice")
async def generate_practice(req: TopicPracticeRequest):
    try:
        questions = topic_service.generate_practice_test(req.topic_title, req.role)
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate practice test")

class TopicEvaluateRequest(BaseModel):
    topic_title: str
    q_and_a: list

@app.post("/api/topics/evaluate")
async def evaluate_topic(req: TopicEvaluateRequest):
    try:
        results = topic_service.evaluate_test_answers(req.topic_title, req.q_and_a)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to evaluate test answers")

# ==========================================
# SALARY NEGOTIATION ENDPOINTS
# ==========================================

from services.gemini_service import simulate_salary_negotiation

class NegotiationRequest(BaseModel):
    user_message: str
    history: list
    role: str
    company: str
    tc_breakdown: dict
    hr_personality: str
    leverage_cards: list

class NegotiationReportRequest(BaseModel):
    history: list
    role: str
    company: str
    initial_tc: dict

class TaxCalculatorRequest(BaseModel):
    country: str
    ctc_amount: str
    currency: str

@app.post("/api/salary/negotiate")
async def salary_negotiate(req: NegotiationRequest):
    try:
        from services.gemini_service import simulate_salary_negotiation
        result = simulate_salary_negotiation(
            user_message=req.user_message,
            history=req.history,
            role=req.role,
            company=req.company,
            tc_breakdown=req.tc_breakdown,
            hr_personality=req.hr_personality,
            leverage_cards=req.leverage_cards
        )
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        print("Salary Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/salary/report")
async def salary_report(req: NegotiationReportRequest):
    try:
        from services.gemini_service import generate_negotiation_report
        result = generate_negotiation_report(
            history=req.history,
            role=req.role,
            company=req.company,
            initial_tc=req.initial_tc
        )
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        print("Salary Report Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/salary/tax-calculator")
async def tax_calculator(req: TaxCalculatorRequest):
    try:
        from services.gemini_service import calculate_take_home_pay
        result = calculate_take_home_pay(
            country=req.country,
            ctc_amount=req.ctc_amount,
            currency=req.currency
        )
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        print("Tax Calculator Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# NETWORKING / COLD EMAIL ENDPOINTS
# ==========================================

from services.gemini_service import generate_networking_emails

@app.post("/api/networking/generate")
async def networking_generate(
    target_role: str = Form(...),
    target_company: str = Form(...),
    recipient_name: str = Form(...),
    resume_text: str = Form(""),
    resume_file: UploadFile = File(None),
    tone: str = Form("Professional"),
    length: str = Form("Short"),
    goal: str = Form("Referral Request"),
    icebreaker: str = Form("")
):
    try:
        final_resume_text = resume_text
        if resume_file and resume_file.filename.endswith('.pdf'):
            try:
                pdf_bytes = await resume_file.read()
                pdf_reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                extracted = ""
                for page in pdf_reader.pages:
                    extracted += page.extract_text() + "\n"
                final_resume_text += "\n" + extracted
            except Exception as e:
                print("Failed to parse PDF in networking:", e)

        result = generate_networking_emails(
            target_role=target_role,
            target_company=target_company,
            recipient_name=recipient_name,
            resume_text=final_resume_text,
            tone=tone,
            length=length,
            goal=goal,
            icebreaker=icebreaker
        )
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        print("Error generating networking emails:", e)
        raise HTTPException(status_code=500, detail="Failed to generate networking emails")

@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    # Group by user_id, pick the max score from completed sessions
    results = db.query(
        models.User.id.label('user_id'),
        models.User.name,
        models.User.profile_icon,
        func.max(models.InterviewSession.overall_readiness_score).label('score')
    ).join(
        models.InterviewSession, models.User.id == models.InterviewSession.user_id
    ).filter(
        models.InterviewSession.status == "completed",
        models.InterviewSession.overall_readiness_score != None
    ).group_by(
        models.User.id
    ).order_by(
        func.max(models.InterviewSession.overall_readiness_score).desc()
    ).limit(50).all()
    
    leaderboard = []
    for r in results:
        leaderboard.append({
            "user_id": r.user_id,
            "name": r.name or "Anonymous Player",
            "profile_icon": r.profile_icon or "👤",
            "score": round(r.score, 1)
        })
    return leaderboard

@app.post("/api/resume/parse")
async def parse_resume_pdf(resume: UploadFile = File(...)):
    if not resume.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        pdf_bytes = await resume.read()
        pdf_reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text() + "\n"
        return {"text": extracted_text}
    except Exception as e:
        print("Failed to parse PDF:", e)
        raise HTTPException(status_code=500, detail="Failed to parse PDF document.")

@app.post("/api/resume/rewrite")
def rewrite_resume_api(
    resume_text: str = Form(...),
    target_company: str = Form(...)
):
    if not resume_text or not target_company:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    result = rewrite_resume_for_company(resume_text, target_company)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

class ResumeExportRequest(BaseModel):
    summary: str
    bullets: list[str]
    target: str

@app.post("/api/resume/export-pdf")
def export_resume_pdf(req: ResumeExportRequest):
    try:
        pdf_bytes = pdf_service.generate_optimized_resume_pdf(req.summary, req.bullets, req.target)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Optimized_Resume.pdf"}
        )
    except Exception as e:
        print("Failed to generate PDF:", e)
        raise HTTPException(status_code=500, detail="Failed to generate PDF")
