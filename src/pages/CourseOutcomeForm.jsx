import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const CourseOutcome = () => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [coPOMatrix, setCOPOMatrix] = useState([]);
  const [showTables, setShowTables] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectedBranch = localStorage.getItem('selectedBranch') || '';

  // Fetch subjects when year or semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedSemester && selectedBranch) {
        setLoading(true);
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
          );
          setSubjectOptions(response.data || []);
        } catch (error) {
          console.error('Error fetching subjects:', error);
          setSubjectOptions([]);
        }
        setLoading(false);
      }
    };

    fetchSubjects();
    // Reset selections when year/semester changes
    setSelectedSubject('');
    setCourseOutcomes([]);
    setCOPOMatrix([]);
    setShowTables(false);
  }, [selectedYear, selectedSemester, selectedBranch]);

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
        if (outcomes.length > 0 && (!copoResponse.data || copoResponse.data.length === 0)) {
          const initialMatrix = outcomes.map(outcome => ({
            subject: selectedSubject,
            courseOutcome: outcome._id,
            po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, po6: 0,
            po7: 0, po8: 0, po9: 0, po10: 0, po11: 0, po12: 0,
            pso1: 0, pso2: 0
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
          console.error('Error fetching course data:', error);
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
    const lastCoNo = courseOutcomes.length > 0
      ? courseOutcomes[courseOutcomes.length - 1].coNo || ''
      : '';

    // Extract number part and increment
    const match = lastCoNo.match(/\d+$/);
    const newNumber = match ? parseInt(match[0]) + 1 : 1;
    const prefix = lastCoNo.replace(/\d+$/, '') || 'CO';
    const newCoNo = `${prefix}${newNumber}`;

    const newCO = {
      subject: selectedSubject,
      coNo: newCoNo,
      courseOutcome: '',
      knowledgeLevel: 'BTL-1',
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
    const matrixIndex = updatedMatrix.findIndex(item =>
      item.courseOutcome === coId || item.courseOutcome._id === coId
    );

    if (matrixIndex !== -1) {
      updatedMatrix[matrixIndex][poField] = numValue;
    } else {
      // Create new entry if not found
      const newEntry = {
        subject: selectedSubject,
        courseOutcome: coId,
        po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, po6: 0,
        po7: 0, po8: 0, po9: 0, po10: 0, po11: 0, po12: 0,
        pso1: 0, pso2: 0
      };
      newEntry[poField] = numValue;
      updatedMatrix.push(newEntry);
    }

    setCOPOMatrix(updatedMatrix);
  };

  const handleDeleteCourseOutcome = async (index, coId) => {
    if (!window.confirm('Are you sure you want to delete this course outcome?')) {
      return;
    }

    try {
      // If the CO has an ID, delete it from the database
      if (coId) {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/api/co/course-outcome/${coId}`);
        await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/api/co/copo-matrix/${coId}`);
      }

      // Remove from state
      const updatedCOs = [...courseOutcomes];
      updatedCOs.splice(index, 1);
      setCourseOutcomes(updatedCOs);

      // Also remove any associated matrix entries
      const updatedMatrix = coPOMatrix.filter(entry =>
        entry.courseOutcome !== coId && entry.courseOutcome._id !== coId
      );
      setCOPOMatrix(updatedMatrix);

    } catch (error) {
      console.error('Error deleting course outcome:', error);
      alert('Failed to delete course outcome. Please try again.');
    }
  };

  const calculateAverages = () => {
    const poFields = [
      'po1', 'po2', 'po3', 'po4', 'po5', 'po6',
      'po7', 'po8', 'po9', 'po10', 'po11', 'po12',
      'pso1', 'pso2'
    ];

    const averages = {};

    poFields.forEach(field => {
      const values = coPOMatrix
        .map(entry => Number(entry[field] || 0))
        .filter(val => !isNaN(val));

      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        averages[field] = (sum / values.length).toFixed(1);
      } else {
        averages[field] = '-';
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
      alert('Please select a subject and add course outcomes');
      return;
    }

    // Check if this is the second save attempt
    if (saveCount === 1) {
      const confirmSave = window.confirm('Are you sure you want to save? You won\'t be able to save after this time.');
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
              ...outcome
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
        let matrixEntry = coPOMatrix.find(entry =>
          entry.courseOutcome === co._id ||
          (entry.courseOutcome && entry.courseOutcome._id === co._id)
        );
        if (!matrixEntry) {
          matrixEntry = {
            subject: selectedSubject,
            courseOutcome: co._id,
            po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, po6: 0,
            po7: 0, po8: 0, po9: 0, po10: 0, po11: 0, po12: 0,
            pso1: 0, pso2: 0
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
              ...matrixEntry
            }
          );
        }
      }

      // Increment save count and store in localStorage
      const newSaveCount = saveCount + 1;
      setSaveCount(newSaveCount);
      localStorage.setItem(`saveCount_${selectedSubject}`, newSaveCount);

      // Disable save button after second save
      if (newSaveCount >= 2) {
        setSaveDisabled(true);
        alert('Data saved successfully! You have reached your maximum number of saves.');
      } else {
        alert('Data saved successfully!');
      }

      // Refresh data
      const copoResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URI}/api/co/copo-matrix/${selectedSubject}`
      );
      setCOPOMatrix(copoResponse.data || []);
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    }
    setLoading(false);
  };

  const handleResetTables = async () => {
    if (!selectedSubject) return;

    if (!window.confirm(
      `Are you sure you want to delete all entries for this subject? This action cannot be undone.`
    )) {
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

      alert('All entries have been deleted successfully! You can now save again.');
    } catch (error) {
      console.error('Error resetting tables:', error);
      alert('Error deleting entries. Please try again.');
    }

    setLoading(false);
  };

  const exportToPDF = async () => {
    if (!selectedSubject || courseOutcomes.length === 0) {
      alert('Please select a subject and add course outcomes first');
      return;
    }
  
    try {
      // Get subject details
      const subjectName = subjectOptions.find(s => s._id === selectedSubject)?.name || 'Subject';
  
      // Create a temporary container that will be hidden
      const container = document.createElement('div');
      container.style.width = '1000px'; // Fixed width for consistent rendering
      container.style.padding = '10px';
      container.style.margin = '0 auto';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
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
            ${courseOutcomes.map((co, idx) => `
              <tr>
                ${idx === 0 ?
                  `<td style="border: 1px solid black; padding: 4px; text-align: center; vertical-align: middle; font-size: 12px; font-weight: bold;" rowspan="${courseOutcomes.length}">
                    ${subjectName}
                  </td>` : ''
                }
                <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${co.coNo}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: left; font-size: 10px;">${co.courseOutcome}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${co.knowledgeLevel}</td>
              </tr>
            `).join('')}
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
            ${courseOutcomes.map((co, idx) => {
              const matrix = coPOMatrix.find(m =>
                (m.courseOutcome === co._id) ||
                (m.courseOutcome && m.courseOutcome._id === co._id)
              ) || {};
              
              return `
                <tr>
                  <td style="border: 1px solid black; padding: 4px; text-align: left; font-size: 10px;">${co.courseOutcome}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po1 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po2 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po3 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po4 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po5 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po6 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po7 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po8 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po9 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po10 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po11 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.po12 || '-'}</td>
                </tr>
              `;
            }).join('')}
            <tr style="background-color: #f2f2f2; font-weight: bold;">
              <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">AVERAGE</td>
              ${(() => {
                const averages = calculateAverages();
                let cells = '';
                for (let i = 1; i <= 12; i++) {
                  cells += `<td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${averages['po' + i]}</td>`;
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
            ${courseOutcomes.map((co, idx) => {
              const matrix = coPOMatrix.find(m =>
                (m.courseOutcome === co._id) ||
                (m.courseOutcome && m.courseOutcome._id === co._id)
              ) || {};
              
              return `
                <tr>
                  <td style="border: 1px solid black; padding: 4px; text-align: left; font-size: 10px;">${co.courseOutcome}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.pso1 || '-'}</td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px;">${matrix.pso2 || '-'}</td>
                </tr>
              `;
            }).join('')}
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
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Use html2canvas to convert the entire content to a single image
      const canvas = await html2canvas(container, { 
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Get dimensions of the PDF page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate appropriate width and height to fit everything on one page
      const imgWidth = pageWidth - 20; // 10mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Clean up the temporary container
      document.body.removeChild(container);
      
      // Save the PDF
      pdf.save(`${subjectName}_Course_Outcomes.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-700">Course Outcome and CO-PO Matrix</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600">Year</label>
            <select
              className="mt-1 p-2 border border-gray-300 rounded w-full"
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

          <div>
            <label className="block text-sm font-medium text-gray-600">Semester</label>
            <select
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="">Select Semester</option>
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Course</label>
            <select
              className="mt-1 p-2 border border-gray-300 rounded w-full"
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
          <div className="text-center">
            <button
              onClick={() => setShowTables(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            >
              Generate Table
            </button>
          </div>
        )}

        {showTables && selectedSubject && (
          <div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">Course Outcome Table</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={addNewCourseOutcome}
                    disabled={saveCount >= 1}  // Disable when save count is 1 or more
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm transition-colors duration-200 ${saveCount >= 1 ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Outcome</span>
                  </button>


                  <button
                    onClick={removeLastCourseOutcome}
                    disabled={saveCount >= 1}  // Disable when save count is 1 or more
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm transition-colors duration-200 ${saveCount >= 1 ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                    <span>Remove Last Outcome</span>
                  </button>

                </div>
              </div>

              <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CO No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Outcomes (CO)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Knowledge Level</th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Delete</th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courseOutcomes.map((outcome, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {subjectOptions.find(s => s._id === selectedSubject)?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={outcome.coNo}
                            onChange={(e) => handleCourseOutcomeChange(idx, 'coNo', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="CO1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={outcome.courseOutcome}
                            onChange={(e) => handleCourseOutcomeChange(idx, 'courseOutcome', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter course outcome"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={outcome.knowledgeLevel}
                            onChange={(e) => handleCourseOutcomeChange(idx, 'knowledgeLevel', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="BTL-1">BTL-1</option>
                            <option value="BTL-2">BTL-2</option>
                            <option value="BTL-3">BTL-3</option>
                            <option value="BTL-4">BTL-4</option>
                            <option value="BTL-5">BTL-5</option>
                            <option value="BTL-6">BTL-6</option>
                          </select>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteCourseOutcome(idx, outcome._id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                            title="Delete course outcome"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-xl font-bold mt-8 mb-4 text-gray-700">CO-PO Matrix</h2>

            <table className="min-w-full table-auto border-collapse mb-6">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">
                    Course Outcomes (COs)
                  </th>
                  {[...Array(12)].map((_, i) => (
                    <th key={i} className="border px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
                      PO{i + 1}
                    </th>
                  ))}
                  <th className="border px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-50">PSO1</th>
                  <th className="border px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-50">PSO2</th>
                </tr>
              </thead>

              <tbody>
                {coPOMatrix.map((matrix, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      {/* Check if matrix.courseOutcome exists and handle different data structures */}
                      {matrix.courseOutcome ? (
                        typeof matrix.courseOutcome === 'object' && matrix.courseOutcome !== null ?
                          matrix.courseOutcome.courseOutcome :
                          courseOutcomes.find(co => co && co._id === matrix.courseOutcome)?.courseOutcome
                      ) : (
                        // Fallback if courseOutcome is null or undefined
                        "N/A"
                      )}
                    </td>
                    {[...Array(12)].map((_, i) => (
                      <td key={i} className="border px-4 py-2 text-sm text-gray-600">
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={matrix[`po${i + 1}`] || ''}
                          onChange={(e) => {
                            // Safely get the courseOutcome ID
                            const coId = matrix.courseOutcome ?
                              (typeof matrix.courseOutcome === 'object' && matrix.courseOutcome !== null ?
                                matrix.courseOutcome._id : matrix.courseOutcome) :
                              null;

                            if (coId) {
                              handlePOChange(coId, `po${i + 1}`, e.target.value);
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded text-center"
                          placeholder="0"
                          disabled={!matrix.courseOutcome}
                        />
                      </td>
                    ))}
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={matrix.pso1 || ''}
                        onChange={(e) => {
                          const coId = matrix.courseOutcome ?
                            (typeof matrix.courseOutcome === 'object' && matrix.courseOutcome !== null ?
                              matrix.courseOutcome._id : matrix.courseOutcome) :
                            null;

                          if (coId) {
                            handlePOChange(coId, 'pso1', e.target.value);
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded text-center"
                        placeholder="0"
                        disabled={!matrix.courseOutcome}
                      />
                    </td>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={matrix.pso2 || ''}
                        onChange={(e) => {
                          const coId = matrix.courseOutcome ?
                            (typeof matrix.courseOutcome === 'object' && matrix.courseOutcome !== null ?
                              matrix.courseOutcome._id : matrix.courseOutcome) :
                            null;

                          if (coId) {
                            handlePOChange(coId, 'pso2', e.target.value);
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded text-center"
                        placeholder="0"
                        disabled={!matrix.courseOutcome}
                      />
                    </td>
                  </tr>
                ))}
                {/* Average Row */}
                <tr className="bg-gray-100 font-medium">
                  <td className="border px-4 py-2 text-sm text-gray-800 font-bold">AVERAGE</td>
                  {Object.entries(calculateAverages()).map(([key, avg], idx) => (
                    <td key={idx} className="border px-4 py-2 text-sm text-gray-800 text-center">
                      {avg}
                    </td>
                  ))}
                </tr>
              </tbody>

            </table>

            <div className="mt-4 flex justify-between items-center">
              <div className="space-x-4">
                <button
                  onClick={exportToPDF}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                >
                  Export Table
                </button>
                <button
                  onClick={handleResetTables}
                  className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                >
                  Reset Table
                </button>
              </div>
              <button
                onClick={handleSave}
                className={`px-6 py-2 ${saveDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors duration-200 shadow-sm`}
                disabled={saveDisabled}
              >
                {saveDisabled ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseOutcome;