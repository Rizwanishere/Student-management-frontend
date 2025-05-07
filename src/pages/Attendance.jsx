import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../utils/UserContext";
import {
  FaUserGraduate,
  FaBook,
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaSave,
  FaFileExcel,
  FaArrowLeft,
} from "react-icons/fa";
import axios from "axios";
import * as XLSX from "xlsx";
import Loader from "../utils/Loader";

const Attendance = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [submitted, setSubmitted] = useState(false);
  const [totalClasses, setTotalClasses] = useState("");
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    year: "",
    semester: "",
    section: "",
    subject: "",
    month: "",
    period: "",
    regulation: "",
  });
  const [customRegulation, setCustomRegulation] = useState("");
  const [showCustomRegulation, setShowCustomRegulation] = useState(false);
  const selectedBranch = localStorage.getItem("selectedBranch");
  const [attendanceData, setAttendanceData] = useState([]);
  const [importStatus, setImportStatus] = useState({
    isProcessing: false,
    message: "",
    type: "",
  });
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const regulations = ["LR21", "LR22", "LR23", "Other"];

  const handleRegulationChange = (e) => {
    const value = e.target.value;
    setFilters({ ...filters, regulation: value });
    setShowCustomRegulation(value === "Other");
    if (value !== "Other") {
      setCustomRegulation("");
    }
  };

  const handleCustomRegulationChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(value)) {
      setCustomRegulation(value);
      setFilters({ ...filters, regulation: value });
    }
  };

  // Fetch attendance from the backend
  const fetchAttendance = async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    if (filters.period) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/students/attendance/month/${filters.month}/year/${year}/period/${filters.period}`
        );
        setAttendanceData(response.data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    }
  };

  // Fetch subjects from backend
  const fetchSubjects = async () => {
    if (filters.year && filters.semester && filters.regulation) {
      try {
        const regulationValue = showCustomRegulation
          ? customRegulation
          : filters.regulation;
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${filters.year}/semester/${filters.semester}/regulation/${regulationValue}`
        );
        setSubjects(response.data.length > 0 ? response.data : []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjects([]);
      }
    } else {
      setSubjects([]);
    }
  };

  const fetchStudents = async () => {
    if (filters.year && filters.semester && filters.section && selectedBranch) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?branch=${selectedBranch}&year=${filters.year}&semester=${filters.semester}&section=${filters.section}&subjectId=${filters.subject}&period=${filters.period}`
        );
        setStudents(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    }
  };

  useEffect(() => {
    if (filters.year && filters.semester && filters.regulation) {
      fetchSubjects();
    }
    fetchAttendance();
  }, [
    filters.year,
    filters.semester,
    filters.month,
    filters.period,
    filters.regulation,
    customRegulation,
  ]);

  useEffect(() => {
    if (submitted) fetchStudents();
  }, [submitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(false);
    await fetchStudents();
    setSubmitted(true);
  };

  const handleAttendanceChange = (studentId, value) => {
    setAttendanceData((prevData) => {
      const existingIndex = prevData.findIndex(
        (record) =>
          record.student === studentId && record.subject === filters.subject
      );

      const newData = [...prevData];

      if (existingIndex !== -1) {
        newData[existingIndex] = {
          ...newData[existingIndex],
          classesAttended: value,
        };
      } else {
        newData.push({
          student: studentId,
          subject: filters.subject,
          classesAttended: value,
        });
      }

      return newData;
    });
  };

  const handleSave = async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const userRole = localStorage.getItem("userRole");

    try {
      setIsLoading(true);
      setIsSaving(true);
      for (let record of attendanceData) {
        const { student, _id, classesAttended, subject } = record;
        if (subject === filters.subject) {
          if (_id) {
            // Check for admin role only for PUT requests
            if (userRole !== "admin") {
              setShowAuthModal(true);
              return;
            }
            await axios.put(
              `${process.env.REACT_APP_BACKEND_URI}/api/students/attendance/${_id}`,
              {
                student,
                subject,
                totalClasses,
                classesAttended,
                period: filters.period,
                month: filters.month,
                year,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${user?.token}`,
                },
              }
            );
          } else {
            // Allow POST requests for all users
            await axios.post(
              `${process.env.REACT_APP_BACKEND_URI}/api/students/attendance`,
              {
                student,
                subject,
                totalClasses,
                classesAttended,
                period: filters.period,
                month: filters.month,
                year,
              }
            );
          }
        }
      }
      alert("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance");
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  const readExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "array" });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("Excel file contains no sheets");
          }

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Flexible header detection
          let headerRowIndex = -1;
          let rollNumberIndex = -1;
          let nameIndex = -1;
          let classesIndex = -1;

          // Search for header row with our required columns
          for (let i = 0; i < Math.min(20, rawRows.length); i++) {
            const row = rawRows[i];
            if (!row) continue;

            // Check each cell for our column indicators
            for (let j = 0; j < row.length; j++) {
              const cellValue = String(row[j] || "").toLowerCase();

              if (
                cellValue.includes("roll") ||
                cellValue.includes("rno") ||
                cellValue.includes("reg")
              ) {
                rollNumberIndex = j;
              }
              if (cellValue.includes("name") || cellValue.includes("student")) {
                nameIndex = j;
              }
              if (
                cellValue.includes("class") ||
                cellValue.includes("attend") ||
                cellValue.includes("total")
              ) {
                classesIndex = j;
              }
            }

            // If we found at least roll number and classes columns, this is our header row
            if (rollNumberIndex !== -1 && classesIndex !== -1) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error(
              "Could not find valid header row with required columns"
            );
          }

          // Process data rows
          const processedData = [];
          for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row) continue;

            const rollNumber =
              rollNumberIndex !== -1
                ? String(row[rollNumberIndex] || "").trim()
                : "";
            const studentName =
              nameIndex !== -1 ? String(row[nameIndex] || "").trim() : "";
            const classesAttended =
              classesIndex !== -1 ? row[classesIndex] : "";

            // Skip rows with empty roll numbers
            if (!rollNumber) continue;

            processedData.push({
              "Roll Number": rollNumber,
              "Student Name": studentName,
              "Classes Attended": classesAttended,
            });
          }

          if (processedData.length === 0) {
            throw new Error("No valid attendance data found in Excel");
          }

          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const validateExcelData = (data) => {
    const errors = [];
    const warnings = [];

    if (!data || data.length === 0) {
      errors.push("No valid data found in Excel file");
      return { isValid: false, errors, warnings };
    }

    // Validate each row
    data.forEach((row, index) => {
      const rollNo = row["Roll Number"];
      const classes = row["Classes Attended"];

      if (!rollNo) {
        warnings.push(`Row ${index + 1}: Missing Roll Number - skipped`);
      }

      if (classes === undefined || classes === null || classes === "") {
        warnings.push(
          `Row ${index + 1}: Missing Classes Attended for ${rollNo}`
        );
      } else if (isNaN(Number(classes))) {
        errors.push(
          `Row ${index + 1}: Invalid Classes Attended value for ${rollNo}`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset states
    setImportErrors([]);
    setImportWarnings([]);
    setImportStatus({
      isProcessing: true,
      message: "Processing Excel file...",
      type: "info",
    });

    try {
      // Read and parse Excel
      const data = await readExcel(file);

      // Validate data
      const { isValid, errors, warnings } = validateExcelData(data);
      setImportWarnings(warnings);

      if (!isValid) {
        setImportErrors(errors);
        throw new Error("Excel file contains validation errors");
      }

      // Match Excel data with students
      const unmatchedRollNumbers = [];
      const newAttendanceData = students.map((student) => {
        // Case-insensitive comparison
        const excelRow = data.find(
          (row) =>
            row["Roll Number"].toLowerCase() === student.rollNo.toLowerCase()
        );

        if (excelRow) {
          return {
            student: student._id,
            subject: filters.subject,
            classesAttended: excelRow["Classes Attended"]?.toString() || "0",
          };
        } else {
          unmatchedRollNumbers.push(student.rollNo);
          const existingRecord = attendanceData.find(
            (record) =>
              record.student === student._id &&
              record.subject === filters.subject
          );
          return (
            existingRecord || {
              student: student._id,
              subject: filters.subject,
              classesAttended: "0",
            }
          );
        }
      });

      setAttendanceData(newAttendanceData);

      let statusMessage = "Attendance imported successfully!";
      let statusType = "success";

      if (unmatchedRollNumbers.length > 0) {
        statusMessage += ` (${unmatchedRollNumbers.length} students not found in Excel)`;
        statusType = "warning";
      }

      setImportStatus({
        isProcessing: false,
        message: statusMessage,
        type: statusType,
      });
    } catch (error) {
      console.error("Import failed:", error);
      setImportStatus({
        isProcessing: false,
        message: error.message || "Failed to import Excel file",
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/home")}
          className="mb-6 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Attendance Management
          </h1>
          <p className="text-gray-600">
            Record and manage student attendance efficiently
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUserGraduate className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={filters.year}
                      onChange={(e) =>
                        setFilters({ ...filters, year: e.target.value })
                      }
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
                  <label className="block text-sm font-medium text-gray-700">
                    Semester
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBook className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={filters.semester}
                      onChange={(e) =>
                        setFilters({ ...filters, semester: e.target.value })
                      }
                    >
                      <option value="">Select Semester</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Regulation
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={filters.regulation}
                    onChange={handleRegulationChange}
                  >
                    <option value="">Select Regulation</option>
                    {regulations.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                  {showCustomRegulation && (
                    <input
                      type="text"
                      className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      placeholder="Enter Regulation Code"
                      value={customRegulation}
                      onChange={handleCustomRegulationChange}
                      pattern="[A-Z0-9]*"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Section
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={filters.section}
                    onChange={(e) =>
                      setFilters({ ...filters, section: e.target.value })
                    }
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={filters.subject}
                    onChange={(e) =>
                      setFilters({ ...filters, subject: e.target.value })
                    }
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Month
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={filters.month}
                      onChange={(e) =>
                        setFilters({ ...filters, month: e.target.value })
                      }
                    >
                      <option value="">Select Month</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString("default", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Period
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={filters.period}
                      onChange={(e) =>
                        setFilters({ ...filters, period: e.target.value })
                      }
                    >
                      <option value="">Select Period</option>
                      <option value="15th">Up to 15th</option>
                      <option value="30th">Up to 30th</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Total Classes Taken
                </label>
                <input
                  type="number"
                  placeholder="Enter total classes taken"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  value={totalClasses}
                  onChange={(e) => setTotalClasses(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center space-x-2"
                >
                  <FaSearch />
                  <span>Search Students</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {isLoading && (
          <div className="mt-8 flex justify-center">
            <Loader />
          </div>
        )}

        {submitted && students.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Attendance Records
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Course:{" "}
                    {
                      subjects.find(
                        (subject) => subject._id === filters.subject
                      )?.name
                    }
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-4">
                  <label
                    htmlFor="excel-upload"
                    className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 cursor-pointer flex items-center space-x-2"
                  >
                    <FaFileExcel />
                    <span>Import Excel</span>
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    className="hidden"
                    id="excel-upload"
                  />
                  <button
                    onClick={handleSave}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                    disabled={isSaving}
                  >
                    <FaSave />
                    <span>{isSaving ? "Saving..." : "Save Attendance"}</span>
                  </button>
                </div>
              </div>

              {isSaving && (
                <div className="mt-4 flex justify-center">
                  <Loader />
                </div>
              )}

              {importStatus.message && (
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    importStatus.type === "success"
                      ? "bg-green-100 text-green-700"
                      : importStatus.type === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {importStatus.message}
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-red-700">Errors:</h4>
                  <ul className="list-disc list-inside text-red-600">
                    {importErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importWarnings.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-yellow-700">Warnings:</h4>
                  <ul className="list-disc list-inside text-yellow-600">
                    {importWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Classes Attended
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => {
                      const record = attendanceData.find(
                        (r) =>
                          r.student === student._id &&
                          r.subject === filters.subject
                      );
                      return (
                        <tr
                          key={student._id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.rollNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-24 border border-gray-200 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                              value={record?.classesAttended || ""}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  student._id,
                                  e.target.value
                                )
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h3>
              <p className="text-gray-600 mb-6">You are not authorized as an admin to perform this action.</p>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
