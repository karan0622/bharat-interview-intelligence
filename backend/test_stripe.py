import os
from dotenv import load_dotenv
import stripe

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

try:
    checkout_session = stripe.checkout.Session.create(
        line_items=[
            {
                'price_data': {
                    'currency': 'inr',
                    'product_data': {
                        'name': 'Interview Prepare Access',
                        'description': 'Lifetime access to AI-generated syllabus and practice tests.',
                    },
                    'unit_amount': 1000, # 10.00 INR (amount is in paise)
                },
                'quantity': 1,
            },
        ],
        mode='payment',
        success_url='http://localhost:5173?payment=success',
        cancel_url='http://localhost:5173?payment=cancelled',
        client_reference_id='1',
    )
    print("Success:", checkout_session.url)
except Exception as e:
    print("Error:", str(e))
