
import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const Marks = () => {
  const [submitted, setSubmitted] = useState(false);
  const [examType, setExamType] = useState("");
  const [maxMarks, setMaxMarks] = useState(0);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [students, setStudents] = useState([]);

  const selectedBranch = localStorage.getItem("selectedBranch");

  const [marksData, setMarksData] = useState([]);
  const [importStatus, setImportStatus] = useState({
    isProcessing: false,
    message: "",
    type: "",
  });
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);

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

  // Fetch students based on the selected subject, year, semester, and section
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedSubject && examType) {
        try {
          // Fetch students based on selected criteria
          const studentsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?branch=${selectedBranch}&year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}&subjectId=${selectedSubject}`
          );

          // Fetch marks for the students
          const marksResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}`
          );

          // Map marks to the corresponding students
          const studentsWithMarks = studentsResponse.data.map((student) => {
            const markEntry = marksResponse.data.find(
              (mark) => mark.student._id === student._id
            );
            return {
              ...student,
              marks: markEntry ? markEntry.marks : "", // Set marks if available, else empty
            };
          });

          setStudents(studentsWithMarks);
          
          // Initialize marksData from fetched students with marks
          const initialMarksData = studentsWithMarks.map(student => ({
            student: student._id,
            subject: selectedSubject,
            marks: student.marks || ""
          }));
          setMarksData(initialMarksData);
          
        } catch (error) {
          console.error("Error fetching students or marks:", error);
        }
      }
    };
    // Fetch students when the subject changes
    fetchStudents();
  }, [
    selectedSubject,
    selectedYear,
    selectedSemester,
    selectedSection,
    examType,
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

    // Set max marks based on exam type (included SEE)
    if (selectedExamType === "CIE-1" || selectedExamType === "CIE-2") {
      setMaxMarks(20);
    } else {
      setMaxMarks(10);
    }
  };

  // Handle marks input change and ensure it doesn't exceed max marks
  const handleMarksChange = (studentId, value) => {
    const numValue = Number(value);
    
    if (numValue <= maxMarks) {
      setMarksData(prevData => {
        const existingIndex = prevData.findIndex(
          record => record.student === studentId && record.subject === selectedSubject
        );

        const newData = [...prevData];
        
        if (existingIndex !== -1) {
          newData[existingIndex] = {
            ...newData[existingIndex],
            marks: value
          };
        } else {
          newData.push({
            student: studentId,
            subject: selectedSubject,
            marks: value
          });
        }

        return newData;
      });
      
      // Also update the marks in the students array for display
      const updatedStudents = students.map(student => {
        if (student._id === studentId) {
          return { ...student, marks: value };
        }
        return student;
      });
      setStudents(updatedStudents);
    } else {
      alert(`Marks cannot exceed the maximum of ${maxMarks}`);
    }
  };

  // Read Excel file
  // Read Excel file with enhanced exam type handling
// const readExcel = (file) => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const data = e.target.result;
//         const workbook = XLSX.read(data, { type: "array" });
        
//         if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
//           throw new Error("Excel file contains no sheets");
//         }

//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//         // Flexible header detection
//         let headerRowIndex = -1;
//         let rollNumberIndex = -1;
//         let nameIndex = -1;
//         let marksIndex = -1;

//         // Search for header row with our required columns
//         for (let i = 0; i < Math.min(20, rawRows.length); i++) {
//           const row = rawRows[i];
//           if (!row) continue;

//           // Check each cell for our column indicators
//           for (let j = 0; j < row.length; j++) {
//             const cellValue = String(row[j] || '').toLowerCase().trim();
            
//             // Roll number detection (multiple possible headers)
//             if (cellValue.includes('roll') || cellValue.includes('rno') || 
//                 cellValue.includes('reg') || cellValue.includes('id')) {
//               rollNumberIndex = j;
//             }
            
//             // Name detection
//             if (cellValue.includes('name') || cellValue.includes('student')) {
//               nameIndex = j;
//             }
            
