import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
            `http://localhost:3000/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
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
          axios.get(`http://localhost:3000/api/co/getCourseOutcomes/${selectedCourseName}`),
          axios.get(`http://localhost:3000/api/co/getCOPOMatrix/${selectedCourseName}`) // Changed to use selectedCourseName
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

  const handleSubmit = async () => {
    try {
      const newOutcomes = courseOutcomes.filter(outcome => !outcome._id);
      
      // Create course outcomes and their corresponding COPO matrices
      for (const outcome of newOutcomes) {
        const coResponse = await axios.post('http://localhost:3000/api/co/createCourseOutcome', {
          ...outcome,
          course: selectedCourseName,
        });

        // The API response includes both the course outcome and its COPO matrix
        if (coResponse.data.coPoMatrix) {
          setCoPOMatrix(prev => [...prev, coResponse.data.coPoMatrix]);
        }
      }

      alert('New course outcomes submitted successfully!');
      
      // Refresh both CO and COPO data
      await fetchCourseData();
      setModifiedOutcomes(new Set());
      setModifiedMatrices(new Set());

    } catch (error) {
      console.error('Error submitting course outcomes:', error);
      alert('Error submitting course outcomes. Please try again.');
    }
  };

  const handleUpdate = async () => {
    try {
      // Update course outcomes
      for (const outcomeId of modifiedOutcomes) {
        const outcome = courseOutcomes.find(co => co._id === outcomeId);
        if (outcome) {
          await axios.patch(`http://localhost:3000/api/co/updateCourseOutcome/${outcomeId}`, {
            coNo: outcome.coNo,
            courseOutcome: outcome.courseOutcome,
            knowledgeLevel: outcome.knowledgeLevel,
            course: selectedCourseName,
          });
        }
      }

      // Update COPO matrices
      for (const matrixId of modifiedMatrices) {
        const matrix = coPOMatrix.find(m => m._id === matrixId);
        if (matrix) {
          await axios.patch(`http://localhost:3000/api/co/updateCOPOMatrix/${matrixId}`, matrix);
        }
      }

      alert('Updates saved successfully!');
      
      // Refresh data after updates
      await fetchCourseData();
      setModifiedOutcomes(new Set());
      setModifiedMatrices(new Set());

    } catch (error) {
      console.error('Error updating:', error);
      alert('Error updating. Please try again.');
    }
  };
  

  // Submit new CO-PO Matrix
  const handleSubmitCOPOMatrix = async () => {
    try {
      const newMatrices = coPOMatrix.filter(matrix => !matrix._id);

      for (const matrix of newMatrices) {
        const response = await axios.post('http://localhost:3000/api/co/createCOPOMatrix', {
          ...matrix,
          course: selectedCourseName,
        });
        setCoPOMatrix(prev => prev.map(m => (m === matrix ? { ...m, _id: response.data._id } : m)));
      }

      alert('New CO-PO Matrix submitted successfully!');
      const coPoResponse = await axios.get(`http://localhost:3000/api/co/getCOPOMatrix/${selectedCourse}`);
      setCoPOMatrix(coPoResponse.data || []);
      setModifiedMatrices(new Set());
    } catch (error) {
      console.error('Error submitting CO-PO Matrix:', error);
      alert('Error submitting CO-PO Matrix. Please try again.');
    }
  };

  // Update modified CO-PO Matrix
  const handleUpdateCOPOMatrix = async () => {
    try {
      // Update each modified matrix
      for (const matrixId of modifiedMatrices) {
        const matrix = coPOMatrix.find(m => m._id === matrixId);
        if (matrix) {
          // Remove __v and _id from the request body to avoid MongoDB conflicts
          const { __v, _id, ...matrixToUpdate } = matrix;
          
          await axios.patch(`http://localhost:3000/api/co/updateCOPOMatrix/${matrixId}`, {
            ...matrixToUpdate,
            course: selectedCourseName,
          });
        }
      }
  
      // Fetch updated data using selectedCourseName
      const coPoResponse = await axios.get(`http://localhost:3000/api/co/getCOPOMatrix/${selectedCourseName}`);
      
      // Update state with new data
      if (coPoResponse.data) {
        setCoPOMatrix(coPoResponse.data);
      }
      
      setModifiedMatrices(new Set());
      alert('CO-PO Matrix updated successfully!');
      
    } catch (error) {
      console.error('Error updating CO-PO Matrix:', error);
      alert('Error updating CO-PO Matrix. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md">
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
            <h2 className="text-xl font-bold mb-4 text-gray-700">Course Outcome Table</h2>
            <table className="min-w-full table-auto border-collapse mb-6">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">Course</th>
                  <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">CO No.</th>
                  <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">Course Outcomes (CO)</th>
                  <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">Knowledge Level</th>
                </tr>
              </thead>
              <tbody>
                {courseOutcomes.map((outcome, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-4 py-2 text-sm text-gray-600">{selectedCourseName}</td>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      <input
                        type="text"
                        value={outcome.coNo}
                        onChange={(e) => handleCourseOutcomeChange(idx, 'coNo', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="CO1"
                      />
                    </td>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      <input
                        type="text"
                        value={outcome.courseOutcome}
                        onChange={(e) => handleCourseOutcomeChange(idx, 'courseOutcome', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Enter course outcome"
                      />
                    </td>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      <select
                        value={outcome.knowledgeLevel}
                        onChange={(e) => handleCourseOutcomeChange(idx, 'knowledgeLevel', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="">Select Level</option>
                        {[1, 2, 3, 4, 5, 6].map((level) => (
                          <option key={level} value={`BTL-${level}`}>
                            BTL-{level}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 text-center space-x-4">
              <button
                onClick={addNewCourseOutcome}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-700"
              >
                Add New Course Outcome
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              >
                Submit New
              </button>
              <button
                onClick={handleUpdate}
                disabled={modifiedOutcomes.size === 0}
                className={`px-6 py-2 text-white rounded ${
                  modifiedOutcomes.size > 0
                    ? 'bg-yellow-500 hover:bg-yellow-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Update Modified
              </button>
            </div>

            <h2 className="text-xl font-bold mt-8 mb-4 text-gray-700">CO-PO Matrix</h2>
            <table className="min-w-full table-auto border-collapse mb-6">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">Course Outcomes (COs)</th>
                  {[...Array(12)].map((_, i) => (
                    <th key={i} className="border px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-50">PO{i + 1}</th>
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
              </tbody>
            </table>

            <div className="mt-4 text-center space-x-4">
              <button
                onClick={handleSubmitCOPOMatrix}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              >
                Submit New CO-PO Matrix
              </button>
              <button
                onClick={handleUpdateCOPOMatrix}
                disabled={modifiedMatrices.size === 0}
                className={`px-6 py-2 text-white rounded ${
                  modifiedMatrices.size > 0
                    ? 'bg-yellow-500 hover:bg-yellow-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Update Modified CO-PO Matrix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseOutcome;