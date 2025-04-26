import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Loader from "../utils/Loader";
import {
  FaPlus,
  FaMinus,
  FaDownload,
  FaSave,
  FaTrash,
  FaTable,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CourseOutcome = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [coPOMatrix, setCOPOMatrix] = useState([]);
  const [showTables, setShowTables] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [customRegulation, setCustomRegulation] = useState("");
  const [showCustomRegulation, setShowCustomRegulation] = useState(false);
  const selectedBranch = localStorage.getItem("selectedBranch") || "";

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

  // Fetch subjects when year or semester changes
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
      setLoading(true);
      try {
        const regulationValue = showCustomRegulation
          ? customRegulation
          : selectedRegulation;
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}/regulation/${regulationValue}`
        );
        setSubjectOptions(response.data || []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjectOptions([]);
      }
      setLoading(false);
    };

    fetchSubjects();
    // Reset selections when year/semester changes
    setSelectedSubject("");
    setCourseOutcomes([]);
    setCOPOMatrix([]);
    setShowTables(false);
  }, [
    selectedYear,
    selectedSemester,
    selectedBranch,
    selectedRegulation,
    customRegulation,
    showCustomRegulation,
  ]);

  // Fetch course outcomes and CO-PO matrix when subject changes
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!selectedSubject) return;

      setLoading(true);
      try {
        // Fetch course outcomes
        const coResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/co/course-outcomes/${selectedSubject}`
        );

        const outcomes = coResponse.data || [];
        setCourseOutcomes(outcomes);

        // Fetch CO-PO matrix data
        const copoResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/co/copo-matrix/${selectedSubject}`
        );

        // If we have outcomes but no matrix data, initialize empty matrix
        if (
          outcomes.length > 0 &&
          (!copoResponse.data || copoResponse.data.length === 0)
        ) {
          const initialMatrix = outcomes.map((outcome) => ({
            subject: selectedSubject,
            courseOutcome: outcome._id,
            po1: 0,
            po2: 0,
            po3: 0,
            po4: 0,
            po5: 0,
            po6: 0,
            po7: 0,
            po8: 0,
            po9: 0,
            po10: 0,
            po11: 0,
            po12: 0,
            pso1: 0,
            pso2: 0,
          }));
          setCOPOMatrix(initialMatrix);
        } else {
          setCOPOMatrix(copoResponse.data || []);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // If no data found, initialize with empty arrays
          setCourseOutcomes([]);
          setCOPOMatrix([]);
        } else {
          console.error("Error fetching course data:", error);
        }
      }
      setLoading(false);
    };

    fetchCourseData();
  }, [selectedSubject]);

  const handleSubjectSelect = (e) => {
    setSelectedSubject(e.target.value);
    setShowTables(false);
  };

  const addNewCourseOutcome = () => {
    const lastCoNo =
      courseOutcomes.length > 0
        ? courseOutcomes[courseOutcomes.length - 1].coNo || ""
        : "";

    // Extract number part and increment
    const match = lastCoNo.match(/\d+$/);
    const newNumber = match ? parseInt(match[0]) + 1 : 1;
    const prefix = lastCoNo.replace(/\d+$/, "") || "CO";
    const newCoNo = `${prefix}${newNumber}`;

    const newCO = {
      subject: selectedSubject,
      coNo: newCoNo,
      courseOutcome: "",
      knowledgeLevel: "BTL-1",
    };

    setCourseOutcomes([...courseOutcomes, newCO]);
  };

  const removeLastCourseOutcome = () => {
    if (courseOutcomes.length > 0) {
      setCourseOutcomes(courseOutcomes.slice(0, -1));
      // Also remove the corresponding matrix row if it exists
      if (coPOMatrix.length > 0) {
        setCOPOMatrix(coPOMatrix.slice(0, -1));
      }
    }
  };

  const handleCourseOutcomeChange = (index, field, value) => {
    const updatedOutcomes = [...courseOutcomes];
    updatedOutcomes[index][field] = value;
    setCourseOutcomes(updatedOutcomes);
  };

  const handlePOChange = (coId, poField, value) => {
    // Convert value to a number between 0-3
    const numValue = Math.min(3, Math.max(0, parseInt(value) || 0));

    const updatedMatrix = [...coPOMatrix];
    const matrixIndex = updatedMatrix.findIndex(
      (item) => item.courseOutcome === coId || item.courseOutcome._id === coId
    );

    if (matrixIndex !== -1) {
      updatedMatrix[matrixIndex][poField] = numValue;
    } else {
      // Create new entry if not found
      const newEntry = {
        subject: selectedSubject,
        courseOutcome: coId,
        po1: 0,
        po2: 0,
        po3: 0,
        po4: 0,
        po5: 0,
        po6: 0,
        po7: 0,
        po8: 0,
        po9: 0,
        po10: 0,
        po11: 0,
        po12: 0,
        pso1: 0,
        pso2: 0,
      };
      newEntry[poField] = numValue;
      updatedMatrix.push(newEntry);
    }

    setCOPOMatrix(updatedMatrix);
  };

  // const handleDeleteCourseOutcome = async (index, coId) => {
  //   if (!window.confirm('Are you sure you want to delete this course outcome?')) {
  //     return;
  //   }

  //   try {
  //     // If the CO has an ID, delete it from the database
  //     if (coId) {
  //       await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/api/co/course-outcome/${coId}`);
  //       await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/api/co/copo-matrix/${coId}`);
  //     }

  //     // Remove from state
  //     const updatedCOs = [...courseOutcomes];
  //     updatedCOs.splice(index, 1);
  //     setCourseOutcomes(updatedCOs);

  //     // Also remove any associated matrix entries
  //     const updatedMatrix = coPOMatrix.filter(entry =>
  //       entry.courseOutcome !== coId && entry.courseOutcome._id !== coId
  //     );
  //     setCOPOMatrix(updatedMatrix);

  //   } catch (error) {
  //     console.error('Error deleting course outcome:', error);
  //     alert('Failed to delete course outcome. Please try again.');
  //   }
  // };

  const calculateAverages = () => {
    const poFields = [
      "po1",
      "po2",
      "po3",
      "po4",
      "po5",
      "po6",
      "po7",
      "po8",
      "po9",
      "po10",
      "po11",
      "po12",
      "pso1",
      "pso2",
    ];

    const averages = {};

    poFields.forEach((field) => {
      const values = coPOMatrix
        .map((entry) => Number(entry[field] || 0))
        .filter((val) => !isNaN(val));

      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        averages[field] = (sum / values.length).toFixed(1);
      } else {
        averages[field] = "-";
      }
    });

    return averages;
  };

  const [saveCount, setSaveCount] = useState(() => {
    // Initialize from localStorage if available
    const savedCount = localStorage.getItem(`saveCount_${selectedSubject}`);
    return savedCount ? parseInt(savedCount, 10) : 0;
  });

  const [saveDisabled, setSaveDisabled] = useState(() => {
    // Initialize disabled state based on saved count
    const savedCount = localStorage.getItem(`saveCount_${selectedSubject}`);
    return savedCount ? parseInt(savedCount, 10) >= 2 : false;
  });

  // Update useEffect to reset save counts when subject changes
  useEffect(() => {
    if (selectedSubject) {
      const savedCount = localStorage.getItem(`saveCount_${selectedSubject}`);
      setSaveCount(savedCount ? parseInt(savedCount, 10) : 0);
      setSaveDisabled(savedCount ? parseInt(savedCount, 10) >= 2 : false);
    }
  }, [selectedSubject]);

  const handleSave = async () => {
    if (saveDisabled) {
      return; // Early return if saves are disabled
    }

    if (!selectedSubject || courseOutcomes.length === 0) {
      alert("Please select a subject and add course outcomes");
      return;
    }

    // Check if this is the second save attempt
    if (saveCount === 1) {
      const confirmSave = window.confirm(
        "Are you sure you want to save? You won't be able to save after this time."
      );
      if (!confirmSave) {
        return; // User canceled the save
      }
    }

    setLoading(true);
    try {
      // Save course outcomes
      for (const outcome of courseOutcomes) {
        if (outcome._id) {
          // Update existing CO
          await axios.patch(
            `${process.env.REACT_APP_BACKEND_URI}/api/co/course-outcomes/${outcome._id}`,
            outcome
          );
        } else {
          // Create new CO
          const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URI}/api/co/course-outcomes`,
            {
              subjectId: selectedSubject,
              ...outcome,
            }
          );
          // Update the CO with its new ID
          outcome._id = response.data._id;
        }
      }

      // Get updated course outcomes to ensure we have all IDs
      const coResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URI}/api/co/course-outcomes/${selectedSubject}`
      );
      // Update the CO-PO matrix
      for (let i = 0; i < coResponse.data.length; i++) {
        const co = coResponse.data[i];
        // Find or create the matrix entry for this CO
        let matrixEntry = coPOMatrix.find(
          (entry) =>
            entry.courseOutcome === co._id ||
            (entry.courseOutcome && entry.courseOutcome._id === co._id)
        );
        if (!matrixEntry) {
          matrixEntry = {
            subject: selectedSubject,
            courseOutcome: co._id,
            po1: 0,
            po2: 0,
            po3: 0,
            po4: 0,
            po5: 0,
            po6: 0,
            po7: 0,
            po8: 0,
            po9: 0,
            po10: 0,
            po11: 0,
            po12: 0,
            pso1: 0,
            pso2: 0,
          };
        }
        if (matrixEntry._id) {
          // Update existing matrix entry
          await axios.patch(
            `${process.env.REACT_APP_BACKEND_URI}/api/co/copo-matrix/${matrixEntry._id}`,
            matrixEntry
          );
        } else {
          // Create new matrix entry
          await axios.post(
            `${process.env.REACT_APP_BACKEND_URI}/api/co/copo-matrix`,
            {
              subjectId: selectedSubject,
              coId: co._id,
              ...matrixEntry,
            }
          );
        }
      }

      // After CO-PO matrix entries are saved
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}/api/co/copo-average/${selectedSubject}`
      );

      // Increment save count and store in localStorage
      const newSaveCount = saveCount + 1;
      setSaveCount(newSaveCount);
      localStorage.setItem(`saveCount_${selectedSubject}`, newSaveCount);

      // Disable save button after second save
      if (newSaveCount >= 2) {
        setSaveDisabled(true);
        alert(
          "Data saved successfully! You have reached your maximum number of saves."
        );
      } else {
        alert("Data saved successfully!");
      }

      // Refresh data
      const copoResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URI}/api/co/copo-matrix/${selectedSubject}`
      );
      setCOPOMatrix(copoResponse.data || []);

      // Get the first 5 CO numbers
      const firstFiveCOs = courseOutcomes.slice(0, 5).map((co) => co.coNo);

      // Make first POST request for CIE-1 (CO 1-3)
      if (firstFiveCOs.length >= 3) {
        const cie1Data = {
          subject: selectedSubject,
          attainmentData: firstFiveCOs.slice(0, 3).map((coNo) => ({ coNo })),
          attainmentType: "direct",
          examType: "CIE-1",
        };

        await axios.post(
          `${process.env.REACT_APP_BACKEND_URI}/api/attainment`,
          cie1Data
        );
      }

      // Make second POST request for CIE-2 (CO 3-5)
      if (firstFiveCOs.length >= 5) {
        const cie2Data = {
          subject: selectedSubject,
          attainmentData: firstFiveCOs.slice(2, 5).map((coNo) => ({ coNo })),
          attainmentType: "direct",
          examType: "CIE-2",
        };

        await axios.post(
          `${process.env.REACT_APP_BACKEND_URI}/api/attainment`,
          cie2Data
        );
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data. Please try again.");
    }
    setLoading(false);
  };

  const handleResetTables = async () => {
    if (!selectedSubject) return;

    if (
      !window.confirm(
        `Are you sure you want to delete all entries for this subject? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Reset save count and disabled state for this subject
      setSaveCount(0);
      setSaveDisabled(false);
      localStorage.removeItem(`saveCount_${selectedSubject}`);

      // Delete all CO-PO matrices for this subject
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URI}/api/co/copo-matrices/${selectedSubject}`
      );

      // Delete all COs for this subject
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URI}/api/co/course-outcomes/${selectedSubject}`
      );

      // Reset state
      setCourseOutcomes([]);
      setCOPOMatrix([]);

      alert(
        "All entries have been deleted successfully! You can now save again."
      );
    } catch (error) {
      console.error("Error resetting tables:", error);
      alert("Error deleting entries. Please try again.");
    }

    setLoading(false);
  };

  const exportToPDF = async () => {
    if (!selectedSubject || courseOutcomes.length === 0) {
      alert("Please select a subject and add course outcomes first");
      return;
    }

    try {
      // Get subject details
      const subjectName =
        subjectOptions.find((s) => s._id === selectedSubject)?.name ||
        "Subject";

      // Create a temporary container that will be hidden
      const container = document.createElement("div");
      container.style.width = "1000px"; // Fixed width for consistent rendering
      container.style.padding = "10px";
      container.style.margin = "0 auto";
      container.style.backgroundColor = "white";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      // Create the main content as a single HTML string for better layout control
      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px; font-weight: bold; font-size: 14px;">
          Course Outcomes and PO-PSO Matrix
        </div>
        
        <!-- Course Outcomes Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 15px; font-size: 10px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid black; padding: 4px; text-align: center; width: 15%; vertical-align: middle;">Course</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center; width: 8%; vertical-align: middle;">CO No.</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center; width: 60%; vertical-align: middle;">Course Outcomes (CO)</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center; width: 17%; vertical-align: middle;">Knowledge Level<br>(Blooms Taxonomy Level)</th>
            </tr>
          </thead>
          <tbody>
            ${courseOutcomes
              .map(
                (co, idx) => `
              <tr>
                ${
                  idx === 0
                    ? `<td style="border: 1px solid black; padding: 4px; text-align: center; vertical-align: middle; font-size: 12px; font-weight: bold;" rowspan="${courseOutcomes.length}">
                    ${subjectName}
                  </td>`
                    : ""
                }
                <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                  co.coNo
                }</td>
                <td style="border: 1px solid black; padding: 4px; text-align: left; font-size: 10px;">${
                  co.courseOutcome
                }</td>
                <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                  co.knowledgeLevel
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <!-- CO-PO Matrix Title -->
        <div style="text-align: center; margin: 8px 0; font-weight: bold; font-size: 12px;">CO-PO Matrix</div>
        
        <!-- CO-PO Matrix Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 15px; font-size: 10px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid black; padding: 4px; text-align: center; width: 30%;">Course Outcomes (COs)</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO1</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO2</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO3</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO4</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO5</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO6</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO7</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO8</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO9</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO10</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO11</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center;">PO12</th>
            </tr>
          </thead>
          <tbody>
            ${courseOutcomes
              .map((co, idx) => {
                const matrix =
                  coPOMatrix.find(
                    (m) =>
                      m.courseOutcome === co._id ||
                      (m.courseOutcome && m.courseOutcome._id === co._id)
                  ) || {};

                return `
                <tr>
                  <td style="border: 1px solid black; padding: 4px; text-align: left; font-size: 10px;">${
                    co.courseOutcome
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po1 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po2 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po3 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po4 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po5 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po6 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po7 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po8 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po9 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po10 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po11 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.po12 || "-"
                  }</td>
                </tr>
              `;
              })
              .join("")}
            <tr style="background-color: #f2f2f2; font-weight: bold;">
              <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">AVERAGE</td>
              ${(() => {
                const averages = calculateAverages();
                let cells = "";
                for (let i = 1; i <= 12; i++) {
                  cells += `<td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    averages["po" + i]
                  }</td>`;
                }
                return cells;
              })()}
            </tr>
          </tbody>
        </table>
        
        <!-- CO-PSO Matrix Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-top: 15px; font-size: 10px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid black; padding: 4px; text-align: center; width: 70%;">Course Outcomes (COs)</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center; width: 15%;">PSO1</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center; width: 15%;">PSO2</th>
            </tr>
          </thead>
          <tbody>
            ${courseOutcomes
              .map((co, idx) => {
                const matrix =
                  coPOMatrix.find(
                    (m) =>
                      m.courseOutcome === co._id ||
                      (m.courseOutcome && m.courseOutcome._id === co._id)
                  ) || {};

                return `
                <tr>
                  <td style="border: 1px solid black; padding: 4px; text-align: left; font-size: 10px;">${
                    co.courseOutcome
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.pso1 || "-"
                  }</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${
                    matrix.pso2 || "-"
                  }</td>
                </tr>
              `;
              })
              .join("")}
            <tr style="background-color: #f2f2f2; font-weight: bold;">
              <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">AVERAGE</td>
              ${(() => {
                const averages = calculateAverages();
                return `
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${averages.pso1}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${averages.pso2}</td>
                `;
              })()}
            </tr>
          </tbody>
        </table>
      `;

      // Create PDF with landscape orientation
      const pdf = new jsPDF("l", "mm", "a4");

      // Use html2canvas to convert the entire content to a single image
      const canvas = await html2canvas(container, {
        scale: 1.5, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");

      // Get dimensions of the PDF page
      const pageWidth = pdf.internal.pageSize.getWidth();
      // const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate appropriate width and height to fit everything on one page
      const imgWidth = pageWidth - 20; // 10mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, "JPG", 10, 10, imgWidth, imgHeight);

      // Clean up the temporary container
      document.body.removeChild(container);

      // Save the PDF
      pdf.save(`${subjectName}_Course_Outcomes.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Error exporting to PDF. Please try again.");
    }
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/home")}
          className="mb-6 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </button>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Course Outcome and CO-PO Matrix
              </h1>
              <div className="text-sm text-gray-500">
                {selectedBranch && `Branch: ${selectedBranch}`}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
                  Regulation
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
                    className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    placeholder="Enter Regulation Code"
                    value={customRegulation}
                    onChange={handleCustomRegulationChange}
                    pattern="[A-Z0-9]*"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Course
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  value={selectedSubject}
                  onChange={handleSubjectSelect}
                  disabled={!selectedYear || !selectedSemester}
                >
                  <option value="">Select Course</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSubject && !showTables && (
              <div className="text-center py-8">
                <button
                  onClick={() => setShowTables(true)}
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <FaTable className="mr-2" />
                  Generate Table
                </button>
              </div>
            )}

            {showTables && selectedSubject && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Course Outcome Table
                      </h2>
                      <div className="flex space-x-4">
                        <button
                          onClick={addNewCourseOutcome}
                          disabled={saveCount >= 2}
                          className={`inline-flex items-center px-4 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                            saveCount >= 2
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-green-500 hover:bg-green-600 text-white hover:shadow"
                          }`}
                        >
                          <FaPlus className="mr-2" />
                          Add New Outcome
                        </button>

                        <button
                          onClick={removeLastCourseOutcome}
                          disabled={saveCount >= 1}
                          className={`inline-flex items-center px-4 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                            saveCount >= 1
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600 text-white hover:shadow"
                          }`}
                        >
                          <FaMinus className="mr-2" />
                          Remove Last Outcome
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Course
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              CO No.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Course Outcomes (CO)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Knowledge Level
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {courseOutcomes.map((outcome, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 transition-colors duration-200"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {
                                  subjectOptions.find(
                                    (s) => s._id === selectedSubject
                                  )?.name
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={outcome.coNo}
                                  onChange={(e) =>
                                    handleCourseOutcomeChange(
                                      idx,
                                      "coNo",
                                      e.target.value
                                    )
                                  }
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                  placeholder="CO1"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={outcome.courseOutcome}
                                  onChange={(e) =>
                                    handleCourseOutcomeChange(
                                      idx,
                                      "courseOutcome",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                  placeholder="Enter course outcome"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={outcome.knowledgeLevel}
                                  onChange={(e) =>
                                    handleCourseOutcomeChange(
                                      idx,
                                      "knowledgeLevel",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                >
                                  <option value="BTL-1">BTL-1</option>
                                  <option value="BTL-2">BTL-2</option>
                                  <option value="BTL-3">BTL-3</option>
                                  <option value="BTL-4">BTL-4</option>
                                  <option value="BTL-5">BTL-5</option>
                                  <option value="BTL-6">BTL-6</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      CO-PO Matrix
                    </h2>
                    <div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                              Course Outcomes (COs)
                            </th>
                            {[...Array(12)].map((_, i) => (
                              <th
                                key={i}
                                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12"
                              >
                                PO{i + 1}
                              </th>
                            ))}
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              PSO1
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              PSO2
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {coPOMatrix.map((matrix, idx) => (
                            <tr
                              key={idx}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-3 py-2 text-sm text-gray-600 truncate max-w-xs">
                                {matrix.courseOutcome
                                  ? typeof matrix.courseOutcome === "object" &&
                                    matrix.courseOutcome !== null
                                    ? matrix.courseOutcome.courseOutcome
                                    : courseOutcomes.find(
                                        (co) =>
                                          co && co._id === matrix.courseOutcome
                                      )?.courseOutcome
                                  : "N/A"}
                              </td>
                              {[...Array(12)].map((_, i) => (
                                <td key={i} className="px-1 py-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={matrix[`po${i + 1}`] || ""}
                                    onChange={(e) => {
                                      const coId = matrix.courseOutcome
                                        ? typeof matrix.courseOutcome ===
                                            "object" &&
                                          matrix.courseOutcome !== null
                                          ? matrix.courseOutcome._id
                                          : matrix.courseOutcome
                                        : null;
                                      if (coId)
                                        handlePOChange(
                                          coId,
                                          `po${i + 1}`,
                                          e.target.value
                                        );
                                    }}
                                    className="w-10 px-1 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                    placeholder="0"
                                    disabled={!matrix.courseOutcome}
                                  />
                                </td>
                              ))}
                              <td className="px-1 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="3"
                                  value={matrix.pso1 || ""}
                                  onChange={(e) => {
                                    const coId = matrix.courseOutcome
                                      ? typeof matrix.courseOutcome ===
                                          "object" &&
                                        matrix.courseOutcome !== null
                                        ? matrix.courseOutcome._id
                                        : matrix.courseOutcome
                                      : null;
                                    if (coId)
                                      handlePOChange(
                                        coId,
                                        "pso1",
                                        e.target.value
                                      );
                                  }}
                                  className="w-10 px-1 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                  placeholder="0"
                                  disabled={!matrix.courseOutcome}
                                />
                              </td>
                              <td className="px-1 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="3"
                                  value={matrix.pso2 || ""}
                                  onChange={(e) => {
                                    const coId = matrix.courseOutcome
                                      ? typeof matrix.courseOutcome ===
                                          "object" &&
                                        matrix.courseOutcome !== null
                                        ? matrix.courseOutcome._id
                                        : matrix.courseOutcome
                                      : null;
                                    if (coId)
                                      handlePOChange(
                                        coId,
                                        "pso2",
                                        e.target.value
                                      );
                                  }}
                                  className="w-10 px-1 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                                  placeholder="0"
                                  disabled={!matrix.courseOutcome}
                                />
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-medium">
                            <td className="px-3 py-2 text-sm font-bold text-gray-900">
                              AVERAGE
                            </td>
                            {Object.entries(calculateAverages()).map(
                              ([key, avg], idx) => (
                                <td
                                  key={idx}
                                  className="px-1 py-2 text-sm text-gray-900 text-center font-semibold"
                                >
                                  {avg}
                                </td>
                              )
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                  <div className="flex space-x-4">
                    <button
                      onClick={exportToPDF}
                      className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg font-semibold shadow-md hover:bg-green-600 transition-all duration-200"
                    >
                      <FaDownload className="mr-2" />
                      Export to PDF
                    </button>

                    <button
                      onClick={handleResetTables}
                      className="inline-flex items-center px-6 py-3 bg-red-500 text-white rounded-lg font-semibold shadow-md hover:bg-red-600 transition-all duration-200"
                    >
                      <FaTrash className="mr-2" />
                      Reset Table
                    </button>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saveDisabled}
                    className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 ${
                      saveDisabled
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-primary hover:bg-blue-600 text-white hover:shadow-lg"
                    }`}
                  >
                    <FaSave className="mr-2" />
                    {saveDisabled ? "Saved" : "Save"}
                  </button>
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

export default CourseOutcome;