//             // Marks detection based on exam type
//             if (examType === 'CIE-1' && 
//                 (cellValue.includes('cie-1') || cellValue.includes('cie1') || 
//                  cellValue.includes('internal 1') || cellValue.includes('internal1'))) {
//               marksIndex = j;
//             } 
//             else if (examType === 'CIE-2' && 
//                      (cellValue.includes('cie-2') || cellValue.includes('cie2') || 
//                       cellValue.includes('internal 2') || cellValue.includes('internal2'))) {
//               marksIndex = j;
//             } 
//             else if ((examType === 'ASSIGNMENT-1' || examType === 'ASSIGNMENT-2' || examType === 'ASSIGNMENT-3') && 
//                      (cellValue.includes('assignment') || cellValue.includes('assign') || 
//                      cellValue.includes('assgn') || cellValue.includes('hw'))) {
//               // Check for specific assignment numbers if needed
//               if (examType === 'ASSIGNMENT-1' && 
//                   (cellValue.includes('1') || cellValue.includes('one') || cellValue.includes('first'))) {
//                 marksIndex = j;
//               }
//               else if (examType === 'ASSIGNMENT-2' && 
//                       (cellValue.includes('2') || cellValue.includes('two') || cellValue.includes('second'))) {
//                 marksIndex = j;
//               }
//               else if (examType === 'ASSIGNMENT-3' && 
//                       (cellValue.includes('3') || cellValue.includes('three') || cellValue.includes('third'))) {
//                 marksIndex = j;
//               }
//               // Fallback if no specific assignment number is found
//               else if (marksIndex === -1) {
//                 marksIndex = j;
//               }
//             } 
//             else if ((examType === 'SURPRISE TEST-1' || examType === 'SURPRISE TEST-2' || examType === 'SURPRISE TEST-3') && 
//                      (cellValue.includes('surprise') || cellValue.includes('test') || 
//                       cellValue.includes('quiz') || cellValue.includes('st'))) {
//               // Check for specific test numbers if needed
//               if (examType === 'SURPRISE TEST-1' && 
//                   (cellValue.includes('1') || cellValue.includes('one') || cellValue.includes('first'))) {
//                 marksIndex = j;
//               }
//               else if (examType === 'SURPRISE TEST-2' && 
//                       (cellValue.includes('2') || cellValue.includes('two') || cellValue.includes('second'))) {
//                 marksIndex = j;
//               }
//               else if (examType === 'SURPRISE TEST-3' && 
//                       (cellValue.includes('3') || cellValue.includes('three') || cellValue.includes('third'))) {
//                 marksIndex = j;
//               }
//               // Fallback if no specific test number is found
//               else if (marksIndex === -1) {
//                 marksIndex = j;
//               }
//             } 
//             else if (examType === 'SEE' && 
//                      (cellValue.includes('see') || cellValue.includes('semester') || 
//                       cellValue.includes('end') || cellValue.includes('external'))) {
//               marksIndex = j;
//             } 
//             // Fallback for any marks column
//             else if (cellValue.includes('marks') || cellValue.includes('score') || 
//                      cellValue.includes('grade') || cellValue.includes('result')) {
//               marksIndex = j;
//             }
//           }

//           // If we found at least roll number and marks columns, this is our header row
//           if (rollNumberIndex !== -1 && marksIndex !== -1) {
//             headerRowIndex = i;
//             break;
//           }
//         }

//         if (headerRowIndex === -1) {
//           throw new Error("Could not find valid header row with required columns");
//         }

//         // Process data rows
//         const processedData = [];
//         for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
//           const row = rawRows[i];
//           if (!row || row.length === 0) continue;

//           const rollNumber = rollNumberIndex !== -1 ? String(row[rollNumberIndex] || '').trim() : '';
//           const studentName = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
//           let marks = marksIndex !== -1 ? row[marksIndex] : '';

//           // Convert marks to number if it's a string
//           if (typeof marks === 'string') {
//             marks = marks.trim();
//             // Handle percentage values (e.g., "80%")
//             if (marks.endsWith('%')) {
//               marks = parseFloat(marks) / 100 * maxMarks;
//             }
//             // Handle fraction values (e.g., "15/20")
//             else if (marks.includes('/')) {
//               const [numerator, denominator] = marks.split('/').map(Number);
//               if (!isNaN(numerator) {
//                 marks = denominator ? (numerator / denominator * maxMarks) : numerator;
//               }
//             }
//             // Convert to number
//             marks = parseFloat(marks);
//           }

