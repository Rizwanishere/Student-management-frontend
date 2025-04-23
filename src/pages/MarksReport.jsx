import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Loader from "../utils/Loader";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FaSearch, FaDownload, FaGraduationCap, FaBook, FaUsers, FaPencilAlt } from 'react-icons/fa';

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

  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [customRegulation, setCustomRegulation] = useState("");
  const [showCustomRegulation, setShowCustomRegulation] = useState(false);

  const regulations = ["LR21", "LR22", "LR23", "Other"];

  const handleRegulationChange = (e) => {
    const value = e.target.value;
    setSelectedRegulation(value);
    setShowCustomRegulation(value === "Other");
    if (value !== "Other") {
      setCustomRegulation("");
    }
  };

  const handleCustomRegulationChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(value)) {
      setCustomRegulation(value);
      setSelectedRegulation(value);
    }
  };

  const selectedBranch = localStorage.getItem("selectedBranch");

  // Fetch subjects based on selected year, semester, and section
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedSemester) {
        try {
          const regulationValue = showCustomRegulation ? customRegulation : selectedRegulation;
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}/regulation/${regulationValue}`
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
  }, [selectedYear, selectedSemester, selectedBranch, selectedRegulation, customRegulation, showCustomRegulation]);

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Marks Report</h1>
              <div className="text-sm text-gray-500">
                {selectedBranch && `Branch: ${selectedBranch}`}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mb-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaGraduationCap className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBook className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                      <option value="">Select Semester</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Regulation</label>
                  <div className="relative">
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedRegulation}
                      onChange={handleRegulationChange}
                    >
                      <option value="">Select Regulation</option>
                      {regulations.map((reg) => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                  {showCustomRegulation && (
                    <input
                      type="text"
                      className="w-full mt-2 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      placeholder="Enter Regulation Code"
                      value={customRegulation}
                      onChange={handleCustomRegulationChange}
                      pattern="[A-Z0-9]*"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUsers className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      <option value="">Select Section</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Exam Type</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPencilAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <FaSearch className="mr-2" />
                  Generate Report
                </button>
              </div>
            </form>

            {showTable && uniqueMarksData.length > 0 && !loading && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Marks Report</h2>
                    <button
                      onClick={downloadPDF}
                      className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md hover:bg-green-600 transition-all duration-200"
                    >
                      <FaDownload className="mr-2" />
                      Download PDF
                    </button>
                  </div>

                  <div ref={tableRef} className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          {subjectOptions.map((subject) => (
                            <th key={subject._id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {subject.name}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marks</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uniqueMarksData.map((record, index) => {
                          let totalMarks = 0;
                          let totalMaxMarks = 0;

                          marksData.forEach((markRecord) => {
                            if (markRecord.student._id === record.student._id) {
                              totalMarks += markRecord.marks || 0;
                              totalMaxMarks += markRecord.maxMarks || 100;
                            }
                          });

                          const percentage = totalMaxMarks > 0
                            ? ((totalMarks / totalMaxMarks) * 100).toFixed(2)
                            : "-";

                          return (
                            <tr key={record.student._id} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.student.rollNo}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.student.name}</td>
                              {subjectOptions.map((subject) => (
                                <td key={subject._id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                  {record.marks[subject._id] !== undefined ? record.marks[subject._id] : "0"}
                                </td>
                              ))}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">{totalMarks}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">{percentage}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default MarksReport;
