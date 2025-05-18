from flask_mail import Message

def send_notification(
    email, name, previous_section, current_section, mail,
    custom_message=None, cgpa=None, leetcode_questions=None, leetcode_id=None, final_score=None
):
    subject = "Section Update Notification – Dynamic Student Grouping System Trial"
    if custom_message:
        message_body = (
            custom_message.replace("[Recipient Name]", name or "")
            .replace("{previous_section}", previous_section if previous_section else "N/A")
            .replace("{current_section}", current_section if current_section else "N/A")
            .replace("{cgpa}", str(cgpa) if cgpa is not None else "N/A")
            .replace("{leetcode_questions}", str(leetcode_questions) if leetcode_questions is not None else "N/A")
            .replace("{leetcode_id}", leetcode_id or "N/A")
            .replace("{final_score}", str(final_score) if final_score is not None else "N/A")
        )
    else:
        message_body = f"""Greetings from the Dynamic Student Grouping System Team at Graphic Era Hill University,

We hope this message finds you well. As part of our academic initiative to optimize student group allocation, we are conducting a test run of our system. We’re pleased to inform you that your section details have been successfully updated.

Here are your updated and analyzed details:

CGPA: {cgpa}
LeetCode Questions Solved: {leetcode_questions}
LeetCode ID: {leetcode_id}
Final Score: {final_score}
Previous Section: {previous_section}
New Section: {current_section}

This update is part of our ongoing system trial to evaluate its effectiveness and accuracy. If you have any questions, concerns, or feedback, please don’t hesitate to reach out. Your input is valuable to us as we work towards a seamless and efficient student grouping process.

Warm regards,
Team – Dynamic Student Grouping System
"""

    msg = Message(subject, recipients=[email])
    msg.body = message_body

    try:
        mail.send(msg)
        print(f"✅ Email sent to {email}")
    except Exception as e:
        print(f"❌ Failed to send email to {email}: {str(e)}")
