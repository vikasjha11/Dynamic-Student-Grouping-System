from flask import Flask, request, jsonify
import pandas as pd
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Sorting Logic: Best in A, next best in B, and so on till the last section
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
    df['Normalized_LeetCode'] = 0 if max_leetcode == 0 else (df['LeetCode_Questions'] / max_leetcode) * 10
    
    # Calculate Final Score
    df['Final_Score'] = (4 * df['CGPA']) + (2 * df['Normalized_LeetCode'])

    # Round scores for consistency
    df['Normalized_LeetCode'] = df['Normalized_LeetCode'].round(3)
    df['Final_Score'] = df['Final_Score'].round(3)

    # Sort by Final Score (Highest to Lowest)
    df = df.sort_values(by='Final_Score', ascending=False).reset_index(drop=True)

    # Store previous section assignments
    df['Previous_Section'] = df['Section']

    # Assign sections from top to bottom
    section_labels = [chr(65 + i) for i in range(num_sections)]  
    num_students = len(df)
    students_per_section = num_students // num_sections
    remainder = num_students % num_sections  

    current_index = 0
    for i, section in enumerate(section_labels):
        count = students_per_section + (1 if i < remainder else 0)  
        df.loc[current_index: current_index + count - 1, 'Section'] = section
        current_index += count

    # Save updated CSV file inside the 'processed' folder
    processed_file_path = os.path.join(PROCESSED_FOLDER, "grouped_students.csv")
    df.to_csv(processed_file_path, index=False)

    return df[['Name', 'CGPA', 'LeetCode_Questions', 'Normalized_LeetCode', 'Final_Score', 'Previous_Section', 'Section', 'Email']]


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
