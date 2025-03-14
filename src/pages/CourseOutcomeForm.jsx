import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from "html2canvas";
// import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";

const CourseOutcome = () => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [modifiedOutcomes, setModifiedOutcomes] = useState(new Set());
  const [coPOMatrix, setCoPOMatrix] = useState([]);
  const [modifiedMatrices, setModifiedMatrices] = useState(new Set());
  const [showTables, setShowTables] = useState(false);
  const selectedBranch = localStorage.getItem('selectedBranch');

  // Fetch subjects when year or semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      setSubjectOptions([]);
      setSelectedCourse('');
      setSelectedCourseName('');
      setShowTables(false);
      if (selectedYear && selectedSemester) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
          );
          setSubjectOptions(response.data.length ? response.data : []);
        } catch (error) {
          console.error('Error fetching subjects:', error);
          setSubjectOptions([]);
        }
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch course outcomes and CO-PO matrix when course changes
  const fetchCourseData = async () => {
    if (selectedCourseName) {
      try {
        const [coResponse, coPoResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/co/getCourseOutcomes/${selectedCourseName}`),
          axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/co/getCOPOMatrix/${selectedCourseName}`)
        ]);

        setCourseOutcomes(coResponse.data && coResponse.data.length > 0 ? coResponse.data : []);
        setCoPOMatrix(coPoResponse.data || []);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setCourseOutcomes([]);
          setCoPOMatrix([]);
        } else {
          console.error('Error fetching CO or COPOMatrix:', error);
        }
      }
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [selectedCourseName]);

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    const courseName = subjectOptions.find(subject => subject._id === courseId)?.name || '';
    setSelectedCourse(courseId);
    setSelectedCourseName(courseName);
    setModifiedOutcomes(new Set());
    setModifiedMatrices(new Set());
    setShowTables(false);
  };

  const handlePOChange = (index, poIndex, value) => {
    const updatedMatrix = [...coPOMatrix];
    updatedMatrix[index][`po${poIndex + 1}`] = value;
    setCoPOMatrix(updatedMatrix);
    if (updatedMatrix[index]._id) {
      setModifiedMatrices(prev => new Set([...prev, updatedMatrix[index]._id]));
    }
  };

  const handleCourseOutcomeChange = (index, field, value) => {
    const updatedOutcomes = [...courseOutcomes];
    updatedOutcomes[index][field] = value;
    setCourseOutcomes(updatedOutcomes);
    if (updatedOutcomes[index]._id) {
      setModifiedOutcomes(prev => new Set([...prev, updatedOutcomes[index]._id]));
    }
  };

  const addNewCourseOutcome = () => {
    const lastCoNo = courseOutcomes.length > 0
      ? parseInt(courseOutcomes[courseOutcomes.length - 1].coNo.replace('CO', '')) || 0
      : 0;
    const newCoNo = `CO${lastCoNo + 1}`;

    const newCourseOutcome = {
      course: selectedCourseName,
      coNo: newCoNo,
      courseOutcome: '',
      knowledgeLevel: '',
    };

    setCourseOutcomes([...courseOutcomes, newCourseOutcome]);
  };

  const removeLastCourseOutcome = () => {
    if (courseOutcomes.length > 0) {
      setCourseOutcomes(courseOutcomes.slice(0, -1));
    }
  };

  const handleSave = async () => {
    try {
      // Save new course outcomes
      const newOutcomes = courseOutcomes.filter(outcome => !outcome._id);
      for (const outcome of newOutcomes) {
        await axios.post('${process.env.REACT_APP_BACKEND_URI}/api/co/createCourseOutcome', {
          ...outcome,
          course: selectedCourseName,
        });
      }

      // Update modified course outcomes
      for (const outcomeId of modifiedOutcomes) {
        const outcome = courseOutcomes.find(co => co._id === outcomeId);
        if (outcome) {
          await axios.patch(`${process.env.REACT_APP_BACKEND_URI}/api/co/updateCourseOutcome/${outcomeId}`, {
            coNo: outcome.coNo,
            courseOutcome: outcome.courseOutcome,
            knowledgeLevel: outcome.knowledgeLevel,
            course: selectedCourseName,
          });
        }
      }

      // Update modified CO-PO matrices
      for (const matrixId of modifiedMatrices) {
        const matrix = coPOMatrix.find(m => m._id === matrixId);
        if (matrix) {
          await axios.patch(`${process.env.REACT_APP_BACKEND_URI}/api/co/updateCOPOMatrix/${matrixId}`, matrix);
        }
      }

      alert('Data saved successfully!');
      await fetchCourseData();
      setModifiedOutcomes(new Set());
      setModifiedMatrices(new Set());
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    }
  };

  const handleResetTables = async () => {
    if (!selectedCourseName) return;

    const isConfirmed = window.confirm(
      `Are you sure you want to delete all entries for ${selectedCourseName}? This action cannot be undone.`
    );

    if (!isConfirmed) return;

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/api/co/deleteCourseOutcomesBySubject/${selectedCourseName}`);
      setCourseOutcomes([]);
      setCoPOMatrix([]);
      setModifiedOutcomes(new Set());
      setModifiedMatrices(new Set());
      alert('All entries have been deleted successfully!');
    } catch (error) {
      console.error('Error deleting entries:', error);
      alert('Error deleting entries. Please try again.');
    }
  };

  const calculateAverages = () => {
    if (coPOMatrix.length === 0) return Array(12).fill(0);

    const sums = Array(12).fill(0);
    const validCounts = Array(12).fill(0);

    coPOMatrix.forEach(matrix => {
      for (let i = 1; i <= 12; i++) {
        const value = parseFloat(matrix[`po${i}`]);
        if (!isNaN(value)) {
          sums[i - 1] += value;
          validCounts[i - 1]++;
        }
      }
    });

    return sums.map((sum, index) =>
      validCounts[index] ? (sum / validCounts[index]).toFixed(1) : '-'
    );
  };

  const handleDeleteCourseOutcome = async (id, courseOutcome) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this course outcome?');

    if (!isConfirmed) return;

    if (!id) {
      setCourseOutcomes(prevOutcomes => prevOutcomes.filter(outcome => outcome.courseOutcome !== courseOutcome));
      setCoPOMatrix(prevMatrix => prevMatrix.filter(matrix => matrix.courseOutcome !== courseOutcome));
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/api/co/deleteCourseOutcomeById/${id}`);
      setCourseOutcomes(prevOutcomes => prevOutcomes.filter(outcome => outcome._id !== id));
      setCoPOMatrix(prevMatrix => prevMatrix.filter(matrix => matrix.courseOutcome !== courseOutcome));
      alert('Course outcome deleted successfully!');
    } catch (error) {
      console.error('Error deleting course outcome:', error);
      alert('Error deleting course outcome. Please try again.');
    }
  };

  const exportToExcel = async () => {
    try {
        // Fetch CO-PO Matrix Data from the API
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URI}/api/co/getCOPOMatrix/${selectedCourseName}`);
        if (!response.ok) throw new Error("Failed to fetch CO-PO Matrix data");
        const fetchedCoPOMatrix = await response.json();

        // Create a container for both tables
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.padding = "20px";
        document.body.appendChild(container);

        // Create CO Table
        const coTable = document.createElement("table");
        coTable.style.borderCollapse = "collapse";
        coTable.style.width = "1200px";
        coTable.style.marginBottom = "30px";
        coTable.style.border = "1.5px solid black";
        coTable.style.fontSize = "12px";

        // CO Table Header
        const coHeaderRow = document.createElement("tr");
        const headerConfig = [
            { text: "Course", width: "100px" },
            { text: "CO No.", width: "80px" },
            { text: "Course Outcomes (CO)", width: "800px" },
            { text: "Knowledge Level\n(Blooms Taxonomy Level)", width: "220px" }
        ];

        headerConfig.forEach(config => {
            const th = document.createElement("th");
            th.style.border = "1px solid black";
            th.style.padding = "8px";
            th.style.backgroundColor = "#ffffff";
            th.style.fontWeight = "bold";
            th.style.width = config.width;
            th.style.textAlign = "center";
            th.textContent = config.text;
            coHeaderRow.appendChild(th);
        });
        coTable.appendChild(coHeaderRow);

        // CO Table Data
        courseOutcomes.forEach(outcome => {
            const row = document.createElement("tr");
            [selectedCourseName, outcome.coNo, outcome.courseOutcome, outcome.knowledgeLevel].forEach((text, index) => {
                const td = document.createElement("td");
                td.style.border = "1px solid black";
                td.style.padding = "8px";
                td.style.textAlign = index === 2 ? "left" : "center";
                td.textContent = text;
                td.style.width = headerConfig[index].width;
                row.appendChild(td);
            });
            coTable.appendChild(row);
        });

        // Create CO-PO Matrix Table
        const copoTable = document.createElement("table");
        copoTable.style.borderCollapse = "collapse";
        copoTable.style.width = "1200px";
        copoTable.style.border = "1.5px solid black";
        copoTable.style.fontSize = "12px";

        // CO-PO Matrix Header
        const copoHeaderRow = document.createElement("tr");
        const copoHeader = document.createElement("th");
        copoHeader.style.border = "1px solid black";
        copoHeader.style.padding = "8px";
        copoHeader.style.backgroundColor = "#ffffff";
        copoHeader.style.width = "800px";
        copoHeader.style.textAlign = "center";
        copoHeader.style.fontWeight = "bold";
        copoHeader.textContent = "Course Outcomes (COs)";
        copoHeaderRow.appendChild(copoHeader);

        // Add Program Outcomes headers
        Array(12).fill().forEach((_, i) => {
            const th = document.createElement("th");
            th.style.border = "1px solid black";
            th.style.padding = "8px";
            th.style.backgroundColor = "#ffffff";
            th.style.width = "33px";
            th.style.textAlign = "center";
            th.style.fontWeight = "bold";
            th.textContent = `PO${i + 1}`;
            copoHeaderRow.appendChild(th);
        });
        copoTable.appendChild(copoHeaderRow);

        // CO-PO Matrix Data
        fetchedCoPOMatrix.forEach(matrix => {
            const row = document.createElement("tr");
            const coCell = document.createElement("td");
            coCell.style.border = "1px solid black";
            coCell.style.padding = "8px";
            coCell.style.textAlign = "left";
            coCell.textContent = matrix.courseOutcome;
            row.appendChild(coCell);

            Array(12).fill().forEach((_, i) => {
                const td = document.createElement("td");
                td.style.border = "1px solid black";
                td.style.padding = "8px";
                td.style.textAlign = "center";
                td.textContent = matrix[`po${i + 1}`] || "-";
                row.appendChild(td);
            });
            copoTable.appendChild(row);
        });

        // Add Average Row
        const averageRow = document.createElement("tr");
        const averageLabel = document.createElement("td");
        averageLabel.style.border = "1px solid black";
        averageLabel.style.padding = "8px";
        averageLabel.style.textAlign = "center";
        averageLabel.style.fontWeight = "bold";
        averageLabel.textContent = "AVERAGE";
        averageRow.appendChild(averageLabel);

        // Calculate and add averages for each PO
        Array(12).fill().forEach((_, i) => {
            const td = document.createElement("td");
            td.style.border = "1px solid black";
            td.style.padding = "8px";
            td.style.textAlign = "center";
            td.style.fontWeight = "bold";

            // Calculate average for current PO
            const values = fetchedCoPOMatrix
                .map(matrix => parseFloat(matrix[`po${i + 1}`]))
                .filter(val => !isNaN(val));
            
            const average = values.length > 0 
                ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
                : "-";
            
            td.textContent = average;
            averageRow.appendChild(td);
        });
        copoTable.appendChild(averageRow);

        // Append tables to container
        container.appendChild(coTable);
        container.appendChild(copoTable);

        // Capture the tables as an image using html2canvas
        const canvas = await html2canvas(container);
        document.body.removeChild(container);

        // Convert canvas to image
        const imgData = canvas.toDataURL("image/png");

        // Create a PDF using jsPDF
        const pdf = new jsPDF("l", "mm", "a4"); // Landscape mode for better fit
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pageWidth - 20; // 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add the image to the PDF
        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

        // Save the PDF file
        pdf.save(`${selectedCourseName}_Course_Outcomes.pdf`);

    } catch (error) {
        console.error("Error exporting to PDF:", error);
        alert("Error exporting to PDF. Please try again.");
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
              value={selectedCourse}
              onChange={handleCourseSelect}
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

        {selectedCourse && !showTables && (
          <div className="text-center">
            <button
              onClick={() => setShowTables(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            >
              Generate Table
            </button>
          </div>
        )}

        {showTables && selectedCourse && (
          <div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">Course Outcome Table</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={addNewCourseOutcome}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Outcome</span>
                  </button>

                  <button
                    onClick={removeLastCourseOutcome}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2 shadow-sm"
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courseOutcomes.map((outcome, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{selectedCourseName}</td>
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
                            <option value="">Select Level</option>
                            {[1, 2, 3, 4, 5, 6].map((level) => (
                              <option key={level} value={`BTL-${level}`}>BTL-{level}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteCourseOutcome(outcome._id, outcome.courseOutcome)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                            title="Delete course outcome"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
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
                </tr>
              </thead>
              <tbody>
                {coPOMatrix.map((matrix, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-4 py-2 text-sm text-gray-600">{matrix.courseOutcome}</td>
                    {[...Array(12)].map((_, i) => (
                      <td key={i} className="border px-4 py-2 text-sm text-gray-600">
                        <input
                          type="text"
                          value={matrix[`po${i + 1}`] || ''}
                          onChange={(e) => handlePOChange(idx, i, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-center"
                          placeholder="0"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Average Row */}
                <tr className="bg-gray-100 font-medium">
                  <td className="border px-4 py-2 text-sm text-gray-800 font-bold">AVERAGE</td>
                  {calculateAverages().map((avg, idx) => (
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
                  onClick={exportToExcel}
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
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseOutcome;