import React, { useState, useEffect } from "react";
import { FaFileExcel, FaSave, FaUserPlus, FaArrowLeft } from "react-icons/fa";
import * as XLSX from "xlsx";
import Loader from "../utils/Loader";
import { Link, useNavigate } from "react-router-dom";

function PostSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [importStatus, setImportStatus] = useState({
    isProcessing: false,
    message: "",
    type: "",
  });
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
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
          const workSheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(workSheet, { header: 1 });

          let headerRowIndex = -1;
          let nameIndex = -1;
          let branchIndex = -1;
          let yearIndex = -1;
          let semesterIndex = -1;
          let regulationIndex = -1;
          let courseCodeIndex = -1;

          for (let i = 0; i < Math.min(20, rawRows.length); i++) {
            const row = rawRows[i];
            if (!row) continue;

            for (let j = 0; j < row.length; j++) {
              const cellValues = String(row[j] || "").trim();
              const lowerCellValue = cellValues.toLowerCase();

              if (
                lowerCellValue.includes("name") ||
                lowerCellValue.includes("subject") ||
                lowerCellValue.includes("subject name")
              ) {
                nameIndex = j;
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
                lowerCellValue.includes("Year")
              ) {
                yearIndex = j;
              }

              if (
                lowerCellValue.includes("Semester") ||
                lowerCellValue.includes("semester") ||
                lowerCellValue.includes("sem") ||
                lowerCellValue.includes("Sem")
              ) {
                semesterIndex = j;
              }

              if (
                lowerCellValue.includes("Regulation") ||
                lowerCellValue.includes("regulation") ||
                lowerCellValue.includes("reg") ||
                lowerCellValue.includes("Reg")
              ) {
                regulationIndex = j;
              }

              if (
                lowerCellValue.includes("Course Code") ||
                lowerCellValue.includes("course code") ||
                lowerCellValue.includes("cc") ||
                lowerCellValue.includes("CC")
              ) {
                courseCodeIndex = j;
              }
            }

            if (branchIndex !== -1 && nameIndex !== -1) {
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

            const name =
              nameIndex !== -1 ? String(row[nameIndex] || "").trim() : "";
            const branch =
              branchIndex !== -1 ? String(row[branchIndex] || "").trim() : "";
            const year =
              yearIndex !== -1 ? String(row[yearIndex] || "").trim() : "";
            const semester =
              semesterIndex !== -1
                ? String(row[semesterIndex] || "").trim()
                : "";
            const regulation =
              regulationIndex !== -1
                ? String(row[regulationIndex] || "").trim()
                : "";
            const courseCode =
              courseCodeIndex !== -1
                ? String(row[courseCodeIndex] || "").trim()
                : "";

            processedData.push({
              name,
              branch,
              year,
              semester,
              regulation,
              courseCode,
            });
          }

          if (processedData.length === 0) {
            throw new Error("No data found in Excel file");
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
    const nameSet = new Set();

    if (!data || data.length === 0) {
      errors.push("No valid data found in Excel file");
      return { isValid: false, errors, warnings };
    }

    data.forEach((row, index) => {
      const name = row.name;
      const branch = row.branch;
      const year = row.year;
      const semester = row.semester;
      const regulation = row.regulation;
      const courseCode = row.courseCode;

      // Subject Name validation
      if (!name) {
        errors.push(`Row ${index + 1}: Missing Subject Name - required field`);
      } else if (nameSet.has(name)) {
        errors.push(
          `Row ${index + 1}: Duplicate Subject Name "${name}" - must be unique`
        );
      } else {
        nameSet.add(name);
      }

      // Branch validation
      if (!branch) {
        errors.push(`Row ${index + 1}: Missing Branch - required field`);
      } else if (branch !== branch.toUpperCase()) {
        errors.push(`Row ${index + 1}: Branch must be in uppercase`);
      }

      // Year validation
      if (!year) {
        errors.push(`Row ${index + 1}: Missing Year - required field`);
      } else if (
        isNaN(year) ||
        !Number.isInteger(Number(year)) ||
        Number(year) <= 0
      ) {
        errors.push(`Row ${index + 1}: Year must be a positive integer number`);
      } else if (![1, 2, 3, 4].includes(Number(year))) {
        errors.push(`Row ${index + 1}: Year must be 1, 2, 3, or 4`);
      }

      // Semester validation
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
      } else if (![1, 2].includes(Number(semester))) {
        errors.push(`Row ${index + 1}: Semester must be 1 or 2`);
      }

      // Regulation validation
      if (!regulation) {
        errors.push(`Row ${index + 1}: Missing Regulation - required field`);
      } else if (regulation !== regulation.toUpperCase()) {
        errors.push(`Row ${index + 1}: Regulation must be in uppercase`);
      }

      // Course Code validation
      if (!courseCode) {
        errors.push(`Row ${index + 1}: Missing Course Code - required field`);
      } else if (courseCode !== courseCode.toUpperCase()) {
        errors.push(`Row ${index + 1}: Course Code must be in uppercase`);
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

    setSubjects([]);

    try {
      const data = await readExcel(file);
      const { isValid, errors, warnings } = validateExcelData(data);
      setImportWarnings(warnings);

      if (!isValid) {
        setImportErrors(errors);
        throw new Error("Excel file contains validation errors");
      }

      const subjectsToImport = data.map((row) => ({
        name: row.name,
        branch: row.branch.toUpperCase(), // Convert to uppercase
        year: Number(row.year),
        semester: Number(row.semester),
        regulation: row.regulation.toUpperCase(), // Convert to uppercase
        courseCode: row.courseCode.toUpperCase(), // Convert to uppercase
      }));

      const duplicateSubjects = [];
      const newSubjects = [];

      for (const importedSubject of subjectsToImport) {
        // TODO: Change the existing Subject condition
        const existingSubject = subjects.find(
          (subject) =>
            subject.name.toLowerCase() === importedSubject.name.toLowerCase()
        );
        if (existingSubject) {
          duplicateSubjects.push(importedSubject);
        } else {
          newSubjects.push(importedSubject);
        }
      }
      setSubjects(newSubjects);

      let statusMessage = "Subjects imported successfully";
      let statusType = "success";

      if (duplicateSubjects.length > 0) {
        statusMessage = `Subjects imported successfully. Skipped ${duplicateSubjects.length} duplicate subjects`;
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
    setLoading(true);
    const errors = [];
    try {
      if (!Array.isArray(subjects) || subjects.length === 0) {
        errors.push("No subjects to save.");
        setImportErrors(errors);
        return;
      }

      for (const record of subjects) {
        try {
          console.log("Sending subject record:", record);

          const response = await fetch(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects`,
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
            `Failed to save record for subject ${record.name}: ${error.message}`
          );
        }
      }
      if (errors.length === 0) {
        setImportStatus({
          isProcessing: false,
          message: "All subject records saved successfully!",
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
        message: "Failed to save subject records",
        type: "error",
      });
    } finally {
      setLoading(false);
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
          onClick={() => navigate("/admin-dashboard")}
          className="mb-6 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Admin Dashboard
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 ">
            Subjects Records Input
          </h1>
          <p className="text-gray-600">
            Enter and manage subject records efficiently
          </p>
        </div>

        <div className="max-w-7xl flex justify-center">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-1/2 ">
            <div className="p-6 sm:p-8">
              <div className="flex justify-center gap-x-24 items-center mb-4">
                <Link to="/create-subject">
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center space-x-2"
                  >
                    <FaUserPlus />
                    <span>Create Subject</span>
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
            className={`p-4 rounded-lg mb-4 mt-6 ${
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

        {subjects.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                  Subjects Records
                </h2>
                <button
                  onClick={handleSave}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <FaSave />
                  <span>Save Subjects </span>
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
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Regulation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map((subject, index) => (
                      <tr
                        key={subject._id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.branch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.regulation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.courseCode}
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
export default PostSubjects;