//           // Skip rows with empty roll numbers
//           if (!rollNumber) continue;

//           processedData.push({
//             "Roll Number": rollNumber,
//             "Student Name": studentName,
//             "Marks": marks
//           });
//         }

//         if (processedData.length === 0) {
//           throw new Error("No valid marks data found in Excel");
//         }

//         resolve(processedData);
//       } catch (error) {
//         reject(error);
//       }
//     };
//     reader.onerror = (error) => reject(error);
//     reader.readAsArrayBuffer(file);
//   });
// };

// // Enhanced validation for all exam types
// const validateExcelData = (data) => {
//   const errors = [];
//   const warnings = [];
  
//   if (!data || data.length === 0) {
//     errors.push("No valid data found in Excel file");
//     return { isValid: false, errors, warnings };
//   }

//   // Set max marks based on exam type
//   let maxAllowedMarks;
//   switch(examType) {
//     case 'CIE-1':
//     case 'CIE-2':
//       maxAllowedMarks = 20;
//       break;
//     case 'ASSIGNMENT-1':
//     case 'ASSIGNMENT-2':
//     case 'ASSIGNMENT-3':
//       maxAllowedMarks = 10; // Assuming assignments are out of 10
//       break;
//     case 'SURPRISE TEST-1':
//     case 'SURPRISE TEST-2':
//     case 'SURPRISE TEST-3':
//       maxAllowedMarks = 10; // Assuming surprise tests are out of 10
//       break;
//     case 'SEE':
//       maxAllowedMarks = 100; // Assuming SEE is out of 100
//       break;
//     default:
//       maxAllowedMarks = maxMarks; // Fallback to component's maxMarks
//   }

//   // Validate each row
//   data.forEach((row, index) => {
//     const rollNo = row["Roll Number"];
//     let marks = row["Marks"];

//     if (!rollNo) {
//       warnings.push(`Row ${index + 1}: Missing Roll Number - skipped`);
//       return; // Skip further validation for this row
//     }

//     if (marks === undefined || marks === null || marks === '') {
//       warnings.push(`Row ${index + 1}: Missing marks for ${rollNo}`);
//     } 
//     else if (isNaN(Number(marks))) {
//       errors.push(`Row ${index + 1}: Invalid marks value "${marks}" for ${rollNo}`);
//     } 
//     else {
//       const numericMarks = Number(marks);
//       if (numericMarks < 0) {
//         errors.push(`Row ${index + 1}: Negative marks value ${marks} for ${rollNo}`);
//       } 
//       else if (numericMarks > maxAllowedMarks) {
//         errors.push(`Row ${index + 1}: Marks value ${marks} exceeds maximum of ${maxAllowedMarks} for ${rollNo}`);
//       }
//     }
//   });

//   return { 
//     isValid: errors.length === 0, 
//     errors,
//     warnings
//   };
// };

