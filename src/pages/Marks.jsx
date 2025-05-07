import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaSave, FaFileExcel, FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import * as XLSX from "xlsx";
import Loader from "../utils/Loader";
import { useUser } from "../utils/UserContext";

const Marks = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [submitted, setSubmitted] = useState(false);
  const [examType, setExamType] = useState("");
  const [maxMarks, setMaxMarks] = useState(0);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [customRegulation, setCustomRegulation] = useState("");
  const [showCustomRegulation, setShowCustomRegulation] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [importStatus, setImportStatus] = useState({
    isProcessing: false,
    message: "",
    type: "",
  });
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [loading, setloading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const selectedBranch = localStorage.getItem("selectedBranch");

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

  // Fetch subjects based on selected year, semester, and section
  useEffect(() => {
    const fetchSubjects = async () => {
      if (
        !selectedYear ||
        !selectedSemester ||
        !selectedBranch ||
        !selectedRegulation ||
        (showCustomRegulation && !customRegulation)
      )
        return;
      try {
        const regulationValue = showCustomRegulation
          ? customRegulation
          : selectedRegulation;
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}/regulation/${regulationValue}`
        );
        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          setSubjectOptions(response.data);
        } else {
          setSubjectOptions([]);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjectOptions([]);
      }
    };
    fetchSubjects();
  }, [
    selectedYear,
    selectedSemester,
    selectedBranch,
    selectedRegulation,
    customRegulation,
    showCustomRegulation,
  ]);

  // Fetch students and marks based on selected criteria
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedSubject && examType) {
        try {
          const studentsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?branch=${selectedBranch}&year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}&subjectId=${selectedSubject}`
          );

          const marksResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}`
          );

          const studentsWithMarks = studentsResponse.data.map((student) => {
            const markEntry = marksResponse.data.find(
              (mark) => mark.student._id === student._id
            );
            return {
              ...student,
              marks:
                markEntry &&
                markEntry.marks !== undefined &&
                markEntry.marks !== null
                  ? markEntry.marks.toString() // Convert to string to preserve 0
                  : "",
            };
          });

          setStudents(studentsWithMarks);

          const initialMarksData = studentsWithMarks.map((student) => ({
            student: student._id,
            subject: selectedSubject,
            marks: student.marks,
          }));
          setMarksData(initialMarksData);
        } catch (error) {
          console.error("Error fetching students or marks:", error);
        }
      }
    };
    fetchStudents();
  }, [
    selectedSubject,
    selectedYear,
    selectedSemester,
    selectedSection,
    examType,
    selectedBranch,
  ]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  // Handle exam type change and update max marks
  const handleExamTypeChange = (e) => {
    const selectedExamType = e.target.value;
    setExamType(selectedExamType);

    if (selectedExamType === "CIE-1" || selectedExamType === "CIE-2") {
      setMaxMarks(20);
    } else {
      setMaxMarks(10);
    }
  };

  // Handle marks input change
  const handleMarksChange = (studentId, value) => {
    const numValue = value === "" ? "" : Number(value);

    if (
      numValue === "" ||
      (typeof numValue === "number" && numValue <= maxMarks && numValue >= 0)
    ) {
      setMarksData((prevData) => {
        const existingIndex = prevData.findIndex(
          (record) =>
            record.student === studentId && record.subject === selectedSubject
        );

        const newData = [...prevData];

        if (existingIndex !== -1) {
          newData[existingIndex] = {
            ...newData[existingIndex],
            marks: value,
          };
        } else {
          newData.push({
            student: studentId,
            subject: selectedSubject,
            marks: value,
          });
        }

        return newData;
      });

      const updatedStudents = students.map((student) => {
        if (student._id === studentId) {
          return { ...student, marks: value };
        }
        return student;
      });
      setStudents(updatedStudents);
    } else {
      alert(`Marks must be between 0 and ${maxMarks}`);
    }
  };

  // Read Excel file
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

          let headerRowIndex = -1;
          let rollNumberIndex = -1;
          let nameIndex = -1;
          let marksIndex = -1;

          // Define exam type to column name mappings
          const examTypesConfig = {
            "CIE-1": ["CIE-1", "cie1", "internal 1"],
            "CIE-2": ["CIE-2", "cie2", "internal 2"],
            "ASSIGNMENT-1": ["AT-1", "at1", "assignment 1"],
            "ASSIGNMENT-2": ["AT-2", "at2", "assignment 2"],
            "ASSIGNMENT-3": ["AT-3", "at3", "assignment 3"],
            "SURPRISE TEST-1": ["ST-1", "st1", "surprise test 1", "test 1"],
            "SURPRISE TEST-2": ["ST-2", "st2", "surprise test 2", "test 2"],
            "SURPRISE TEST-3": ["ST-3", "st3", "surprise test 3", "test 3"],
            SEE: ["SEE", "see", "semester end", "external"],
            // Fallback for generic marks column
            marks: ["marks", "score", "grade", "result"],
          };

          for (let i = 0; i < Math.min(20, rawRows.length); i++) {
            const row = rawRows[i];
            if (!row) continue;

            for (let j = 0; j < row.length; j++) {
              const cellValue = String(row[j] || "").trim();
              const lowerCellValue = cellValue.toLowerCase();

              // Identify roll number column
              if (
                lowerCellValue.includes("roll") ||
                lowerCellValue.includes("rno") ||
                lowerCellValue.includes("reg") ||
                lowerCellValue.includes("id")
              ) {
                rollNumberIndex = j;
              }

              // Identify name column
              if (
                lowerCellValue.includes("name") ||
                lowerCellValue.includes("student")
              ) {
                nameIndex = j;
              }

              // Identify marks column based on exam type
              const columnNames =
                examTypesConfig[examType] || examTypesConfig.marks;
              if (columnNames) {
                if (
                  columnNames.includes(cellValue) ||
                  columnNames.includes(lowerCellValue) ||
                  cellValue === examType ||
                  lowerCellValue.includes(examType.toLowerCase())
                ) {
                  marksIndex = j;
                }
              }
            }

            if (rollNumberIndex !== -1 && marksIndex !== -1) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error(
              "Could not find valid header row with required columns"
            );
          }

          const processedData = [];
          for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length === 0) continue;

            const rollNumber =
              rollNumberIndex !== -1
                ? String(row[rollNumberIndex] || "").trim()
                : "";
            const studentName =
              nameIndex !== -1 ? String(row[nameIndex] || "").trim() : "";
            let marks = marksIndex !== -1 ? row[marksIndex] : "";

            if (typeof marks === "string") {
              marks = marks.trim();
              if (marks === "") marks = null;
              else marks = parseFloat(marks);
            }

            if (!rollNumber) continue;

            processedData.push({
              "Roll Number": rollNumber,
              "Student Name": studentName,
              Marks: isNaN(marks) ? null : marks,
            });
          }

          if (processedData.length === 0) {
            throw new Error("No valid marks data found in Excel");
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
  // Validate Excel data
  const validateExcelData = (data) => {
    const errors = [];
    const warnings = [];

    if (!data || data.length === 0) {
      errors.push("No valid data found in Excel file");
      return { isValid: false, errors, warnings };
    }

    const maxAllowedMarks = maxMarks;
    data.forEach((row, index) => {
      const rollNo = row["Roll Number"];
      let marks = row["Marks"];

      if (!rollNo) {
        warnings.push(`Row ${index + 1}: Missing Roll Number - skipped`);
        return;
      }

      if (marks === undefined || marks === null || marks === "") {
        warnings.push(`Row ${index + 1}: Missing marks for ${rollNo}`);
      } else if (isNaN(Number(marks))) {
        errors.push(
          `Row ${index + 1}: Invalid marks value "${marks}" for ${rollNo}`
        );
      } else {
        const numericMarks = Number(marks);
        if (numericMarks < 0) {
          errors.push(
            `Row ${index + 1}: Negative marks value ${marks} for ${rollNo}`
          );
        } else if (numericMarks > maxAllowedMarks) {
          errors.push(
            `Row ${
              index + 1
            }: Marks value ${marks} exceeds maximum of ${maxAllowedMarks} for ${rollNo}`
          );
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  // Handle Excel import
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportErrors([]);
    setImportWarnings([]);
    setImportStatus({
      isProcessing: true,
      message: "Processing Excel file...",
      type: "info",
    });

    try {
      const data = await readExcel(file);
      const { isValid, errors, warnings } = validateExcelData(data);
      setImportWarnings(warnings);

      if (!isValid) {
        setImportErrors(errors);
        throw new Error("Excel file contains validation errors");
      }

      const unmatchedRollNumbers = [];
      const newMarksData = students.map((student) => {
        const excelRow = data.find(
          (row) =>
            row["Roll Number"].toLowerCase() === student.rollNo.toLowerCase()
        );

        if (excelRow) {
          const marksValue =
            excelRow["Marks"] !== undefined && excelRow["Marks"] !== null
              ? excelRow["Marks"].toString()
              : "";
          return {
            student: student._id,
            subject: selectedSubject,
            marks: marksValue,
          };
        } else {
          unmatchedRollNumbers.push(student.rollNo);
          const existingRecord = marksData.find(
            (record) =>
              record.student === student._id &&
              record.subject === selectedSubject
          );
          return (
            existingRecord || {
              student: student._id,
              subject: selectedSubject,
              marks: "",
            }
          );
        }
      });

      setMarksData(newMarksData);

      const updatedStudents = students.map((student) => {
        const markRecord = newMarksData.find(
          (record) => record.student === student._id
        );
        return {
          ...student,
          marks: markRecord ? markRecord.marks : "",
        };
      });
      setStudents(updatedStudents);

      let statusMessage = "Marks imported successfully!";
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
      e.target.value = null;
    } catch (error) {
      console.error("Import failed:", error);
      setImportStatus({
        isProcessing: false,
        message: error.message || "Failed to import Excel file",
        type: "error",
      });
      e.target.value = null;
    }
  };

  // Handle save marks
  const handleSave = async () => {
    setloading(true);
    try {
      for (let student of students) {
        const { _id, marks } = student;

        if (marks === undefined || marks === null || marks === "") continue;

        try {
          const existingMarkEntry = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}`
          );

          const markEntryToUpdate = existingMarkEntry.data.find(
            (mark) => mark.student._id === _id
          );

          if (markEntryToUpdate) {
            // Check for admin role only for PUT requests
            const userRole = localStorage.getItem("userRole");
            if (userRole !== "admin") {
              setShowAuthModal(true);
              return;
            }
            await axios.put(
              `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}/${markEntryToUpdate._id}`,
              {
                student: _id,
                subject: selectedSubject,
                examType: examType,
                marks: Number(marks), // Convert to number for backend
                maxMarks: maxMarks,
                regulation: selectedRegulation,
                year: selectedYear,
                semester: selectedSemester,
                section: selectedSection,
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
            await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/marks`, {
              student: _id,
              subject: selectedSubject,
              examType: examType,
              marks: Number(marks), // Convert to number for backend
              maxMarks: maxMarks,
              regulation: selectedRegulation,
              year: selectedYear,
              semester: selectedSemester,
              section: selectedSection,
            });
          }
        } catch (error) {
          console.error(`Error saving marks for student ${_id}:`, error);
        }
      }
      alert("Marks saved successfully");
    } catch (error) {
      console.error("Error saving marks:", error);
      alert("Failed to save marks");
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    if (importStatus.message) {
      const timer = setTimeout(() => {
        setImportStatus((prev) => ({ ...prev, message: "" }));
      }, 5000); // 5 seconds

      return () => clearTimeout(timer); // Cleanup on unmount
    }
  }, [importStatus.message]);

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
            Marks Entry System
          </h1>
          <p className="text-gray-600">
            Enter and manage student marks efficiently
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
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Semester
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Section
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Regulation
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={selectedRegulation}
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
                    Subject
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value="">Select Subject</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Test Type
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={examType}
                    onChange={handleExamTypeChange}
                  >
                    <option value="">Select Test Type</option>
                    <option value="CIE-1">CIE-1</option>
                    <option value="CIE-2">CIE-2</option>
                    <option value="ASSIGNMENT-1">Assignment-1</option>
                    <option value="ASSIGNMENT-2">Assignment-2</option>
                    <option value="ASSIGNMENT-3">Assignment-3</option>
                    <option value="SURPRISE TEST-1">Surprise Test-1</option>
                    <option value="SURPRISE TEST-2">Surprise Test-2</option>
                    <option value="SURPRISE TEST-3">Surprise Test-3</option>
                    <option value="SEE">Semester End Exam</option>
                  </select>
                </div>
              </div>

              {examType && (
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <p className="text-lg text-primary font-semibold">
                    Maximum marks for {examType}: {maxMarks}
                  </p>
                </div>
              )}

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

        {submitted && students.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                  Student Marks
                </h2>
                <div className="flex space-x-4">
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
                  >
                    <FaSave />
                    <span>Save Marks</span>
                  </button>
                </div>
              </div>

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
                        Marks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
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
                            value={student.marks || ""}
                            onChange={(e) =>
                              handleMarksChange(student._id, e.target.value)
                            }
                            min="0"
                            max={maxMarks}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {loading && (
                <div className="mt-4 flex justify-center">
                  <Loader />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
  );
};

export default Marks;
