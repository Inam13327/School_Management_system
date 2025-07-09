import React, { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate, useParams } from 'react-router-dom';

const reportCardStyle = {
  fontFamily: 'serif',
  background: 'linear-gradient(to right, #dbeafe 30%, #fff 100%)',
  minHeight: '100vh',
  padding: 0,
  margin: 0,
};
const a4BoxStyle = {
  width: 420,
  height: 595,
  background: '#fff',
  margin: '20px auto',
  boxShadow: 'none',
  border: '1.5px solid #2563eb',
  borderRadius: 6,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minHeight: 595,
  padding: 0
};
const mainPanelStyle = {
  flex: 1,
  padding: '0 12px 0 12px',
  width: '100%'
};
const tableHeaderStyle = {
  background: '#f3f4f6',
  color: '#374151',
  fontWeight: 'bold',
};
const tableCellStyle = {
  border: '1px solid #2563eb',
  padding: 6,
  fontSize: 15,
};
const sectionTitleStyle = {
  fontWeight: 'bold',
  marginTop: 24,
  marginBottom: 8,
  fontSize: 18,
  color: '#2563eb',
};
const gradingBoxStyle = {
  background: '#2563eb',
  color: '#fff',
  padding: '6px 18px',
  borderRadius: 4,
  fontWeight: 'bold',
  display: 'inline-block',
  marginTop: 8,
};
const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: 794,
  margin: '0 auto',
  padding: '24px 0 0 0',
};
const buttonStyle = {
  background: '#1e3a8a',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '10px 22px',
  fontWeight: 'bold',
  fontSize: 17,
  cursor: 'pointer',
  marginRight: 12,
  boxShadow: 'none',
  letterSpacing: 1,
  transition: 'background 0.2s',
};

function getGrade(marks) {
  if (marks >= 90) return 'A';
  if (marks >= 80) return 'B';
  if (marks >= 70) return 'C';
  if (marks >= 60) return 'D';
  return 'F';
}

