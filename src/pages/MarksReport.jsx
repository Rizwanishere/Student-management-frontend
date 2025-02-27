import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Loader from "../utils/Loader";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const MarksReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [examType, setExamType] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false); // State to control table rendering
  const tableRef = useRef(); // Reference to the table for generating PDF

  const selectedBranch = localStorage.getItem("selectedBranch");

  // Fetch subjects based on selected year, semester, and section
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedSemester) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
          );
          // Check if API response contains subjects or a message
          if (
            response.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            setSubjectOptions(response.data);
          } else {
            setSubjectOptions([]); // Clear the dropdown if no subjects are found
          }
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubjectOptions([]); // Ensure dropdown is cleared on error
        }
      } else {
        setSubjectOptions([]); // Reset when year/semester is deselected
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch marks for the selected branch, year, section, and examType
  const fetchMarks = async () => {
    if (selectedYear && selectedSemester && selectedSection && examType) {
      try {
        setLoading(true);
        const marksResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedYear}/${selectedSemester}/${selectedSection}/${examType}`
        );
        setMarksData(marksResponse.data);
        setShowTable(true); // Show table after fetching marks
      } catch (error) {
        console.error("Error fetching marks:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle form submission to fetch marks
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchMarks();
  };

  // Group marks data by student
  const groupedMarksData = marksData.reduce((acc, record) => {
    const studentId = record.student._id;
    const subjectId = record.subject._id;

    if (!acc[studentId]) {
      acc[studentId] = {
        student: record.student,
        marks: {},
      };
    }

    // Store the marks by subject ID
    acc[studentId].marks[subjectId] = record.marks;

    return acc;
  }, {});

  // Convert the grouped data back into an array
  const uniqueMarksData = Object.values(groupedMarksData);

  const downloadPDF = () => {
    const input = tableRef.current;
  
    // Lower the scale and adjust quality for compression
    html2canvas(input, { scale: 1.5 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/jpeg", 0.8); // Use JPEG with quality 0.8
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      pdf.save("MarksReport.pdf");
    });
  };  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <form
        className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold mb-4">Marks Report</h2>

        {/* Dropdowns for selecting criteria */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Year Dropdown */}
          <select
            className="border p-2 rounded"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          {/* Semester Dropdown */}
          <select
            className="border p-2 rounded"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>

          {/* Section Dropdown */}
          <select
            className="border p-2 rounded"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          {/* Exam Type Dropdown */}
          <select
            className="border p-2 rounded"
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          >
            <option value="">Select Exam Type</option>
            <option value="CIE-1">CIE-1</option>
            <option value="CIE-2">CIE-2</option>
            <option value="ASSIGNMENT-1">Assignment-1</option>
            <option value="ASSIGNMENT-2">Assignment-2</option>
            <option value="ASSIGNMENT-3">Assignment-3</option>
            <option value="SURPRISE TEST-1">Surprise Test-1</option>
            <option value="SURPRISE TEST-2">Surprise Test-2</option>
            <option value="SURPRISE TEST-3">Surprise Test-3</option>
          </select>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generate Report
        </button>
      </form>
      {/* Conditionally render the table after marks data is fetched */}
      {showTable && uniqueMarksData.length > 0 && !loading && (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-5xl">
          <h2 className="text-2xl font-semibold mb-4">Marks Table</h2>
          <div ref={tableRef}>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 border">S.No</th>
                  <th className="py-2 border">Roll No</th>
                  <th className="py-2 border">Name</th>
                  {subjectOptions.map((subject) => (
                    <th key={subject._id} className="py-2 border">
                      {subject.name}
                    </th>
                  ))}
                  <th className="py-2 border">Total Marks</th>
                  <th className="py-2 border">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {uniqueMarksData.map((record, index) => {
                  let totalMarks = 0;
                  let totalMaxMarks = 0;

                  // Calculate total marks and accumulate maxMarks for each subject
                  marksData.forEach((markRecord) => {
                    if (markRecord.student._id === record.student._id) {
                      const subjectMarks = markRecord.marks || 0; // Get the marks for this subject
                      const maxMarksForSubject = markRecord.maxMarks || 100; // Get maxMarks from the API response, default to 100 if missing

                      totalMarks += subjectMarks;
                      totalMaxMarks += maxMarksForSubject; // Accumulate the max marks from each subject
                    }
                  });

                  // Calculate percentage based on total max marks
                  const percentage =
                    totalMaxMarks > 0
                      ? ((totalMarks / totalMaxMarks) * 100).toFixed(2)
                      : "-"; // Calculate percentage and format it to 2 decimal places

                  return (
                    <tr key={record.student._id}>
                      <td className="p-2 border text-center">{index + 1}</td>
                      <td className="p-2 border text-center">
                        {record.student.rollNo}
                      </td>
                      <td className="p-2 border text-center">
                        {record.student.name}
                      </td>
                      {subjectOptions.map((subject) => (
                      <td key={subject._id} className="p-2 border text-center">
                          {record.marks[subject._id] !== undefined
                            ? record.marks[subject._id]
                            : "0"}
                        </td>
                      ))}
                      <td className="p-2 border text-center">{totalMarks}</td>
                      <td className="p-2 border text-center">{percentage} %</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            onClick={downloadPDF}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-primary"
          >
            Download PDF
          </button>
        </div>
      )}
      {/* Loading state */}
      {loading && <Loader loading={loading} />}
    </div>
  );
};

export default MarksReport;
