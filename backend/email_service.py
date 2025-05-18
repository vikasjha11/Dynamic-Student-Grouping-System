from flask_mail import Message

def send_notification(email, name, previous_section, current_section, mail, custom_message=None):
    subject = "Student Grouping Update – Project Trial Notification"
    if custom_message:
        # Replace placeholders with actual values
        message_body = custom_message.replace(
            "[Recipient Name]", name or ""
        ).replace(
            "{previous_section or 'N/A'}", previous_section if previous_section else "N/A"
        ).replace(
            "{current_section}", current_section or ""
        )
    else:
        message_body = f"""Dear {name},

Greetings from the Dynamic Student Grouping System Team at Graphic Era Hill University.

We are currently conducting a project trial as part of our academic initiative to streamline student allocation. Your section information has been updated in our system:

Previous Section: {previous_section or 'N/A'}
New Section: {current_section}

This message is part of a test run of our grouping system. Please feel free to reach out if you have any questions or concerns regarding this update.

Warm Regards,
Dynamic Student Grouping System Team
Graphic Era Hill University
"""

    msg = Message(subject, recipients=[email])
    msg.body = message_body

    try:
        mail.send(msg)
        print(f"✅ Email sent to {email}")
    except Exception as e:
        print(f"❌ Failed to send email to {email}: {str(e)}")
