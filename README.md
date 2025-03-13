# **Dynamic Student Grouping System**

## 📌 Overview

The **Dynamic Student Grouping System** is a web application designed to efficiently form balanced student groups based on academic performance and other relevant factors. It helps streamline the process for academic projects, activities, or competitions by ensuring fair group distribution.

---

## 🚀 Features

✅ **CSV-Based Data Upload:** Easily upload student data via a CSV file.  
✅ **Performance-Based Grouping:** Ensures balanced teams with a mix of high, medium, and low performers.  
✅ **Interest-Based Grouping (Planned Enhancement):** Future update to include interest-based grouping.  
✅ **Automated Email Notifications:**  
- 📢 **First Upload:** Sends an email to **all students** about their assigned section.  
- 🔄 **Subsequent Uploads:** Notifies **only students whose section has changed**.  
✅ **Data Export:** Export grouped student data as a CSV file for records.  

---
## 🛠 Tech Stack

- **Frontend:** React.js (with modern UI/UX styling using CSS)  
- **Backend:** Flask (Python)  
- **Database:** SQL for efficient data storage and management  
- **Email System:** SMTP for automated notifications  


## 📖 Usage

1. **Upload CSV:** Admin uploads student data through the web interface.  
2. **Group Formation:** The system dynamically assigns students to balanced sections.  
3. **Email Notification:**  
   - First-time uploads notify **all students**.  
   - Subsequent uploads notify **only students whose section has changed**.  
4. **View & Export Results:** Grouped data is displayed in a tabular format with an **Export as CSV** option.  

---

## 📋 CSV Format

| Name        | CGPA | LeetCode_Questions | Email                   | Previous_Section |
|--------------|--------|----------------------------|-----------------------|------------------------|
| Student78     | 8.5     | 220                                    | student78@example.com  | A |

---

## 🚧 Future Enhancements
🚀 Interest-based grouping for personalized team formation.  
🚀 Enhanced admin dashboard for improved insights.  
🚀 Advanced email tracking system for improved delivery reliability.  

---

For any inquiries or feedback, feel free to reach out! 🚀
