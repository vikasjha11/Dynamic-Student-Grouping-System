import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import '../styles/ResultPage.css';

export function ResultPage() {
  const location = useLocation();
  const { students: initialStudents, summary, isProcessing } = location.state || {};

  if (isProcessing) {
    return (
      <div className="loading-container">
        <h2>Processing Data... Please wait.</h2>
      </div>
    );
  }

  // Group students by section
  const groupBySection = (students) => {
    const groups = {};
    students.forEach((s, idx) => {
      if (!groups[s.Section]) groups[s.Section] = [];
      groups[s.Section].push({ ...s, _idx: idx });
    });
    return groups;
  };

  const [students, setStudents] = useState(
    (initialStudents || []).map(s => ({
      ...s,
      Original_Leetcode_Questions: s.Original_Leetcode_Questions ?? s.No_of_Leetcode_question
    }))
  );
  const [selected, setSelected] = useState({});
  const [sectionSelected, setSectionSelected] = useState({});
  const [verifyResults, setVerifyResults] = useState({});
  const [verifying, setVerifying] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recipientsList, setRecipientsList] = useState([]);
  const [emailMessage, setEmailMessage] = useState(
    `Dear [Recipient Name],

Greetings from the Dynamic Student Grouping System Team at Graphic Era Hill University.

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
`
  );

  const groupedStudents = groupBySection(students);

  // Toggle section expand/collapse
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Export as CSV
  const exportToCSV = () => {
    const rows = [
      [
        "Name", "CGPA", "LeetCode Questions", "Normalized LeetCode", "Final Score",
        "Previous Section", "Current Section", "Email"
      ],
      ...students.map(s => [
        s.Name, s.CGPA, s.LeetCode_Questions, s.Normalized_LeetCode, s.Final_Score,
        s.Previous_Section || 'N/A', s.Section, s.Email
      ])
    ];
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_result.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Section select/deselect all
  const handleSectionSelect = (section, checked) => {
    setSectionSelected({ ...sectionSelected, [section]: checked });
    const updates = { ...selected };
    groupedStudents[section].forEach((s) => {
      updates[s._idx] = checked;
    });
    setSelected(updates);
  };

  // Individual select
  const handleStudentSelect = (idx, checked) => {
    setSelected({ ...selected, [idx]: checked });
  };

  // Verify selected students
  const handleVerify = async () => {
    setVerifying(true);
    const selectedStudents = students.filter((_, idx) => selected[idx]);
    if (selectedStudents.length === 0) {
      setVerifying(false);
      alert("Please select at least one student to verify.");
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/verify', {
        students: selectedStudents
      });
      const resultMap = {};
      res.data.results.forEach(r => {
        resultMap[r.LeetCode_ID] = r;
      });
      // Update students in-place if count changed
      const updated = [...students];
      updated.forEach((s, idx) => {
        const verify = resultMap[s.LeetCode_ID];
        if (verify && verify.Actual_Leetcode_Questions !== undefined) {
          if (verify.Actual_Leetcode_Questions !== Number(s.No_of_Leetcode_question)) {
            updated[idx].No_of_Leetcode_question = verify.Actual_Leetcode_Questions;
            updated[idx].LeetCode_Questions = verify.Actual_Leetcode_Questions;
          }
        }
      });
      setStudents(updated);
      setVerifyResults(resultMap);
      setSelected({});
      setSectionSelected({});
    } catch (e) {
      alert('Verification failed.');
    }
    setVerifying(false);
  };

  // Reevaluate handler
  const handleReevaluate = () => {
    const updated = [...students];
    const maxLeetcode = Math.max(...updated.map(s => Number(s.LeetCode_Questions)));
    updated.forEach(s => {
      s.Normalized_LeetCode = maxLeetcode === 0 ? 0 : (Number(s.LeetCode_Questions) / maxLeetcode) * 10;
      s.Final_Score = (4 * Number(s.CGPA)) + (2 * Number(s.Normalized_LeetCode));
      s.Normalized_LeetCode = Number(s.Normalized_LeetCode.toFixed(3));
      s.Final_Score = Number(s.Final_Score.toFixed(3));
    });

    // Sort in descending order of Final_Score
    const sorted = [...updated].sort((a, b) => b.Final_Score - a.Final_Score);

    // Section allocation logic (block allocation)
    const numSections = [...new Set(students.map(s => s.Section))].length;
    const sectionLabels = Array.from({ length: numSections }, (_, i) =>
      String.fromCharCode(65 + i)
    );
    const numStudents = sorted.length;
    const studentsPerSection = Math.floor(numStudents / numSections);
    const remainder = numStudents % numSections;
    let currentIndex = 0;

    sectionLabels.forEach((section, i) => {
      const count = studentsPerSection + (i < remainder ? 1 : 0);
      for (let j = currentIndex; j < currentIndex + count; j++) {
        if (sorted[j]) {
          sorted[j].Previous_Section = sorted[j].Section;
          sorted[j].Section = section;
        }
      }
      currentIndex += count;
    });

    setStudents(sorted);
  };

  // Helper to get recipients summary
  const getRecipientsSummary = () => {
    const summary = [];
    Object.entries(groupedStudents).forEach(([section, studentList]) => {
      const allSelected = studentList.every(s => selected[s._idx]);
      if (allSelected && studentList.length > 0) {
        summary.push(`Section ${section}`);
      } else {
        studentList.forEach(s => {
          if (selected[s._idx]) summary.push(s.Email);
        });
      }
    });
    return summary;
  };

  // Update handleSend to show confirmation first
  const handleSend = async () => {
    const summary = getRecipientsSummary();
    if (summary.length === 0) {
      alert("Please select at least one student to send emails.");
      return;
    }
    setRecipientsList(summary);
    setShowConfirm(true);
  };

  // Actual send function
  const sendEmails = async () => {
    setShowConfirm(false);
    setSending(true);
    // Get selected students only
    const selectedStudents = students.filter((_, idx) => selected[idx]);
    try {
      await axios.post('http://localhost:5000/send-emails', {
        students: selectedStudents,
        message: emailMessage
      });
      alert('Emails sent successfully!');
      setSelected({});
      setSectionSelected({});
    } catch (e) {
      alert('Failed to send emails.');
    }
    setSending(false);
  };

  // Section summary for the summary table
  const sectionSummary = {};
  Object.entries(groupedStudents).forEach(([section, list]) => {
    sectionSummary[section] = list.length;
  });

  return (
    <div className="dashboard-container">
      <h1>Summary Report</h1>

      <div className="summary-details">
        <p><strong>Total Students:</strong> {students.length}</p>
      </div>

      <button className="export-button" onClick={exportToCSV}>
        Export as CSV
      </button>
      <button
        onClick={handleVerify}
        disabled={verifying}
        style={{ marginLeft: 20, background: verifying ? "#aaa" : "#1976d2", color: "#fff", borderRadius: 6, padding: "10px 20px" }}
      >
        {verifying ? "Verifying IDs..." : "Verify IDs"}
      </button>
      <button
        onClick={handleReevaluate}
        style={{ marginLeft: 20, background: "#1976d2", color: "#fff", borderRadius: 6, padding: "10px 20px" }}
      >
        Reevaluate
      </button>
      <button
        onClick={handleSend}
        disabled={sending}
        style={{ marginLeft: 20, background:"#1976D2", borderRadius: 6, padding: "10px 20px" }}
      >
        {sending ? "Sending..." : "Send Emails"}
      </button>

      {showConfirm && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Sending Emails</h3>
            <label style={{ fontWeight: "bold", marginBottom: 8, display: "block" }}>
              Email Message:
            </label>
            <textarea
              value={emailMessage}
              onChange={e => setEmailMessage(e.target.value)}
              rows={8}
              style={{ width: "100%", marginBottom: 16, resize: "vertical" }}
            />
            <p style={{ fontWeight: "bold", marginBottom: 4 }}>Recipients:</p>
            <div style={{
              maxHeight: 120,
              overflowY: "auto",
              background: "#f5f5f5",
              borderRadius: 4,
              padding: 8,
              marginBottom: 16
            }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {recipientsList.map((email, idx) => (
                  <li key={idx}>{email}</li>
                ))}
              </ul>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowConfirm(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={sendEmails} className="confirm-button">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="result-table" style={{marginTop: 20}}>
        <thead>
          <tr>
            <th>Section</th>
            <th>Number of Students</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(sectionSummary).map(([section, count]) => (
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
            style={{
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span>
              Section {section} {expandedSections[section] ? '▼' : '▶'}
            </span>
            <label
              onClick={e => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                fontWeight: "normal",
                cursor: "pointer",
                color: "white",
                whiteSpace: "nowrap" // Prevent wrapping
              }}
            >
              <input
                type="checkbox"
                checked={studentList.every(s => selected[s._idx])}
                onChange={e => handleSectionSelect(section, e.target.checked)}
                style={{ marginRight: 4 }}
              />
              Select All
            </label>
          </div>

          {expandedSections[section] && (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Name</th>
                  <th>CGPA</th>
                  <th>LeetCode Questions</th>
                  <th>LeetCode ID</th>
                  <th>Final Score</th>
                  <th>Previous Section</th>
                  <th>Current Section</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {studentList.map(student => {
                  const verify = verifyResults[student.LeetCode_ID];
                  let rowStyle = {};
                  if (verify) {
                    rowStyle = verify.Verified
                      ? { background: '#d4edda' }
                      : { background: '#ffcccc' };
                  }
                  // Show LeetCode_Questions before verification, updated value after verification if changed
                  const showQuestions =
                    verify && student.No_of_Leetcode_question !== student.Original_Leetcode_Questions
                      ? student.No_of_Leetcode_question
                      : student.LeetCode_Questions;

                  return (
                    <tr key={student._idx} style={rowStyle}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!selected[student._idx]}
                          onChange={e => handleStudentSelect(student._idx, e.target.checked)}
                        />
                      </td>
                      <td>{student.Name}</td>
                      <td>{student.CGPA}</td>
                      <td>{showQuestions}</td>
                      <td>{student.LeetCode_ID}</td>
                      <td>{student.Final_Score}</td>
                      <td>{student.Previous_Section || 'N/A'}</td>
                      <td>{student.Section}</td>
                      <td>{student.Email}</td>
                    </tr>
                  );
                })}
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