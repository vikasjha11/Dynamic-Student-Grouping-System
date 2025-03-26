from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

#Sorting Logic

def process_student_data(csv_file, num_sections):
   
    df = pd.read_csv(csv_file)  # Load CSV  

    df.columns = df.columns.str.strip().str.replace(" ", "_")  # Strip spaces and standardize column names
    
    # Ensure required columns exist
    required_columns = {'Name', 'CGPA', 'LeetCode_Questions', 'Email'}
    if not required_columns.issubset(df.columns):
        raise ValueError(f"CSV file must contain columns: {required_columns}, but found {df.columns}")
    
    # Add placeholder for missing 'Section' column
    if 'Section' not in df.columns:
        df['Section'] = None

    # Normalize LeetCode questions
    max_leetcode = df['LeetCode_Questions'].max()
    if max_leetcode == 0:
        df['Normalized_LeetCode'] = 0
    else:
        df['Normalized_LeetCode'] = (df['LeetCode_Questions'] / max_leetcode) * 10
    
    # Calculate Final Score
    df['Final_Score'] = (4 * df['CGPA']) + (2 * df['Normalized_LeetCode'])

    # Round scores for consistency
    df['Normalized_LeetCode'] = df['Normalized_LeetCode'].round(3)
    df['Final_Score'] = df['Final_Score'].round(3)

    # Sort by Final Score
    df = df.sort_values(by='Final_Score', ascending=False).reset_index(drop=True)

    # Store previous section assignments
    df['Previous_Section'] = df['Section']

    # Improved Section Allotment Logic (Balanced Round Robin)
    num_students = len(df)
    top_students = df.iloc[:num_students // 3]      # Top 33% (Good)
    mid_students = df.iloc[num_students // 3: 2 * num_students // 3]  # Middle 33% (Medium)
    low_students = df.iloc[2 * num_students // 3:]  # Bottom 33% (Weak)

    # Assign sections in a balanced way
    section_labels = [chr(65 + i) for i in range(num_sections)]
    sections = {label: [] for label in section_labels}

    for group in [top_students, mid_students, low_students]:
        for i, (_, student) in enumerate(group.iterrows()):
            section = section_labels[i % num_sections]
            sections[section].append(student)

    # Convert to DataFrame
    final_students = []
    for section, students in sections.items():
        for student in students:
            student_data = student.to_dict()
            student_data["Section"] = section
            final_students.append(student_data)

    final_df = pd.DataFrame(final_students)

    # Save updated CSV file
    final_df.to_csv("grouped_students.csv", index=False)

    return final_df[['Name', 'CGPA', 'LeetCode_Questions', 'Normalized_LeetCode', 'Final_Score', 'Previous_Section', 'Section', 'Email']]


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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
