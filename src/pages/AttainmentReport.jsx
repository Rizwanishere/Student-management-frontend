import React, { useState, useEffect } from "react";
import Loader from "../utils/Loader";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaFileExcel, FaFilePdf, FaSave, FaSearch } from 'react-icons/fa';

const AttainmentReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [examTypes] = useState(["CIE-1", "CIE-2"]); // Limited to just CIE-1 and CIE-2
  const [selectedExamType, setSelectedExamType] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attainmentData, setAttainmentData] = useState([]);

  // Get branch from local storage
  const selectedBranch = localStorage.getItem("selectedBranch") || "";

  // Years and semesters for dropdowns
  const years = ["1", "2", "3", "4"];
  const semesters = ["1", "2"];

  // Fetch subjects when year and semester are selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedYear || !selectedSemester || !selectedBranch) return;

      setLoading(true);
      setError(null);

      try {
        // Make API call to fetch subjects
        const subjectsUrl = `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`;
        console.log("Fetching subjects from:", subjectsUrl);

        const response = await fetch(subjectsUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch subjects (Status: ${response.status})`
          );
        }

        const data = await response.json();
        console.log("Subjects fetched:", data);
        setSubjects(data);

        // Reset selected subject when subjects change
        setSelectedSubject("");
        // Reset student data
        setStudents([]);
        setSelectedExamType("");
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError(err.message);
        setSubjects([]);
        setAttainmentData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch marks data when subject and exam type are selected
  useEffect(() => {
    const fetchMarksData = async () => {
      if (!selectedSubject || !selectedExamType) return;

      setLoading(true);
      setError(null);

      try {
        // Make API call to fetch marks data
        const marksUrl = `${process.env.REACT_APP_BACKEND_URI}/api/marks/attainment/${selectedSubject}/${selectedExamType}`;
        console.log("Fetching marks data from:", marksUrl);

        const response = await fetch(marksUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch marks data (Status: ${response.status})`
          );
        }

        const data = await response.json();
        console.log("Marks data fetched:", data);
        setStudents(data);

        // Fetch attainment data
        const attainmentUrl = `${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/examType/${selectedExamType}`;
        console.log("Fetching attainment data from:", attainmentUrl);

        const attResponse = await fetch(attainmentUrl);

        // if (
        //   !attResponse.attainmentData ||
        //   attResponse.attainmentData.some((co) => co.attainmentLevel == null)
        // ) {
        if (!attResponse.ok) {
          console.log("Attainment data not available, using calculated values");
          setAttainmentData([]);
        } else {
          const attData = await attResponse.json();
          console.log("Attainment data fetched:", attData);

          if (attData && attData.length > 0) {
            setAttainmentData(attData[0].attainmentData || []);
          } else {
            setAttainmentData([]);
          }
        }
      } catch (err) {
        console.error("Error fetching marks data:", err);
        setError(err.message);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarksData();
  }, [selectedSubject, selectedExamType]);

  // Handle year change
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setSelectedSemester("");
    setSelectedSubject("");
    setSelectedExamType("");
    setSubjects([]);
    setStudents([]);
    setAttainmentData([]);
  };

  // Handle semester change
  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    setSelectedSubject("");
    setSelectedExamType("");
    setStudents([]);
    setAttainmentData([]);
  };

  // Get exam title based on selected exam type
  const getExamTitle = () => {
    switch (selectedExamType) {
      case "CIE-1":
        return "CIE-1: Descriptive Test";
      case "CIE-2":
        return "CIE-2: Descriptive Test";
      default:
        return "Exam";
    }
  };

  // Function to get CO numbers from attainment data
  const getCONumbers = () => {
    // If we have attainment data from API, use those CO numbers
    if (attainmentData && attainmentData.length > 0) {
      return attainmentData.map((item) => item.coNo);
    }

    // Fallback to default CO numbers if API data isn't available
    if (selectedExamType === "CIE-1") {
      return ["C211.1", "C211.2", "C211.3"];
    } else if (selectedExamType === "CIE-2") {
      return ["C211.3", "C211.4", "C211.5"];
    }

    return ["C211.1", "C211.2", "C211.3"];
  };

  // Get CO labels based on selected exam type
  const getCOLabels = () => {
    // Get CO numbers from the existing function
    const coNumbers = getCONumbers();
    if (selectedExamType === "CIE-1") {
      return {
        q1: ["CO1", "CO2", "CO3"],
        q2: ["CO1", "CO2", "CO3"],
        q3: ["CO1", "CO2", "CO3"],
        coNumbers: coNumbers, // Use the CO numbers from the API or fallback
      };
    } else if (selectedExamType === "CIE-2") {
      return {
        q1: ["CO3", "CO4", "CO5"],
        q2: ["CO3", "CO4", "CO5"],
        q3: ["CO3", "CO4", "CO5"],
        coNumbers: coNumbers, // Use the CO numbers from the API or fallback
      };
    }
    return {
      q1: ["CO1", "CO2", "CO3"],
      q2: ["CO1", "CO2", "CO3"],
      q3: ["CO1", "CO2", "CO3"],
      coNumbers: coNumbers, // Use the CO numbers from the API or fallback
    };
  };

  // Calculate statistics for a column
  const calculateStats = (dataKey) => {
    if (!students || students.length === 0)
      return {
        attempted: 0,
        secured: 0,
        percentage: 0,
        level: 0,
      };

    // Get values from the relevant column
    let values = [];

    if (dataKey === "Q1") {
      values = students.map((student) => student.internalMarks?.Q1 || 0);
    } else if (dataKey === "Q2") {
      values = students.map((student) => student.internalMarks?.Q2 || 0);
    } else if (dataKey === "Q3") {
      values = students.map((student) => student.internalMarks?.Q3 || 0);
    } else if (dataKey === "saqs") {
      values = students.map((student) => student.internalMarks?.saqs || 0);
    } else if (dataKey === "surprise") {
      values = students.map((student) => student.surpriseTestAverage || 0);
    } else if (dataKey === "assignment") {
      values = students.map((student) => student.assignmentAverage || 0);
    } else if (dataKey === "total") {
      values = students.map((student) => {
        const q1Score = student.internalMarks?.Q1 || 0;
        const q2Score = student.internalMarks?.Q2 || 0;
        const q3Score = student.internalMarks?.Q3 || 0;
        const saqScore = student.internalMarks?.saqs || 0;
        const surpriseScore = student.surpriseTestAverage || 0;
        const assignmentScore = student.assignmentAverage || 0;
        return (
          q1Score +
          q2Score +
          q3Score +
          saqScore +
          surpriseScore +
          assignmentScore
        );
      });
    }

    // Count students who actually attempted (score > 0)
    const attempted = values.filter((value) => value > 0).length;

    // Calculate threshold based on column type
    let threshold = 3.5; // Default threshold for question scores

    if (dataKey === "saqs") {
      threshold = 3; // Threshold for Short Answer Questions
    } else if (dataKey === "surprise") {
      threshold = 5; // Threshold for Surprise Tests
    } else if (dataKey === "assignment") {
      threshold = 5; // Threshold for Assignments
    } else if (dataKey === "total") {
      threshold = 20; // Threshold for total score
    }

    // Calculate statistics
    const secured = values.filter((value) => value >= threshold).length;
    const percentage =
      attempted > 0 ? Math.round((secured / attempted) * 100) : 0;

    // Determine attainment level
    let level = 0;
    if (percentage >= 70) level = 3;
    else if (percentage > 50) level = 2;
    else if (percentage > 0) level = 1;

    return {
      attempted,
      secured,
      percentage,
      level,
    };
  };

  // Calculate CO averages based on selected exam type
  const calculateCOAverages = () => {
    if (students.length === 0) {
      if (selectedExamType === "CIE-2") {
        return { co3: 0, co4: 0, co5: 0 };
      }
      return { co1: 0, co2: 0, co3: 0 };
    }

    // Get individual attainment levels
    const q1Level = calculateStats("Q1").level;
    const q2Level = calculateStats("Q2").level;
    const q3Level = calculateStats("Q3").level;
    const saqLevel = calculateStats("saqs").level;
    const surpriseLevel = calculateStats("surprise").level;
    const assignmentLevel = calculateStats("assignment").level;

    if (selectedExamType === "CIE-2") {
      // Calculate CO3 average (Q1, surprise test, assignment)
      const co3 = ((q1Level + surpriseLevel + assignmentLevel) / 3).toFixed(1);

      // Calculate CO4 average (Q2, surprise test, assignment)
      const co4 = ((q2Level + surpriseLevel + assignmentLevel) / 3).toFixed(1);

      // Calculate CO5 average (Q3, surprise test, assignment)
      const co5 = ((q3Level + surpriseLevel + assignmentLevel) / 3).toFixed(1);

      return { co3, co4, co5 };
    } else {
      // Calculate CO1 average (Q1, surprise test, assignment)
      const co1 = ((q1Level + surpriseLevel + assignmentLevel) / 3).toFixed(1);

      // Calculate CO2 average (Q2, surprise test, assignment)
      const co2 = ((q2Level + surpriseLevel + assignmentLevel) / 3).toFixed(1);

      // Calculate CO3 average (Q3, surprise test, assignment)
      const co3 = ((q3Level + surpriseLevel + assignmentLevel) / 3).toFixed(1);

      return { co1, co2, co3 };
    }
  };

  // Export data to Excel
  const exportToExcel = () => {
    if (students.length === 0) return;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Prepare data array for the main table
    const mainData = [];
    const coLabels = getCOLabels();

    // Headers
    mainData.push([
      "S.No",
      "Roll. No",
      "Name",
      "Q1 (7)",
      "",
      "",
      "Q2 (7)",
      "",
      "",
      "Q3 (7)",
      "",
      "",
      "Short Answer (6)",
      "Surprise Test (10)",
      "Assignment (10)",
      `${selectedExamType} (40)`,
    ]);

    mainData.push([
      "",
      "",
      "",
      coLabels.q1[0],
      coLabels.q1[1],
      coLabels.q1[2],
      coLabels.q2[0],
      coLabels.q2[1],
      coLabels.q2[2],
      coLabels.q3[0],
      coLabels.q3[1],
      coLabels.q3[2],
      "",
      "",
      "",
      "",
    ]);

    // Student data
    students.forEach((student, index) => {
      const q1Score = student.internalMarks?.Q1 || 0;
      const q2Score = student.internalMarks?.Q2 || 0;
      const q3Score = student.internalMarks?.Q3 || 0;
      const saqScore = student.internalMarks?.saqs || 0;
      const surpriseScore = student.surpriseTestAverage || 0;
      const assignmentScore = student.assignmentAverage || 0;

      const totalScore =
        q1Score +
        q2Score +
        q3Score +
        saqScore +
        surpriseScore +
        assignmentScore;

      mainData.push([
        index + 1,
        student.student.rollNo,
        student.student.name,
        q1Score,
        "", // Empty cells for other CO columns
        "",
        "", // Empty cells for other CO columns
        q2Score,
        "",
        "", // Empty cells for other CO columns
        "",
        q3Score,
        saqScore,
        surpriseScore,
        assignmentScore,
        totalScore,
      ]);
    });

    // Add calculation rows
    mainData.push([
      "",
      "",
      "No. of Students Attempted",
      calculateStats("Q1").attempted,
      "",
      "",
      "",
      calculateStats("Q2").attempted,
      "",
      "",
      "",
      calculateStats("Q3").attempted,
      calculateStats("saqs").attempted,
      calculateStats("surprise").attempted,
      calculateStats("assignment").attempted,
      "",
    ]);

    mainData.push([
      "",
      "",
      "No. of Students secured >Threshold marks",
      calculateStats("Q1").secured,
      "",
      "",
      "",
      calculateStats("Q2").secured,
      "",
      "",
      "",
      calculateStats("Q3").secured,
      calculateStats("saqs").secured,
      calculateStats("surprise").secured,
      calculateStats("assignment").secured,
      "",
    ]);

    mainData.push([
      "",
      "",
      "% of Students secured >Threshold marks",
      `${calculateStats("Q1").percentage}%`,
      "",
      "",
      "",
      `${calculateStats("Q2").percentage}%`,
      "",
      "",
      "",
      `${calculateStats("Q3").percentage}%`,
      `${calculateStats("saqs").percentage}%`,
      `${calculateStats("surprise").percentage}%`,
      `${calculateStats("assignment").percentage}%`,
      "",
    ]);

    mainData.push([
      "",
      "",
      "Attainment Level",
      calculateStats("Q1").level,
      "",
      "",
      "",
      calculateStats("Q2").level,
      "",
      "",
      "",
      calculateStats("Q3").level,
      calculateStats("saqs").level,
      calculateStats("surprise").level,
      calculateStats("assignment").level,
      "",
    ]);

    // Add empty row
    mainData.push([]);

    // Add attainments table
    const coAverages = calculateCOAverages();
    mainData.push([`${selectedExamType} ATTAINMENTS`, "", "", "", "", "", ""]);

    if (selectedExamType === "CIE-2") {
      mainData.push([
        "CO AVERAGE",
        coLabels.coNumbers[0],
        coAverages.co3,
        coLabels.coNumbers[1],
        coAverages.co4,
        coLabels.coNumbers[2],
        coAverages.co5,
      ]);
    } else {
      mainData.push([
        "CO AVERAGE",
        coLabels.coNumbers[0],
        coAverages.co1,
        coLabels.coNumbers[1],
        coAverages.co2,
        coLabels.coNumbers[2],
        coAverages.co3,
      ]);
    }

    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(mainData);

    // Set column widths
    const columnWidths = [
      { wch: 5 }, // S.No
      { wch: 10 }, // Roll No
      { wch: 25 }, // Name
      { wch: 8 }, // Q1
      { wch: 8 }, // Empty
      { wch: 8 }, // Empty
      { wch: 8 }, // Empty
      { wch: 8 }, // Q2
      { wch: 8 }, // Empty
      { wch: 8 }, // Empty
      { wch: 8 }, // Empty
      { wch: 8 }, // Q3
      { wch: 12 }, // Short Answer
      { wch: 15 }, // Surprise Test
      { wch: 15 }, // Assignment
      { wch: 12 }, // Total
    ];

    ws["!cols"] = columnWidths;

    // Add styling by merging cells (headers)
    ws["!merges"] = [
      // Merge header cells
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // S.No
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Roll. No
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Name
      { s: { r: 0, c: 3 }, e: { r: 0, c: 5 } }, // Q1 (7)
      { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } }, // Q2 (7)
      { s: { r: 0, c: 9 }, e: { r: 0, c: 11 } }, // Q3 (7)
      { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } }, // Short Answer
      { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } }, // Surprise Test
      { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } }, // Assignment
      { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } }, // Total

      // Attainments header
      {
        s: { r: mainData.length - 2, c: 0 },
        e: { r: mainData.length - 2, c: 6 },
      },
    ];

    XLSX.utils.book_append_sheet(wb, ws, `${selectedExamType} Report`);

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${selectedExamType}_Attainment_Report.xlsx`);
  };

  // Export data to PDF
  const exportToPDF = async () => {
    if (students.length === 0) return;

    // Create a wrapper div to contain both tables for export
    const wrapper = document.createElement("div");
    wrapper.id = "pdf-wrapper";
    wrapper.style.backgroundColor = "#ffffff";
    wrapper.style.padding = "10px";
    wrapper.style.width = "297mm"; // Landscape width
    wrapper.style.maxWidth = "297mm";
    wrapper.style.overflow = "visible";

    // Clone the tables to avoid modifying the original ones
    const tableOriginal = document.getElementById("attainment-table");
    const cieTableOriginal = tableOriginal.nextElementSibling;

    const tableClone = tableOriginal.cloneNode(true);
    tableClone.classList.add("pdf-export");

    // Ensure all table cells have explicit width settings
    tableClone.querySelectorAll("th, td").forEach((cell) => {
      // Add explicit width to cells based on content type
      if (cell.textContent.includes("S.No")) {
        cell.style.width = "40px";
        cell.style.minWidth = "40px";
      } else if (cell.textContent.includes("Roll. No")) {
        cell.style.width = "85px";
        cell.style.minWidth = "85px";
      } else if (cell.textContent.includes("Name")) {
        cell.style.width = "120px";
        cell.style.minWidth = "60px";
      } else if (
        cell.textContent.includes("Short Answer") ||
        cell.textContent.includes("Surprise Test") ||
        cell.textContent.includes("Assignment") ||
        cell.textContent.includes("40")
      ) {
        cell.style.width = "75px";
        cell.style.minWidth = "75px";
      } else {
        cell.style.width = "140px";
        cell.style.minWidth = "140px";
      }
    });

    // Add the first table to the wrapper
    wrapper.appendChild(tableClone);

    // Add spacing between tables
    const spacer = document.createElement("div");
    spacer.style.height = "20px";
    wrapper.appendChild(spacer);

    // Clone and add the CIE ATTAINMENTS table if it exists
    if (cieTableOriginal) {
      const cieTableClone = cieTableOriginal.cloneNode(true);
      cieTableClone.classList.add("pdf-export");

      // Ensure all table cells have explicit width settings
      cieTableClone.querySelectorAll("th, td").forEach((cell) => {
        // Add explicit width to cells based on content type
        if (cell.textContent.includes("S.No")) {
          cell.style.width = "40px";
          cell.style.minWidth = "40px";
        } else if (cell.textContent.includes("Roll. No")) {
          cell.style.width = "85px";
          cell.style.minWidth = "85px";
        } else if (cell.textContent.includes("Name")) {
          cell.style.width = "120px";
          cell.style.minWidth = "60px";
        } else if (
          cell.textContent.includes("Short Answer") ||
          cell.textContent.includes("Surprise Test") ||
          cell.textContent.includes("Assignment") ||
          cell.textContent.includes("40")
        ) {
          cell.style.width = "75px";
          cell.style.minWidth = "75px";
        } else {
          cell.style.width = "140px";
          cell.style.minWidth = "140px";
        }
      });

      wrapper.appendChild(cieTableClone);
    }

    // Fix for table layout and column visibility
    Array.from(wrapper.querySelectorAll("table")).forEach((table) => {
      table.style.width = "277mm"; // Slightly less than A4 landscape width
      table.style.minWidth = "277mm";
      table.style.tableLayout = "fixed"; // Fix layout to ensure headers render correctly

      // Ensure all table headers are visible
      const headers = table.querySelectorAll("th");
      headers.forEach((header) => {
        header.style.backgroundColor = "#e0e0e0";
        header.style.fontWeight = "bold";
        header.style.overflow = "visible";
        header.style.whiteSpace = "normal";
        header.style.height = "auto";
        header.style.minHeight = "40px";
        header.style.position = "relative"; // Ensure headers have a position
        header.style.zIndex = "1"; // Set z-index to ensure visibility
      });
    });

    // Temporarily add the wrapper to the document body for rendering
    document.body.appendChild(wrapper);

    try {
      // PDF generation with better quality and text scaling
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => element.tagName === "IFRAME",
        onclone: (clonedDoc) => {
          // Ensure all headers are explicitly visible before rendering
          clonedDoc.querySelectorAll(".pdf-export th").forEach((header) => {
            header.style.display = "table-cell";
            header.style.visibility = "visible";
            header.style.position = "relative";
            header.style.zIndex = "1";
          });

          // Don't scale the tables as this can cause rendering issues
          clonedDoc.querySelectorAll("table").forEach((table) => {
            table.style.transform = "none";
          });
        },
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
        letterRendering: true,
        allowTaint: true, // Allow tainted canvas to handle all content
        windowWidth: wrapper.scrollWidth,
        windowHeight: wrapper.scrollHeight,
      });

      const imgRatio = canvas.width / canvas.height;
      const orientation = imgRatio >= 1 ? "l" : "p"; // landscape or portrait

      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = orientation === "l" ? 297 : 210;
      const pdfHeight = orientation === "l" ? 210 : 297;
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pdfHeight - margin * 2) {
        const pageContentHeight = pdfHeight - margin * 2;
        const totalPages = Math.ceil(imgHeight / pageContentHeight);

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) pdf.addPage();

          const sourceY = (i * canvas.height) / totalPages;
          const sourceHeight = canvas.height / totalPages;

          const canvasForPage = document.createElement("canvas");
          canvasForPage.width = canvas.width;
          canvasForPage.height = sourceHeight;

          const ctx = canvasForPage.getContext("2d");
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvasForPage.width,
            canvasForPage.height
          );

          const imgData = canvasForPage.toDataURL("image/jpeg", 1.0); // Use maximum quality
          pdf.addImage(
            imgData,
            "JPEG",
            margin,
            margin,
            imgWidth,
            pageContentHeight
          );
        }
      } else {
        const imgData = canvas.toDataURL("image/jpeg", 1.0); // Use maximum quality
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
      }

      pdf.save(`${selectedExamType}_Attainment_Report.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  // Styling for the exported PDF tables
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
      .pdf-export {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-bottom: 20px !important;
        table-layout: fixed !important;
      }
      .pdf-export th, .pdf-export td {
        border: 1px solid #000 !important;
        padding: 8px !important;
        text-align: center !important;
        font-size: 12px !important;
        word-wrap: break-word !important;
        white-space: normal !important;
        overflow: visible !important;
        position: relative !important;
        min-height: 30px !important;
    }
      .pdf-export th {
        background-color: #e0e0e0 !important;
        font-weight: bold !important;
        color: #000 !important;
        display: table-cell !important;
        visibility: visible !important;
        z-index: 10 !important;
      }
      .pdf-export th[rowspan], .pdf-export th[colspan] {
        z-index: 20 !important; /* Higher z-index for spanned cells */
        vertical-align: middle !important;
      }
      .pdf-export tr {
        page-break-inside: avoid !important;
      }
      .pdf-export .text-right {
        text-align: right !important;
      }
      .pdf-export .font-semibold, .pdf-export .font-bold {
        font-weight: bold !important;
      }
      .pdf-export .text-lg, .pdf-export .text-xl {
        font-size: 14px !important;
      }
      .pdf-export .bg-slate-50 {
        background-color: #f1f5f9 !important;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .pdf-export th {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background-color: #e0e0e0 !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Get CO data for display based on exam type
  const coData = getCOLabels();

  // Get attainment value from API data or calculated values
  const getAttainmentValue = (coNumber, index) => {
    // First check if we have this CO in the API data
    if (attainmentData && attainmentData.length > 0) {
      const coData = attainmentData.find((item) => item.coNo === coNumber);
      if (coData && coData.attainmentLevel !== undefined) {
        return coData.attainmentLevel;
      }
    }

    // Fall back to calculated values if API data is not available
    const coAverages = calculateCOAverages();
    console.log("Calculated CO Averages for fallback:", coAverages);

    // For fallback calculation, we need to determine which CO we're dealing with
    const coMapping = {
      "CIE-1": {
        0: "co1",
        1: "co2",
        2: "co3",
      },
      "CIE-2": {
        0: "co3",
        1: "co4",
        2: "co5",
      },
    };

    const examType = selectedExamType || "CIE-1";
    const coKey = coMapping[examType][index];

    if (coKey && coAverages && coAverages[coKey] !== undefined) {
      return coAverages[coKey];
    }

    // If we still don't have a value, debug
    console.log(
      `No value found for CO: ${coNumber}, index: ${index}, examType: ${examType}`
    );
    return "N/A"; // Return a placeholder instead of 0 to make it clear this is missing
  };

  // Updating the attainmentLevels bottom table with existing coNo present in the attainments api
  const saveCalculatedAttainments = async () => {
    // Get CO numbers for the current exam type
    const coNumbers = getCONumbers();

    // Calculate attainment levels for each CO
    const coAverages = calculateCOAverages();

    // Map the CO averages to the format expected by the API
    const attainmentUpdates = coNumbers.map((coNumber, index) => {
      let attainmentLevel;

      if (selectedExamType === "CIE-2") {
        if (index === 0) attainmentLevel = coAverages.co3;
        else if (index === 1) attainmentLevel = coAverages.co4;
        else if (index === 2) attainmentLevel = coAverages.co5;
      } else {
        if (index === 0) attainmentLevel = coAverages.co1;
        else if (index === 1) attainmentLevel = coAverages.co2;
        else if (index === 2) attainmentLevel = coAverages.co3;
      }

      return {
        coNo: coNumber,
        attainmentLevel: attainmentLevel || 2,
      };
    });

    console.log("Saving calculated attainment values:", attainmentUpdates);

    try {
      const attainmentUrl = `${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/examType/${selectedExamType}`;

      const response = await fetch(attainmentUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attainmentUpdates }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save attainment data: ${response.status}`);
      }

      const result = await response.json();
      console.log("Attainment data saved successfully:", result);

      // Update local state with the newly saved data
      setAttainmentData(attainmentUpdates);
    } catch (error) {
      console.error("Error saving attainment data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 -mx-8 -mt-8 px-8 py-6 mb-8">
              <h2 className="text-2xl font-bold text-white text-center">CO Attainment</h2>
              {selectedExamType && (
                <div className="text-center font-semibold text-white mt-2">{getExamTitle()}</div>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  value={selectedYear}
                  onChange={handleYearChange}
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Semester</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  value={selectedSemester}
                  onChange={handleSemesterChange}
                  disabled={!selectedYear}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedExamType("");
                    setStudents([]);
                    setAttainmentData([]);
                  }}
                  disabled={subjects.length === 0}
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
                <label className="block text-sm font-medium text-gray-700">Exam Type</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  value={selectedExamType}
                  onChange={(e) => {
                    setSelectedExamType(e.target.value);
                    setAttainmentData([]);
                  }}
                  disabled={!selectedSubject}
                >
                  <option value="">Select Exam</option>
                  {examTypes.map((examType) => (
                    <option key={examType} value={examType}>
                      {examType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center my-8">
                <Loader />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && selectedExamType && students.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 justify-end">
                  <button
                    onClick={exportToExcel}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all duration-300"
                  >
                    <FaFileExcel className="mr-2" />
                    Export to Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-semibold shadow-md hover:bg-red-700 transition-all duration-300"
                  >
                    <FaFilePdf className="mr-2" />
                    Export to PDF
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table id="attainment-table" className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th rowSpan="2" className="border px-2 py-1 text-center">
                            S.No
                          </th>
                          <th rowSpan="2" className="border px-2 py-1 text-center">
                            Roll. No
                          </th>
                          <th rowSpan="2" className="border px-2 py-1 text-center">
                            Name
                          </th>
                          <th colSpan="3" className="border px-2 py-1 text-center">
                            Q1 (7)
                          </th>
                          <th colSpan="3" className="border px-2 py-1 text-center">
                            Q2 (7)
                          </th>
                          <th colSpan="3" className="border px-2 py-1 text-center">
                            Q3 (7)
                          </th>
                          <th rowSpan="2" className="border px-2 py-1 text-center">
                            Short Answer (6)
                          </th>
                          <th rowSpan="2" className="border px-2 py-1 text-center">
                            Surprise Test (10)
                          </th>
                          <th rowSpan="2" className="border px-2 py-1 text-center">
                            Assignment (10)
                          </th>
                          <th rowSpan="2" className="border px-2 py-1 text-center">
                            {selectedExamType} (40)
                          </th>
                        </tr>
                        <tr className="bg-slate-50">
                          <th className="border px-2 py-1 text-center">
                            {coData.q1[0]}
                          </th>
                          <th className="border px-2 py-1 text-center">
                            {coData.q1[1]}
                          </th>
                          <th className="border px-2 py-1 text-center">
                            {coData.q1[2]}
                          </th>
                          <th className="border px-2 py-1 text-center">
                            {coData.q2[0]}
                          </th>
                          <th className="border px-2 py-1 text-center">
                            {coData.q2[1]}
                          </th>
                          <th className="border px-2 py-1 text-center">
                            {coData.q2[2]}
                          </th>
                          <th className="border px-2 py-1 text-center">
                            {coData.q3[0]}
                          </th>
                          <th className="border px-2 py-1 text-center">
                            {coData.q3[1]}
                          </th>
                          <th className="border px-2 py-1 text-center">
                            {coData.q3[2]}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length > 0 ? (
                          students.map((student, index) => {
                            // Calculate the total score
                            const q1Score = student.internalMarks?.Q1 || 0;
                            const q2Score = student.internalMarks?.Q2 || 0;
                            const q3Score = student.internalMarks?.Q3 || 0;
                            const saqScore = student.internalMarks?.saqs || 0;
                            const surpriseScore = student.surpriseTestAverage || 0;
                            const assignmentScore = student.assignmentAverage || 0;

                            const totalScore =
                              q1Score +
                              q2Score +
                              q3Score +
                              saqScore +
                              surpriseScore +
                              assignmentScore;

                            return (
                              <tr key={student.student.id}>
                                <td className="border px-2 py-1 text-center">
                                  {index + 1}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {student.student.rollNo}
                                </td>
                                <td className="border px-2 py-1">
                                  {student.student.name}
                                </td>

                                {/* Q1 CO scores */}
                                <td className="border px-2 py-1 text-center">
                                  {q1Score || 0}
                                </td>
                                <td className="border px-2 py-1 text-center"></td>
                                <td className="border px-2 py-1 text-center"></td>

                                {/* Q2 CO scores */}
                                <td className="border px-2 py-1 text-center"></td>
                                <td className="border px-2 py-1 text-center">
                                  {q2Score || 0}
                                </td>
                                <td className="border px-2 py-1 text-center"></td>

                                {/* Q3 CO scores */}
                                <td className="border px-2 py-1 text-center"></td>
                                <td className="border px-2 py-1 text-center"></td>
                                <td className="border px-2 py-1 text-center">
                                  {q3Score || 0}
                                </td>

                                {/* Other scores */}
                                <td className="border px-2 py-1 text-center">
                                  {saqScore || 0}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {surpriseScore || 0}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {assignmentScore || 0}
                                </td>

                                {/* Total */}
                                <td className="border px-2 py-1 text-center font-bold">
                                  {totalScore}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="17" className="border px-4 py-4 text-center">
                              {selectedYear &&
                              selectedSemester &&
                              selectedSubject &&
                              selectedExamType
                                ? "No data found"
                                : "Please select all criteria to view data"}
                            </td>
                          </tr>
                        )}

                        {/* Calculation Rows */}
                        {students.length > 0 && (
                          <>
                            {/* No. of Students Attempted */}
                            <tr className="bg-slate-50">
                              <td
                                colSpan="3"
                                className="border px-2 py-1 text-right font-semibold"
                              >
                                No. of Students Attempted
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q1").attempted}
                              </td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q2").attempted}
                              </td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q3").attempted}
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("saqs").attempted}
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("surprise").attempted}
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("assignment").attempted}
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {/* {calculateStats("total").attempted} */}
                              </td>
                            </tr>

                            {/* No. of Students secured >Threshold marks */}
                            <tr>
                              <td
                                colSpan="3"
                                className="border px-2 py-1 text-right font-semibold"
                              >
                                No. of Students secured &gt;Threshold marks
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q1").secured}
                              </td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q2").secured}
                              </td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q3").secured}
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("saqs").secured}
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("surprise").secured}
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("assignment").secured}
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {/* {calculateStats("total").secured} */}
                              </td>
                            </tr>

                            {/* % of Students secured >Threshold marks */}
                            <tr className="bg-slate-50">
                              <td
                                colSpan="3"
                                className="border px-2 py-1 text-right font-semibold"
                              >
                                % of Students secured &gt;Threshold marks
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q1").percentage}%
                              </td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q2").percentage}%
                              </td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q3").percentage}%
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("saqs").percentage}%
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("surprise").percentage}%
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("assignment").percentage}%
                              </td>
                              <td className="border px-2 py-1 text-center">
                                {/* {calculateStats("total").percentage}% */}
                              </td>
                            </tr>

                            {/* Attainment Level */}
                            <tr>
                              <td
                                colSpan="3"
                                className="border px-2 py-1 text-right font-semibold"
                              >
                                Attainment Level
                              </td>
                              <td className="border px-2 py-1 text-center font-bold">
                                {calculateStats("Q1").level}
                              </td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center font-bold">
                                {calculateStats("Q2").level}
                              </td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center"></td>
                              <td className="border px-2 py-1 text-center font-bold"></td>
                              <td className="border px-2 py-1 text-center">
                                {calculateStats("Q3").level}
                              </td>
                              <td className="border px-2 py-1 text-center font-bold">
                                {calculateStats("saqs").level}
                              </td>
                              <td className="border px-2 py-1 text-center font-bold">
                                {calculateStats("surprise").level}
                              </td>
                              <td className="border px-2 py-1 text-center font-bold">
                                {calculateStats("assignment").level}
                              </td>
                              <td className="border px-2 py-1 text-center font-bold">
                                {/* {calculateStats("total").level} */}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>

                    {/* CIE Attainments Table */}
                    {students.length > 0 && (
                      <table className="w-full border-collapse mt-6">
                        <thead>
                          <tr className="bg-slate-50">
                            <th
                              colSpan="7"
                              className="border px-2 py-2 text-center font-bold text-lg"
                            >
                              {selectedExamType} ATTAINMENTS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              className="border px-2 py-2 text-center font-semibold bg-slate-50"
                              style={{ width: "25%" }}
                            >
                              CO AVERAGE
                            </td>
                            {getCONumbers().map((coNumber, index) => (
                              <React.Fragment key={index}>
                                <td
                                  className="border px-2 py-2 text-center font-semibold"
                                  style={{ width: "12.5%" }}
                                >
                                  {coNumber}
                                </td>
                                <td
                                  className="border px-2 py-2 text-center font-bold text-xl"
                                  style={{ width: "12.5%" }}
                                >
                                  {getAttainmentValue(coNumber, index)}
                                </td>
                              </React.Fragment>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {students.length > 0 && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={saveCalculatedAttainments}
                      className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-all duration-300"
                    >
                      <FaSave className="mr-2" />
                      Save Attainments
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttainmentReport;
