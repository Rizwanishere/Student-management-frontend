import React, { useState, useEffect } from "react";
import { FaFileExcel, FaSave, FaUserPlus, FaArrowLeft } from "react-icons/fa";
import * as XLSX from "xlsx";
import Loader from "../utils/Loader";
import { Link, useNavigate } from "react-router-dom";

function PostStudent() {
  const [students, setStudents] = useState([]);
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [importStatus, setImportStatus] = useState({
    isProcessing: false,
    message: "",
    type: "",
  });
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [loading, setloading] = useState(false);
  const navigate = useNavigate();

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
          let fatherNameIndex = -1;
          let yearIndex = -1;
          let semesterIndex = -1;
          let sectionIndex = -1;
          let branchIndex = -1;

          for (let i = 0; i < Math.min(20, rawRows.length); i++) {
            const row = rawRows[i];
            if (!row) continue;

            for (let j = 0; j < row.length; j++) {
              const cellValue = String(row[j] || "").trim();
              const lowerCellValue = cellValue.toLowerCase();

              if (
                lowerCellValue.includes("roll") ||
                lowerCellValue.includes("rno") ||
                lowerCellValue.includes("reg") ||
                lowerCellValue.includes("id")
              ) {
                rollNumberIndex = j;
              }

              if (
                lowerCellValue.includes("student") ||
                lowerCellValue.includes("Student Name") ||
                lowerCellValue.includes("student name")
              ) {
                nameIndex = j;
              }

              if (
                lowerCellValue.includes("father") ||
                lowerCellValue.includes("Father Name") ||
                lowerCellValue.includes("father name")
              ) {
                fatherNameIndex = j;
              }

              if (
                lowerCellValue.includes("branch") ||
                lowerCellValue.includes("Branch") ||
                lowerCellValue.includes("branch name") ||
                lowerCellValue.includes("branchname") ||
                lowerCellValue.includes("branch name")
              ) {
                branchIndex = j;
              }

              if (
                lowerCellValue.includes("year") ||
                lowerCellValue.includes("Year") ||
                lowerCellValue.includes("current year") ||
                lowerCellValue.includes("currentyear")
              ) {
                yearIndex = j;
              }

              if (
                lowerCellValue.includes("Semester") ||
                lowerCellValue.includes("semester") ||
                lowerCellValue.includes("sem") ||
                lowerCellValue.includes("Sem") ||
                lowerCellValue.includes("currentSemester") ||
                lowerCellValue.includes("currentsemester") ||
                lowerCellValue.includes("current sem")
              ) {
                semesterIndex = j;
              }

              if (
                lowerCellValue.includes("section") ||
                lowerCellValue.includes("Section") ||
                lowerCellValue.includes("sec") ||
                lowerCellValue.includes("Sec")
              ) {
                sectionIndex = j;
              }
            }

            if (rollNumberIndex !== -1 && nameIndex !== -1) {
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
            const fatherName =
              fatherNameIndex !== -1
                ? String(row[fatherNameIndex] || "").trim()
                : "";
            const branchName =
              branchIndex !== -1 ? String(row[branchIndex] || "").trim() : "";
            const year =
              yearIndex !== -1 ? String(row[yearIndex] || "").trim() : "";
            const semester =
              semesterIndex !== -1
                ? String(row[semesterIndex] || "").trim()
                : "";
            const section =
              sectionIndex !== -1 ? String(row[sectionIndex] || "").trim() : "";

            if (!rollNumber) continue;

            processedData.push({
              "Roll Number": rollNumber,
              "Student Name": studentName,
              "Father Name": fatherName,
              "Branch Name": branchName,
              Year: year,
              Semester: semester,
              Section: section,
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

  const validateExcelData = (data) => {
    const errors = [];
    const warnings = [];
    const rollNumberSet = new Set();

    if (!data || data.length === 0) {
      errors.push("No valid data found in Excel file");
      return { isValid: false, errors, warnings };
    }

    data.forEach((row, index) => {
      const rollNo = row["Roll Number"];
      const studentName = row["Student Name"];
      const fatherName = row["Father Name"];
      const branchName = row["Branch Name"];
      const year = row["Year"];
      const semester = row["Semester"];
      const section = row["Section"];

      if (!rollNo) {
        errors.push(`Row ${index + 1}: Missing Roll Number - required field`);
      } else if (rollNumberSet.has(rollNo)) {
        errors.push(
          `Row ${index + 1}: Duplicate Roll Number "${rollNo}" - must be unique`
        );
      } else {
        rollNumberSet.add(rollNo);
      }

      if (!studentName) {
        errors.push(`Row ${index + 1}: Missing Student Name - required field`);
      }

      if (!fatherName) {
        warnings.push(`Row ${index + 1}: Missing Father Name`);
      }

      if (!branchName) {
        errors.push(`Row ${index + 1}: Missing Branch Name - required field`);
      }

      if (!year) {
        errors.push(`Row ${index + 1}: Missing Year - required field`);
      } else if (
        isNaN(year) ||
        !Number.isInteger(Number(year)) ||
        Number(year) <= 0
      ) {
        errors.push(`Row ${index + 1}: Year must be a positive integer number`);
      }

      if (!semester) {
        errors.push(`Row ${index + 1}: Missing Semester - required field`);
      } else if (
        isNaN(semester) ||
        !Number.isInteger(Number(semester)) ||
        Number(semester) <= 0
      ) {
        errors.push(
          `Row ${index + 1}: Semester must be a positive integer number`
        );
      }

      if (!section) {
        errors.push(`Row ${index + 1}: Missing Section - required field`);
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

    setImportErrors([]);
    setImportWarnings([]);
    setImportStatus({
      isProcessing: true,
      message: "Processing Excel file...",
      type: "info",
    });
    // Clear the students state before processing new Excel file
    setStudents([]);

    try {
      const data = await readExcel(file);
      const { isValid, errors, warnings } = validateExcelData(data);
      setImportWarnings(warnings);

      if (!isValid) {
        setImportErrors(errors);
        throw new Error("Excel file contains validation errors");
      }

      const studentsToImport = data.map((row) => ({
        rollNo: row["Roll Number"],
        name: row["Student Name"],
        fatherName: row["Father Name"],
        branch: row["Branch Name"],
        currentYear: Number(row["Year"]),
        currentSemester: Number(row["Semester"]),
        section: row["Section"],
      }));

      const duplicateRollNumbers = [];
      const newStudents = [];

      for (const importedStudent of studentsToImport) {
        const existingStudent = students.find(
          (student) =>
            student.rollNo.toLowerCase() ===
            importedStudent.rollNo.toLowerCase()
        );

        if (existingStudent) {
          duplicateRollNumbers.push(importedStudent.rollNo);
        } else {
          newStudents.push(importedStudent);
        }
      }

      setStudents(newStudents);

      let statusMessage = "Students imported successfully!";
      let statusType = "success";

      if (duplicateRollNumbers.length > 0) {
        statusMessage += ` (${duplicateRollNumbers.length} students with duplicate roll numbers were skipped)`;
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

  const handleSave = async () => {
    setloading(true);
    const errors = [];

    try {
      if (!Array.isArray(students) || students.length === 0) {
        errors.push("No students to save.");
        setImportErrors(errors);
        return;
      }

      for (const record of students) {
        try {
          console.log("Sending student record:", record);

          const response = await fetch(
            `${process.env.REACT_APP_BACKEND_URI}/api/students`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(record),
            }
          );

          if (response.ok) {
            const data = await response.json();
            setSubmittedRecords((prevRecords) => [...prevRecords, data]);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Server response error:", errorData);

            const errorMessage =
              errorData.message || `Status: ${response.status}`;
            errors.push(
              `Error submitting record for roll number ${record.rollNo}: ${errorMessage}`
            );
          }
        } catch (error) {
          console.error("Fetch error:", error);
          errors.push(
            `Failed to save record for roll number ${record.rollNo}: ${error.message}`
          );
        }
      }

      if (errors.length === 0) {
        setImportStatus({
          isProcessing: false,
          message: "All student records saved successfully!",
          type: "success",
        });
      } else {
        setImportErrors(errors);
        setImportStatus({
          isProcessing: false,
          message: "Some records failed to save. Check the errors for details.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("General error:", error);
      errors.push(`Unexpected error: ${error.message}`);
      setImportErrors(errors);
      setImportStatus({
        isProcessing: false,
        message: "Failed to save student records",
        type: "error",
      });
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    if (importStatus.message) {
      const timer = setTimeout(() => {
        setImportStatus((prev) => ({ ...prev, message: "" }));
      }, 5000);

      return () => clearTimeout(timer);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 ">
            Students Records Input
          </h1>
          <p className="text-gray-600">
            Enter and manage student records efficiently
          </p>
        </div>

        <div className="max-w-7xl flex justify-center">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-1/2 ">
            <div className="p-6 sm:p-8">
              <div className="flex justify-center gap-x-24 items-center mb-4">
                <Link to="/createStudent">
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center space-x-2"
                  >
                    <FaUserPlus />
                    <span>Create Student</span>
                  </button>
                </Link>
                <label
                  htmlFor="excel-upload"
                  className="bg-secondary text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center space-x-2"
                >
                  <FaFileExcel />
                  <span>Import Excel</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  id="excel-upload"
                  onChange={handleExcelImport}
                />
              </div>
            </div>
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

        {students.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                  Student Records
                </h2>
                <button
                  onClick={handleSave}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <FaSave />
                  <span>Save Students </span>
                </button>
              </div>

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
                        Father Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.fatherName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.branch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.currentYear}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.currentSemester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.section}
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
    </div>
  );
}

export default PostStudent;
