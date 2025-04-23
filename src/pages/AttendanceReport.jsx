import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Loader from "../utils/Loader";
import { FaSearch, FaDownload, FaGraduationCap, FaBook, FaUsers, FaCalendarAlt, FaClock } from 'react-icons/fa';

const AttendanceReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedYearAttendance, setSelectedYearAttendance] = useState("");
  const [students, setStudents] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [customRegulation, setCustomRegulation] = useState("");
  const [showCustomRegulation, setShowCustomRegulation] = useState(false);
  const tableRef = useRef(); // Reference for the table

  const selectedBranch = localStorage.getItem("selectedBranch");

  const regulations = ["LR21", "LR22", "LR23", "Other"];

  // Handle regulation change
  const handleRegulationChange = (e) => {
    const value = e.target.value;
    setSelectedRegulation(value);
    setShowCustomRegulation(value === "Other");
    if (value !== "Other") {
      setCustomRegulation("");
    }
  };

  // Handle custom regulation input
  const handleCustomRegulationChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(value)) {
      setCustomRegulation(value);
      setSelectedRegulation(value);
    }
  };

  // Fetch attendance data
  const fetchAttendance = async () => {
    if (
      selectedMonth &&
      selectedYearAttendance &&
      selectedYear &&
      selectedSemester &&
      selectedSection
    ) {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/students/attendance/month/${selectedMonth}/year/${selectedYearAttendance}/period/${selectedPeriod}`
        );
        setAttendanceData(response.data);
        setShowTable(true);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedYear && selectedSemester && selectedSection) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}`
          );
          setStudents(response.data);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      }
    };
    fetchStudents();
  }, [selectedYear, selectedSemester, selectedSection]);

  useEffect(() => {
    const fetchSubjects = async () => {
        if (!selectedYear || !selectedSemester || !selectedBranch || !selectedRegulation || (showCustomRegulation && !customRegulation)) return;
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
      };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch, selectedRegulation, customRegulation, showCustomRegulation]);

  // Group attendance data by student ID
  const groupedAttendanceData = students.map((student) => {
    const studentAttendance = attendanceData.filter(
      (att) => att.student === student._id
    );
    const attendanceBySubject = subjectOptions.map((subject) => {
      const attendanceRecord = studentAttendance.find(
        (att) => att.subject === subject._id
      );
      return attendanceRecord
        ? {
            classesAttended: attendanceRecord.classesAttended,
            totalClasses: attendanceRecord.totalClasses,
          }
        : { classesAttended: "0", totalClasses: "0" }; // Default to "0" if no attendance record
    });

    const totalAttended = attendanceBySubject.reduce(
      (sum, subject) => sum + Number(subject.classesAttended),
      0
    );
    const totalPossible = attendanceBySubject.reduce(
      (sum, subject) => sum + Number(subject.totalClasses),
      0
    );
    const percentage =
      totalPossible > 0
        ? ((totalAttended / totalPossible) * 100).toFixed(2)
        : "0.00";

    return {
      student,
      attendance: attendanceBySubject,
      totalAttended,
      totalPossible,
      percentage,
    };
  });

  // Function to download the table as a PDF
  const downloadPDF = () => {
    const input = tableRef.current;
  
    // Lower the scale and adjust quality for compression
    html2canvas(input, { scale: 1.5 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/jpeg", 0.8); // Use JPEG with quality 0.8
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      pdf.save("AttendanceReport.pdf");
    });
  };
  

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Attendance Report</h1>
              <div className="text-sm text-gray-500">
                {selectedBranch && `Branch: ${selectedBranch}`}
              </div>
            </div>

            <form className="mb-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  value={selectedRegulation}
                  onChange={handleRegulationChange}
                >
                  <option value="">Select Regulation</option>
                  {regulations.map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
                {showCustomRegulation && (
                  <input
                    type="text"
                    className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="">Select Month</option>
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Attendance Period</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                      <option value="">Select Attendance Period</option>
                      <option value="15th">Upto 15th</option>
                      <option value="30th">Upto 30th</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Attendance Year</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedYearAttendance}
                      onChange={(e) => setSelectedYearAttendance(e.target.value)}
                    >
                      <option value="">Select Attendance Year</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={fetchAttendance}
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <FaSearch className="mr-2" />
                  Generate Report
                </button>
              </div>
            </form>

            {showTable && groupedAttendanceData.length > 0 && !loading && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Report</h2>
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
                              {subject.name} <br /> <span className="text-gray-400">(Total: {
                                attendanceData.find((att) => att.subject === subject._id)?.totalClasses || 0
                              })</span>
                            </th>
                          ))}
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total <br />
                            <span className="text-gray-400">
                              ({subjectOptions.reduce((sum, subject) => {
                                const totalClassesForSubject = attendanceData.find((att) => att.subject === subject._id)?.totalClasses || 0;
                                return sum + Number(totalClassesForSubject);
                              }, 0)})
                            </span>
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedAttendanceData.map((record, index) => (
                          <tr key={record.student._id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.student.rollNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.student.name}</td>
                            {record.attendance.map((attended, subIndex) => (
                              <td key={subIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                {attended.classesAttended}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">
                              {record.totalAttended}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">
                              {record.percentage}%
                            </td>
                          </tr>
                        ))}
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

export default AttendanceReport;