// Read Excel file with enhanced exam type handling
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
        let marksIndex = -1;

        // Search for header row with our required columns
        for (let i = 0; i < Math.min(20, rawRows.length); i++) {
          const row = rawRows[i];
          if (!row) continue;

          // Check each cell for our column indicators
          for (let j = 0; j < row.length; j++) {
            const cellValue = String(row[j] || '').trim();
            const lowerCellValue = cellValue.toLowerCase();
            
            // Roll number detection (multiple possible headers)
            if (lowerCellValue.includes('roll') || lowerCellValue.includes('rno') || 
                lowerCellValue.includes('reg') || lowerCellValue.includes('id')) {
              rollNumberIndex = j;
            }
            
            // Name detection
            if (lowerCellValue.includes('name') || lowerCellValue.includes('student')) {
              nameIndex = j;
            }
            
            // Marks detection based on exam type
            if (examType === 'CIE-1' && 
                (cellValue === 'CIE-1' || lowerCellValue.includes('cie1') || lowerCellValue.includes('internal 1'))) {
              marksIndex = j;
            } 
            else if (examType === 'CIE-2' && 
                     (cellValue === 'CIE-2' || lowerCellValue.includes('cie2') || lowerCellValue.includes('internal 2'))) {
              marksIndex = j;
            } 
            else if (examType.startsWith('ASSIGNMENT') && 
                     (cellValue === 'AT' || lowerCellValue.includes('assignment') || 
                      lowerCellValue.includes('at'))) {
              // For assignments, we'll take the first AT column we find
              // If you need specific assignments (1,2,3), you'll need to modify this
              marksIndex = j;
            } 
            else if (examType.startsWith('SURPRISE TEST') && 
                     (cellValue === 'ST' || lowerCellValue.includes('surprise') || 
                      lowerCellValue.includes('test') || lowerCellValue.includes('st'))) {
              // For surprise tests, we'll take the first ST column we find
              // If you need specific tests (1,2,3), you'll need to modify this
              marksIndex = j;
            } 
            else if (examType === 'SEE' && 
                     (lowerCellValue.includes('see') || lowerCellValue.includes('semester') || 
                      lowerCellValue.includes('end') || lowerCellValue.includes('external'))) {
              marksIndex = j;
            } 
            // Fallback for any marks column
            else if (lowerCellValue.includes('marks') || lowerCellValue.includes('score') || 
                     lowerCellValue.includes('grade') || lowerCellValue.includes('result')) {
              marksIndex = j;
            }
          }

          // If we found at least roll number and marks columns, this is our header row
          if (rollNumberIndex !== -1 && marksIndex !== -1) {
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
          if (!row || row.length === 0) continue;

          const rollNumber = rollNumberIndex !== -1 ? String(row[rollNumberIndex] || '').trim() : '';
          const studentName = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
          let marks = marksIndex !== -1 ? row[marksIndex] : '';

          // Convert marks to number if it's a string
          if (typeof marks === 'string') {
            marks = marks.trim();
            // Handle empty strings
            if (marks === '') marks = null;
            else marks = parseFloat(marks);
          }

          // Skip rows with empty roll numbers
          if (!rollNumber) continue;

          processedData.push({
            "Roll Number": rollNumber,
            "Student Name": studentName,
            "Marks": isNaN(marks) ? null : marks
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

// Enhanced validation for all exam types
const validateExcelData = (data) => {
  const errors = [];
  const warnings = [];
  
  if (!data || data.length === 0) {
    errors.push("No valid data found in Excel file");
    return { isValid: false, errors, warnings };
  }

  // Set max marks based on exam type
  let maxAllowedMarks;
  switch(examType) {
    case 'CIE-1':
    case 'CIE-2':
      maxAllowedMarks = 20;
      break;
    case 'ASSIGNMENT-1':
    case 'ASSIGNMENT-2':
    case 'ASSIGNMENT-3':
      maxAllowedMarks = 10; // Assuming assignments are out of 10
      break;
    case 'SURPRISE TEST-1':
    case 'SURPRISE TEST-2':
    case 'SURPRISE TEST-3':
      maxAllowedMarks = 10; // Assuming surprise tests are out of 10
      break;
    case 'SEE':
      maxAllowedMarks = 10; // Assuming SEE is out of 100
      break;
    default:
      maxAllowedMarks = maxMarks; // Fallback to component's maxMarks
  }

  // Validate each row
  data.forEach((row, index) => {
    const rollNo = row["Roll Number"];
    let marks = row["Marks"];

    if (!rollNo) {
      warnings.push(`Row ${index + 1}: Missing Roll Number - skipped`);
      return; // Skip further validation for this row
    }

    if (marks === undefined || marks === null || marks === '') {
      warnings.push(`Row ${index + 1}: Missing marks for ${rollNo}`);
    } 
    else if (isNaN(Number(marks))) {
      errors.push(`Row ${index + 1}: Invalid marks value "${marks}" for ${rollNo}`);
    } 
    else {
      const numericMarks = Number(marks);
      if (numericMarks < 0) {
        errors.push(`Row ${index + 1}: Negative marks value ${marks} for ${rollNo}`);
      } 
      else if (numericMarks > maxAllowedMarks) {
        errors.push(`Row ${index + 1}: Marks value ${marks} exceeds maximum of ${maxAllowedMarks} for ${rollNo}`);
      }
    }
  });

  return { 
    isValid: errors.length === 0, 
    errors,
    warnings
  };
};

  // Handle Excel import
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
      const newMarksData = students.map(student => {
        // Case-insensitive comparison
        const excelRow = data.find(row => 
          row["Roll Number"].toLowerCase() === student.rollNo.toLowerCase()
        );

        if (excelRow) {
          return {
            student: student._id,
            subject: selectedSubject,
            marks: excelRow["Marks"]?.toString() || ""
          };
        } else {
          unmatchedRollNumbers.push(student.rollNo);
          const existingRecord = marksData.find(
            record => record.student === student._id && record.subject === selectedSubject
          );
          return existingRecord || {
            student: student._id,
            subject: selectedSubject,
            marks: ""
          };
        }
      });

      setMarksData(newMarksData);
      
      // Update student marks display
      const updatedStudents = students.map(student => {
        const markRecord = newMarksData.find(record => record.student === student._id);
        return {
          ...student,
          marks: markRecord ? markRecord.marks : ""
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

  // Handle Save Marks
  const handleSave = async () => {
    try {
      for (let student of students) {
        const { _id, marks } = student;

        // Skip if no marks value
        if (marks === undefined || marks === null || marks === "") continue;

        try {
          // Check if marks entry exists
          const existingMarkEntry = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}`
          );

          const markEntryToUpdate = existingMarkEntry.data.find(
            (mark) => mark.student._id === _id
          );

          if (markEntryToUpdate) {
            // Update existing marks
            await axios.put(
              `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}/${markEntryToUpdate._id}`,
              {
                student: _id,
                subject: selectedSubject,
                examType: examType,
                marks: marks,
                maxMarks: maxMarks,
                regulation: selectedRegulation,
                year: selectedYear,
                semester: selectedSemester,
                section: selectedSection,
              }
            );
          } else {
            // Create new marks entry
            await axios.post(
              `${process.env.REACT_APP_BACKEND_URI}/api/marks`,
              {
                student: _id,
                subject: selectedSubject,
                examType: examType,
                marks: marks,
                maxMarks: maxMarks,
                regulation: selectedRegulation,
                year: selectedYear,
                semester: selectedSemester,
                section: selectedSection,
              }
            );
          }
        } catch (error) {
          console.error(`Error saving marks for student ${_id}:`, error);
        }
      }
      alert("Marks saved successfully");
    } catch (error) {
      console.error("Error saving marks:", error);
      alert("Failed to save marks");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <form
        className="bg-white shadow-lg rounded-lg p-6 mb-8 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl tracking-tigher font-semibold mb-4">
          Marks Entry
        </h2>

        {/* Dropdowns for selecting criteria */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Static Year Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          {/* Static Semester Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>

          {/* Static Section Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          {/* Static Regulation Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedRegulation}
            onChange={(e) => setSelectedRegulation(e.target.value)}
          >
            <option value="">Select Regulation</option>
            <option value="LR21">LR21</option>
            <option value="LR22">LR22</option>
            <option value="LR23">LR23</option>
          </select>

          {/* Subject Dropdown (dynamically populated) */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjectOptions.length > 0 ? (
              subjectOptions.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No subjects available
              </option>
            )}
          </select>

          {/* Static Exam Type Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
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

        {/* Max Marks Display */}
        {examType && (
          <div className="flex justify-center">
            <p className="mt-3 text-lg text-blue-700 transition-all transition-smooth tracking-tight flex gap-x-1">
              The maximum marks for{" "}
              <span className="text-blue-800 font-semibold">{examType}</span> is
              <span className="text-blue-800 text-xl font-semibold">
                {maxMarks}.
              </span>
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          className="mt-4 px-4 w-32 h-8 text-center bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enter
        </button>
      </form>

      {submitted && students.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-6xl">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Marks Table</h3>
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
              <div
                className={`p-4 rounded ${
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
                  <th className="border px-4 py-2">Marks ({maxMarks} Max)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  return (
                    <tr key={student._id}>
                      <td className="border px-4 py-2">{index + 1}</td>
                      <td className="border px-4 py-2">{student.rollNo}</td>
                      <td className="border px-4 py-2">{student.name}</td>
                      <td className="border px-4 py-2">
                        <input
                          type="number"
                          className="border p-2 rounded w-full text-center"
                          value={student.marks || ""}
                          onChange={(e) => handleMarksChange(student._id, e.target.value)}
                          min="0"
                          max={maxMarks}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              onClick={handleSave}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Marks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marks;