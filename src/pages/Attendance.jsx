import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Loader from "../utils/Loader";

const Attendance = () => {
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
  });
  const selectedBranch = localStorage.getItem("selectedBranch");
  const [attendanceData, setAttendanceData] = useState([]);
  const [importStatus, setImportStatus] = useState({
    isProcessing: false,
    message: "",
    type: ""
  });
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    if (filters.year && filters.semester) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${filters.year}/semester/${filters.semester}`
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
    if (filters.year && filters.semester) {
      fetchSubjects();
    }
    fetchAttendance();
  }, [filters.year, filters.semester, filters.month, filters.period]);

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
    setAttendanceData(prevData => {
      const existingIndex = prevData.findIndex(
        record => record.student === studentId && record.subject === filters.subject
      );

      const newData = [...prevData];

      if (existingIndex !== -1) {
        newData[existingIndex] = {
          ...newData[existingIndex],
          classesAttended: value
        };
      } else {
        newData.push({
          student: studentId,
          subject: filters.subject,
          classesAttended: value
        });
      }

      return newData;
    });
  };

  const handleSave = async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    try {
      setIsLoading(true);
      setIsSaving(true);
      for (let record of attendanceData) {
        const { student, _id, classesAttended, subject } = record;
        if (subject === filters.subject) {
          if (_id) {
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
              }
            );
          } else {
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
              const cellValue = String(row[j] || '').toLowerCase();

              if (cellValue.includes('roll') || cellValue.includes('rno') || cellValue.includes('reg')) {
                rollNumberIndex = j;
              }
              if (cellValue.includes('name') || cellValue.includes('student')) {
                nameIndex = j;
              }
              if (cellValue.includes('class') || cellValue.includes('attend') || cellValue.includes('total')) {
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
            throw new Error("Could not find valid header row with required columns");
          }

          // Process data rows
          const processedData = [];
          for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row) continue;

            const rollNumber = rollNumberIndex !== -1 ? String(row[rollNumberIndex] || '').trim() : '';
            const studentName = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
            const classesAttended = classesIndex !== -1 ? row[classesIndex] : '';

            // Skip rows with empty roll numbers
            if (!rollNumber) continue;

            processedData.push({
              "Roll Number": rollNumber,
              "Student Name": studentName,
              "Classes Attended": classesAttended
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

      if (classes === undefined || classes === null || classes === '') {
        warnings.push(`Row ${index + 1}: Missing Classes Attended for ${rollNo}`);
      } else if (isNaN(Number(classes))) {
        errors.push(`Row ${index + 1}: Invalid Classes Attended value for ${rollNo}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
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
      type: "info"
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
      const newAttendanceData = students.map(student => {
        // Case-insensitive comparison
        const excelRow = data.find(row =>
          row["Roll Number"].toLowerCase() === student.rollNo.toLowerCase()
        );

        if (excelRow) {
          return {
            student: student._id,
            subject: filters.subject,
            classesAttended: excelRow["Classes Attended"]?.toString() || "0"
          };
        } else {
          unmatchedRollNumbers.push(student.rollNo);
          const existingRecord = attendanceData.find(
            record => record.student === student._id && record.subject === filters.subject
          );
          return existingRecord || {
            student: student._id,
            subject: filters.subject,
            classesAttended: "0"
          };
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
        type: statusType
      });

    } catch (error) {
      console.error("Import failed:", error);
      setImportStatus({
        isProcessing: false,
        message: error.message || "Failed to import Excel file",
        type: "error"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      {
        isLoading && <Loader />
      }
      <form
        className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold mb-4">Attendance Entry</h2>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select
            className="border p-2 rounded"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            className="border p-2 rounded"
            value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          >
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>

          <select
            className="border p-2 rounded"
            value={filters.section}
            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          <select
            className="border p-2 rounded"
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>{subject.name}</option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            <option value="">Select Month</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">Select Period</option>
            <option value="15th">Up to 15th</option>
            <option value="30th">Up to 30th</option>
          </select>
        </div>

        <input
          type="number"
          placeholder="Total Classes Taken"
          className="border p-2 rounded w-full mt-4"
          value={totalClasses}
          onChange={(e) => setTotalClasses(e.target.value)}
          required
        />

        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enter
        </button>
      </form>

      {submitted && students.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-6xl">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Attendance Table</h3>
              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelImport}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Import from Excel
                </label>
              </div>
            </div>

            {importStatus.message && (
              <div className={`p-4 rounded ${importStatus.type === 'success' ? 'bg-green-100 text-green-700' :
                  importStatus.type === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                }`}>
                {importStatus.message}
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="bg-red-100 text-red-700 p-4 rounded">
                <h4 className="font-semibold">Errors:</h4>
                <ul className="list-disc list-inside">
                  {importErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {importWarnings.length > 0 && (
              <div className="bg-yellow-100 text-yellow-700 p-4 rounded">
                <h4 className="font-semibold">Warnings:</h4>
                <ul className="list-disc list-inside">
                  {importWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <table className="table-auto w-full border">
              <thead>
                <tr>
                  <th className="border px-4 py-2">S No</th>
                  <th className="border px-4 py-2">Roll No</th>
                  <th className="border px-4 py-2">Student Name</th>
                  <th className="border px-4 py-2">Classes Attended</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const record = attendanceData.find(
                    r => r.student === student._id && r.subject === filters.subject
                  );
                  return (
                    <tr key={student._id}>
                      <td className="border px-4 py-2">{index + 1}</td>
                      <td className="border px-4 py-2">{student.rollNo}</td>
                      <td className="border px-4 py-2">{student.name}</td>
                      <td className="border px-4 py-2">
                        <input
                          type="number"
                          className="border p-2 rounded w-full text-center"
                          value={record?.classesAttended || ""}
                          onChange={(e) => handleAttendanceChange(student._id, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              onClick={handleSave}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save Attendance"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;