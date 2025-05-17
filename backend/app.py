from flask import Flask, request, jsonify
import pandas as pd
import os
from flask_cors import CORS
from flask_mail import Mail
from email_service import send_notification
from config import SMTP_SERVER, SMTP_PORT, EMAIL_SENDER, EMAIL_PASSWORD
import requests
import json
import concurrent.futures
import time

app = Flask(__name__)
CORS(app)

# Mail Configuration
app.config['MAIL_SERVER'] = SMTP_SERVER
app.config['MAIL_PORT'] = SMTP_PORT
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = EMAIL_SENDER
app.config['MAIL_PASSWORD'] = EMAIL_PASSWORD
app.config['MAIL_DEFAULT_SENDER'] = EMAIL_SENDER  # ✅ fix for default sender

mail = Mail(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

def get_leetcode_questions(leetcode_id, retries=3, delay=2):
    for attempt in range(retries):
        try:
            headers = {
                'Content-Type': 'application/json',
                'Referer': f'https://leetcode.com/{leetcode_id}/',
                'User-Agent': 'Mozilla/5.0'
            }
            url = 'https://leetcode.com/graphql'
            query = {
                "query": """
                query getUserProfile($username: String!) {
                    matchedUser(username: $username) {
                        submitStats {
                            acSubmissionNum {
                                difficulty
                                count
                            }
                        }
                    }
                }
                """,
                "variables": {
                    "username": leetcode_id
                }
            }

            response = requests.post(url, headers=headers, json=query, timeout=10)
            response.raise_for_status()
            data = response.json()

            if 'data' in data and data['data']['matchedUser']:
                ac_data = data['data']['matchedUser']['submitStats']['acSubmissionNum']
                total_solved = sum(d['count'] for d in ac_data if d['difficulty'] != 'All')
                print(f"[OK] {leetcode_id}: {total_solved}")
                return total_solved

            print(f"[Invalid] {leetcode_id} not found")
            return 0
        except Exception as e:
            print(f"[Attempt {attempt+1}] Error fetching LeetCode data for {leetcode_id}: {e}")
            time.sleep(delay)
    return 0

def process_student_data(csv_file, num_sections):
    df = pd.read_csv(csv_file)
    df.columns = df.columns.str.strip().str.replace(" ", "_")

    required_columns = {'Name', 'CGPA', 'LeetCode_ID', 'Email'}
    if not required_columns.issubset(df.columns):
        raise ValueError(f"CSV file must contain columns: {required_columns}, but found {df.columns}")

    if 'Section' not in df.columns:
        df['Section'] = None

    df['LeetCode_Username'] = df['LeetCode_ID'].apply(lambda x: x.strip().rstrip('/').split('/')[-1])

    print("Fetching LeetCode data for students in parallel...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        leetcode_counts = list(executor.map(get_leetcode_questions, df['LeetCode_Username']))

    df['LeetCode_Questions'] = leetcode_counts
    max_leetcode = df['LeetCode_Questions'].max()
    df['Normalized_LeetCode'] = 0 if max_leetcode == 0 else (df['LeetCode_Questions'] / max_leetcode) * 10
    df['Final_Score'] = (4 * df['CGPA']) + (2 * df['Normalized_LeetCode'])

    df['Normalized_LeetCode'] = df['Normalized_LeetCode'].round(3)
    df['Final_Score'] = df['Final_Score'].round(3)
    df = df.sort_values(by='Final_Score', ascending=False).reset_index(drop=True)

    df['Previous_Section'] = df['Section']
    section_labels = [chr(65 + i) for i in range(num_sections)]
    num_students = len(df)
    students_per_section = num_students // num_sections
    remainder = num_students % num_sections
    current_index = 0

    for i, section in enumerate(section_labels):
        count = students_per_section + (1 if i < remainder else 0)
        df.loc[current_index: current_index + count - 1, 'Section'] = section
        current_index += count

    for _, row in df.iterrows():
        if row['Previous_Section'] != row['Section']:
            try:
                send_notification(
                    email=row['Email'],
                    name=row['Name'],
                    previous_section=row['Previous_Section'],
                    current_section=row['Section'],
                    mail=mail  # ✅ pass mail instance
                )
            except Exception as e:
                print(f"Failed to send email to {row['Email']}: {str(e)}")

    processed_file_path = os.path.join(PROCESSED_FOLDER, "grouped_students.csv")
    df.to_csv(processed_file_path, index=False)

    return df[['Name', 'CGPA', 'LeetCode_ID', 'LeetCode_Questions', 'Normalized_LeetCode',
               'Final_Score', 'Previous_Section', 'Section', 'Email']]

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, 'data_file.csv')
    file.save(file_path)

    num_sections = int(request.form.get('sections', 0))

    try:
        grouped_students = process_student_data(file_path, num_sections)
        return jsonify({'data': grouped_students.to_dict(orient='records')})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/test-email', methods=['GET'])
def test_email():
    try:
        send_notification(
            email=EMAIL_SENDER,
            name="Test User",
            previous_section="A",
            current_section="B",
            mail=mail  # ✅ pass mail instance
        )
        return jsonify({'message': 'Test email sent successfully! Please check your inbox.'})
    except Exception as e:
        return jsonify({'error': f'Failed to send test email: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
