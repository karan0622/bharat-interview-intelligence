import io
from datetime import datetime
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, black, darkblue, grey
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER

def generate_certificate_pdf(user_name: str, role: str, score: float, date_str: str) -> bytes:
    """
    Generates a Certificate of Readiness PDF in-memory and returns its byte content.
    """
    buffer = io.BytesIO()
    
    # Create the PDF object, using a landscape layout
    c = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)
    
    # Background Color (Dark Slate)
    c.setFillColor(HexColor("#0f172a")) # Tailwind slate-950
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # Outer Border (Gold)
    c.setStrokeColor(HexColor("#eab308")) # Tailwind yellow-500
    c.setLineWidth(4)
    c.rect(40, 40, width - 80, height - 80)
    
    # Inner Border (Thin Gold)
    c.setLineWidth(1)
    c.rect(50, 50, width - 100, height - 100)
    
    # Title
    c.setFillColor(HexColor("#eab308"))
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(width / 2.0, height - 120, "CERTIFICATE OF READINESS")
    
    # Subtitle
    c.setFillColor(HexColor("#94a3b8")) # slate-400
    c.setFont("Helvetica", 18)
    c.drawCentredString(width / 2.0, height - 160, "This is to certify that")
    
    # Name
    c.setFillColor(HexColor("#ffffff"))
    c.setFont("Times-BoldItalic", 48)
    c.drawCentredString(width / 2.0, height - 230, user_name.upper())
    
    # Description
    c.setFillColor(HexColor("#94a3b8"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2.0, height - 280, f"has successfully completed the rigorous AI Interview Evaluation for the role of")
    
    c.setFillColor(HexColor("#eab308"))
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2.0, height - 310, role)
    
    c.setFillColor(HexColor("#94a3b8"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2.0, height - 340, "demonstrating strong competence and securing an overall readiness score of:")
    
    # Score
    c.setFillColor(HexColor("#eab308"))
    c.setFont("Helvetica-Bold", 48)
    c.drawCentredString(width / 2.0, height - 420, f"{round(score, 1)}%")
    
    # Signature & Date
    c.setFillColor(HexColor("#cbd5e1")) # slate-300
    c.setFont("Times-Italic", 14)
    
    # Evaluator
    c.drawString(100, 120, "Bharat Interview AI")
    c.setFillColor(HexColor("#64748b")) # slate-500
    c.setFont("Helvetica-Bold", 10)
    c.drawString(100, 105, "EVALUATOR")
    
    # Date
    c.setFillColor(HexColor("#cbd5e1"))
    c.setFont("Times-Italic", 14)
    c.drawRightString(width - 100, 120, date_str)
    c.setFillColor(HexColor("#64748b"))
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - 100, 105, "DATE")
    
    # Save the PDF
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer.read()

def generate_optimized_resume_pdf(summary: str, bullets: list, target: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=50, leftMargin=50,
                            topMargin=50, bottomMargin=50)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=darkblue,
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=black,
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=black,
        spaceAfter=10
    )
    
    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=black,
        spaceAfter=6
    )

    story = []
    
    # Title
    story.append(Paragraph("Optimized Professional Resume", title_style))
    story.append(Paragraph(f"<b>Target:</b> {target}", body_style))
    story.append(Spacer(1, 10))
    
    # Summary
    story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
    story.append(Paragraph(summary, body_style))
    story.append(Spacer(1, 10))
    
    # Experience / Bullets
    story.append(Paragraph("EXPERIENCE HIGHLIGHTS", heading_style))
    
    list_items = []
    for bullet in bullets:
        list_items.append(ListItem(Paragraph(bullet, bullet_style)))
    
    bullet_list = ListFlowable(
        list_items,
        bulletType='bullet',
        start='circle',
        leftIndent=15,
    )
    
    story.append(bullet_list)
    
    doc.build(story)
    buffer.seek(0)
    return buffer.read()
