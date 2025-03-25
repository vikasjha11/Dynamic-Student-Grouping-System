import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './styles/ResultPage.css';

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { summary, students, isProcessing } = location.state || {};

  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      if (window.confirm("Are you sure you want to exit?")) {
        navigate('/');
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [navigate]);

  if (isProcessing) {
    return (
      <div className="loading-container">
        <h2>Processing Data... Please wait.</h2>
      </div>
    );
  }

  if (!summary || !students) {
    return (
      <div className="error-container">
        <h2>No data available. Please upload a valid CSV file.</h2>
        <Link to="/" className="back-button">Go Back</Link>
      </div>
    );
  }

  const groupedStudents = students.reduce((acc, student) => {
    const section = student.Section;
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(student);
    return acc;
  }, {});

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const exportToCSV = () => {
    const csvData = [
      [
        'Name', 'CGPA', 'LeetCode Questions', 'Normalized LeetCode',
        'Final Score', 'Previous Section', 'Current Section', 'Email'
      ],
      ...students.map((student) => [
        student.Name,
        student.CGPA,
        student.LeetCode_Questions,
        student.Normalized_LeetCode,
        student.Final_Score,
        student.Previous_Section || 'N/A',
        student.Section,
        student.Email
      ])
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student_data.csv';
    link.click();
  };

  return (
    <div className="dashboard-container">
      <h1>Summary Report</h1>

      <div className="summary-details">
        <p><strong>Total Students:</strong> {summary.totalStudents}</p>
      </div>

      <button className="export-button" onClick={exportToCSV}>
        Export as CSV
      </button>

      <table className="result-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Number of Students</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(summary.sections).map(([section, count]) => (
            <tr key={section}>
              <td>{section}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Student Details</h2>
      {Object.entries(groupedStudents).map(([section, studentList]) => (
        <div key={section} className="section-container">
          <div
            className="section-header"
            onClick={() => toggleSection(section)}
          >
            Section {section} {expandedSections[section] ? '▼' : '▶'}
          </div>

          {expandedSections[section] && (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>CGPA</th>
                  <th>LeetCode Questions</th>
                  <th>Normalized LeetCode</th>
                  <th>Final Score</th>
                  <th>Previous Section</th>
                  <th>Current Section</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {studentList.map((student, index) => (
                  <tr key={index}>
                    <td>{student.Name}</td>
                    <td>{student.CGPA}</td>
                    <td>{student.LeetCode_Questions}</td>
                    <td>{student.Normalized_LeetCode}</td>
                    <td>{student.Final_Score}</td>
                    <td>{student.Previous_Section || 'N/A'}</td>
                    <td>{student.Section}</td>
                    <td>{student.Email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <Link to="/" className="back-button">Back to Home</Link>
    </div>
  );
}

export default ResultPage;