const ReportCardPage = () => {
  const cardRef = useRef();
  const navigate = useNavigate();
  const { studentId, classId } = useParams();
  const [subjects, setSubjects] = useState([]); // [{name, teacher, ...}]
  const [marks, setMarks] = useState([]); // [{subject, marks, ...}]
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, percent: 0 });

  useEffect(() => {
    if (!studentId || !classId) return;
    const fetchData = async () => {
      setLoading(true);
      // Fetch student details
      const studentRes = await fetch(`http://localhost:8000/api/students/${studentId}/`);
      if (studentRes.ok) {
        setStudent(await studentRes.json());
      }
      // Fetch subjects for class
      const subRes = await fetch(`http://localhost:8000/api/subjects/?class_fk=${classId}`);
      let subjectList = [];
      if (subRes.ok) {
        subjectList = await subRes.json();
      }
      setSubjects(subjectList);
      // Fetch marks for student in this class
      const marksRes = await fetch(`http://localhost:8000/api/marks/?class_fk=${classId}&student=${studentId}`);
      let marksList = [];
      if (marksRes.ok) {
        marksList = await marksRes.json();
      }
      setMarks(marksList);
      // Fetch attendance for student in this class
      const attRes = await fetch(`http://localhost:8000/api/attendances/?student=${studentId}&student__class_fk=${classId}`);
      let attList = [];
      if (attRes.ok) {
        attList = await attRes.json();
      }
      const present = attList.filter(a => a.present).length;
      const total = attList.length;
      const percent = total > 0 ? Math.round((present / total) * 100) : 0;
      setAttendanceStats({ present, total, percent });
      setLoading(false);
    };
    fetchData();
  }, [studentId, classId]);

  // Map subject id to marks
  const marksMap = {};
  marks.forEach(m => {
    marksMap[m.subject?.id || m.subject_id] = m;
  });

  // Calculate total obtained and total marks for final grade
  const totalMarks = subjects.reduce((sum, subj) => sum + (subj.total_marks || 100), 0);
  const obtainedMarks = subjects.reduce((sum, subj) => {
    const markObj = marksMap[subj.id];
    // Use pending marks if available, otherwise use current marks
    const marksVal = markObj ? Number(markObj.marks) : 0;
    return sum + (isNaN(marksVal) ? 0 : marksVal);
  }, 0);
  let finalGrade = '-';
  if (totalMarks > 0) {
    const percent = (obtainedMarks / totalMarks) * 100;
    if (percent >= 90) finalGrade = 'A';
    else if (percent >= 80) finalGrade = 'B';
    else if (percent >= 70) finalGrade = 'C';
    else if (percent >= 60) finalGrade = 'D';
    else finalGrade = 'F';
  }

  return (
    <div style={reportCardStyle}>
      <div style={topBarStyle}>
        <button className="button-secondary" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none' }}>Back</button>
        <button className="button-primary" onClick={async () => {
          if (!cardRef.current) return;
          const canvas = await html2canvas(cardRef.current, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [794, 1123] });
          pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123);
          pdf.save('report_card.pdf');
        }} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none' }}>Download PDF</button>
      </div>
      <div style={{
        ...a4BoxStyle,
        boxShadow: 'none',
        border: '1.5px solid #2563eb',
        borderRadius: 6,
        background: '#fff',
        minHeight: 1123,
        width: 794,
        margin: '20px auto',
        padding: 0
      }} ref={cardRef}>
        <div className="panel" style={{ ...mainPanelStyle, padding: '0 18px 0 18px', width: '100%' }}>
          {/* Header: Logo and HORIZON side by side */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 8,
            paddingTop: 32
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              marginBottom: 0,
              gap: 18
            }}>
              <img
                src="/image.png"
                alt="Horizon Logo"
                style={{
                  width: 100,
                  height:100,
                  marginRight: 1,
                  marginBottom: -15,
                  objectFit: 'contain',
                  background: 'transparent',
                  display: 'block',
                  verticalAlign: 'bottom',
                  transform: 'rotate(-90deg)'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-start', height: 80 }}>
                <div style={{
                  fontSize: '2.5em',
                  fontWeight: 700,
                  fontFamily: 'serif',
                  letterSpacing: '2px',
                  color: '#222',
                  lineHeight: 1.1,
                  marginBottom: 0
                }}>
                  HORIZON
                </div>
                <div style={{
                  width: '100%',
                  borderBottom: '2.5px solid #2563eb',
                  marginTop: 2,
                  marginBottom: 0
                }}></div>
          </div>
        </div>
            <div style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.05em',
              margin: '10px 0 2px 0',
              letterSpacing: 2,
              color: '#222',
              fontFamily: 'serif',
              textTransform: 'uppercase'
            }}>
              HIGH SCHOOL OF EDUCATION
            </div>
            <div style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1em',
              margin: '0 0 2px 0',
              letterSpacing: 2,
              color: '#b45c3d',
              fontFamily: 'serif',
              textTransform: 'uppercase'
            }}>
              DHAMTOUR
            </div>
            <div style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.05em',
              margin: '0 0 10px 0',
              letterSpacing: 2,
              color: '#222',
              fontFamily: 'serif',
              textTransform: 'uppercase',
              textDecoration: 'underline'
            }}>
              MIDTERM PROGRESS REPORT
          </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontWeight: 'bold', fontSize: 13, marginTop: 8 }}>
            <div style={{ paddingLeft: 32 }}>Class: {classId || '_____'}</div>
            <div style={{ paddingRight: 32 }}>Name: {student ? student.name : '_____'} </div>
          </div>
          {/* Subject Table: fixed 10 rows for consistent look */}
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 18px 0', fontSize: 12, border: '1px solid #2563eb' }}>
            <thead>
              <tr>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, textAlign: 'left', width: '40%', padding: '4px 6px' }}>Subject Name</th>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, width: '20%', padding: '4px 6px' }}>Total Marks</th>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, width: '20%', padding: '4px 6px' }}>Obtained Marks</th>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, width: '20%', padding: '4px 6px' }}>Percentage(%)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={tableCellStyle}>Loading...</td></tr>
              ) : (
                <>
                  {subjects.map((subj, idx) => {
                    const markObj = marksMap[subj.id];
                    const marksVal = markObj ? Number(markObj.marks) : null;
                    const totalMarks = subj.total_marks || 100;
                    const percent = marksVal !== null ? ((marksVal / totalMarks) * 100).toFixed(2) : '';
                    return (
                      <tr key={subj.id}>
                        <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{subj.name}</td>
                        <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{totalMarks}</td>
                        <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{marksVal !== null ? marksVal : ''}</td>
                        <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{marksVal !== null ? percent + '%' : ''}</td>
                      </tr>
                    );
                  })}
                  {/* Add empty rows for consistent look (always 10 rows) */}
                  {Array.from({ length: Math.max(0, 10 - subjects.length) }).map((_, idx) => (
                    <tr key={'empty' + idx}>
                      <td style={{ ...tableCellStyle, padding: '4px 6px' }}>&nbsp;</td>
                      <td style={{ ...tableCellStyle, padding: '4px 6px' }}></td>
                      <td style={{ ...tableCellStyle, padding: '4px 6px' }}></td>
                      <td style={{ ...tableCellStyle, padding: '4px 6px' }}></td>
                    </tr>
                  ))}
                  {/* Total Marks Row */}
                  <tr>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', padding: '4px 6px' }}>Total Marks</td>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', padding: '4px 6px' }}>{totalMarks}</td>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', padding: '4px 6px' }}>{obtainedMarks}</td>
                    <td style={{ ...tableCellStyle, padding: '4px 6px' }}></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {/* Summary Table: Total Marks, Obt Marks, %tage, Grade, Position */}
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 18px 0', fontSize: 12, border: '1px solid #2563eb' }}>
            <thead>
              <tr>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, padding: '4px 6px' }}>Total Marks</th>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, padding: '4px 6px' }}>Obt Marks</th>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, padding: '4px 6px' }}>%tage</th>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, padding: '4px 6px' }}>Grade</th>
                <th style={{ ...tableCellStyle, ...tableHeaderStyle, padding: '4px 6px' }}>Position</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{totalMarks}</td>
                <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{obtainedMarks}</td>
                <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) + '%' : ''}</td>
                <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{finalGrade}</td>
                <td style={{ ...tableCellStyle, padding: '4px 6px' }}></td>
              </tr>
            </tbody>
          </table>

          {/* Behaviour Table and Grading Legend */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 0, alignItems: 'flex-start', marginTop: 0, marginBottom: 18 }}>
            {/* Behaviour Table */}
            <div style={{ flex: 2 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, border: '1px solid #2563eb' }}>
                <thead>
                  <tr>
                    <th style={{ ...tableCellStyle, ...tableHeaderStyle, width: '40%', padding: '4px 6px' }}>Student Behaviour</th>
                    <th style={{ ...tableCellStyle, width: '20%', padding: '4px 6px' }}>A</th>
                    <th style={{ ...tableCellStyle, width: '20%', padding: '4px 6px' }}>B</th>
                    <th style={{ ...tableCellStyle, width: '20%', padding: '4px 6px' }}>C</th>
                  </tr>
                </thead>
                <tbody>
                  {['Attendance', 'Behaviour', 'Uniform', 'Discipline', 'Classroom Participation'].map((field) => (
                    <tr key={field}>
                      <td style={{ ...tableCellStyle, padding: '4px 6px' }}>{field}</td>
                      {['A', 'B', 'C'].map((grade) => (
                        <td style={{ ...tableCellStyle, padding: '4px 6px' }} key={grade}>
                          <input
                            type="radio"
                            name={field}
                            value={grade}
                            style={{ width: 16, height: 16 }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Grading Legend */}
            <div style={{ flex: 1, fontSize: 15, color: '#1e3a8a', fontWeight: 'bold', border: '1px solid #2563eb', borderRadius: 4, padding: 8, background: '#e0e7ff', minWidth: 210, marginLeft: 8, marginTop: 0 }}>
              <div style={{ marginBottom: 2 }}>A<sup>++</sup> Above 95% Outstanding</div>
              <div style={{ marginBottom: 2 }}>A<sup>+</sup>  Above 90% Superb</div>
              <div style={{ marginBottom: 2 }}>A<sup>-</sup>  Above 80% Excellent</div>
              <div style={{ marginBottom: 2 }}>A   Above 70% Very Good</div>
              <div style={{ marginBottom: 2 }}>B   Above 60% Good</div>
              <div style={{ marginBottom: 2 }}>C   Above 50% Satisfactory</div>
              <div style={{ marginBottom: 2 }}>D   Above 40% Need Improvement</div>
            </div>
          </div>
          {/* Signature Lines */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', padding: '0 20px', alignItems: 'flex-end', minHeight: 80 }}>
            <div style={{ textAlign: 'center', paddingLeft: 32 }}>
              <div style={{ borderTop: '1px solid #2563eb', width: 100, margin: '0 auto', height: 2 }}></div>
              <div style={{ marginTop: 2, color: '#7a5c1c', fontWeight: 'bold', fontSize: 12 }}>Teacher Signature</div>
            </div>
            <div style={{ textAlign: 'center', paddingRight: 32 }}>
              <div style={{ borderTop: '1px solid #2563eb', width: 100, margin: '0 auto', height: 2 }}></div>
              <div style={{ marginTop: 2, color: '#7a5c1c', fontWeight: 'bold', fontSize: 12 }}>Principal Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardPage; 