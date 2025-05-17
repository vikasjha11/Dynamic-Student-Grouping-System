import { useState } from 'react';
import {useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from "../assets/logo.jpg"

export function HomePage() {
  const [sections, setSections] = useState('');
  // const [maxStudents, setMaxStudents] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a valid CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sections', sections);
    // formData.append('maxStudents', maxStudents);

    setIsProcessing(true);

    navigate('/result', {
      state: { isProcessing: true }
    });

    try {
      const response = await axios.post('http://localhost:5000/upload', formData);
      const students = response.data.data || [];
      const totalStudents = students.length;

      const sectionsCount = students.reduce((acc, student) => {
        acc[student.Section] = (acc[student.Section] || 0) + 1;
        return acc;
      }, {});

      navigate('/result', {
        state: {
          summary: {
            totalStudents,
            sections: sectionsCount
          },
          students,
          isProcessing: false
        }
      });

    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert('Error processing the data. Please check file format and try again.');
      navigate('/'); 
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <div className="logo">
        <img src={logo} alt="Logo" />
      </div>

      <h1>Dynamic Student Grouping System</h1>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>No. Of Sections:</label>
          <input
            type="number"
            min="1"
            value={sections}
            onChange={(e) => setSections(e.target.value)}
          />
        </div>

        {/* <div className="input-group">
          <label>Max Number of Students:</label>
          <input
            type="number"
            value={maxStudents}
            onChange={(e) => setMaxStudents(e.target.value)}
          />
        </div> */}

        <div className="input-group">
          <label>Upload Students Data:</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const selectedFile = e.target.files[0];
              if (selectedFile && selectedFile.type === 'text/csv') {
                setFile(selectedFile);
              } else {
                alert('Please upload a valid CSV file.');
                setFile(null);
              }
            }}
          />
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
