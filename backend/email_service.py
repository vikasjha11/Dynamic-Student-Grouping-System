import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import SMTP_SERVER, SMTP_PORT, EMAIL_SENDER, EMAIL_PASSWORD
def send_notification(email, name, previous_section, current_section):
    subject = "Student Section Update Notification"
    message_body = f"""
    Dear {name},

    Your section has been updated.
    - Previous Section: {previous_section or 'N/A'}
    - New Section: {current_section}

    Please reach out if you have any questions.

    Best Regards,  
    Dynamic Student Grouping System Team
    """

    msg = Message(subject, recipients=[email])
    msg.body = message_body

    try:
        mail.send(msg)
        print(f"Email sent to {email}")
    except Exception as e:
        print(f"Failed to send email to {email}: {str(e)}")
