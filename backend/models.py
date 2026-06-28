from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    contact_no = Column(String)
    password_hash = Column(String)
    profile_icon = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    has_prepare_access = Column(Boolean, default=False)
    
    sessions = relationship("InterviewSession", back_populates="user")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String, index=True)
    field = Column(String)
    experience_level = Column(String)
    company_type = Column(String)
    interview_language = Column(String, default="English")
    status = Column(String, default="active") # active, completed
    
    tone_calibration = Column(Text, nullable=True)
    
    overall_readiness_score = Column(Float, nullable=True)
    strengths = Column(Text, nullable=True) 
    areas_to_improve = Column(Text, nullable=True) 
    confidence_pattern_note = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True) 
    
    user = relationship("User", back_populates="sessions")
    questions = relationship("QuestionAnswer", back_populates="session", order_by="QuestionAnswer.id")

class QuestionAnswer(Base):
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"))
    status = Column(String, default="pending") # pending, answered
    
    question_text = Column(Text)
    question_type = Column(String)
    evaluation_criteria = Column(Text)
    
    round_number = Column(Integer, nullable=True, default=1)
    round_name = Column(String, nullable=True, default="General")
    
    # Audio/Speech Answers
    answer_transcript = Column(Text, nullable=True)
    filler_count = Column(Integer, nullable=True)
    pace = Column(Float, nullable=True)
    
    # Code Answers
    code_snippet = Column(Text, nullable=True)
    
    # Evaluation Scores
    content_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    confidence_alignment = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    missed_points = Column(Text, nullable=True) 
    
    session = relationship("InterviewSession", back_populates="questions")
