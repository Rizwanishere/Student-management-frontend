import React, { useState, useEffect } from "react";
import Loader from "../utils/Loader";

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
  };

  // Handle semester change
  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    setSelectedSubject("");
    setSelectedExamType("");
    setStudents([]);
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

  return (
    <div className="w-full max-w-6xl mx-auto p-4 mb-36 mt-10">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b">
          <h2 className="text-xl font-bold text-center">CO Attainment</h2>
          {selectedExamType && (
            <div className="text-center font-bold">{getExamTitle()}</div>
          )}
        </div>

        {/* Filters */}
        <div className="p-4">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                className="w-32 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedYear}
                onChange={handleYearChange}
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <select
                className="w-32 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSemester}
                onChange={handleSemesterChange}
                disabled={!selectedYear}
              >
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select
                className="w-64 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedExamType("");
                  setStudents([]);
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

            <div>
              <label className="block text-sm font-medium mb-1">
                Exam Type
              </label>
              <select
                className="w-32 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
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

          {loading && <Loader />}
          {error && (
            <div className="text-center text-red-500 py-4">{error}</div>
          )}

          {!loading && !error && selectedExamType && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th rowSpan="2" className="border px-2 py-1 text-center">
                      S.No.
                    </th>
                    <th rowSpan="2" className="border px-2 py-1 text-center">
                      Roll. No.
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
                    <th className="border px-2 py-1 text-center">CO1</th>
                    <th className="border px-2 py-1 text-center">CO2</th>
                    <th className="border px-2 py-1 text-center">CO3</th>
                    <th className="border px-2 py-1 text-center">CO1</th>
                    <th className="border px-2 py-1 text-center">CO2</th>
                    <th className="border px-2 py-1 text-center">CO3</th>
                    <th className="border px-2 py-1 text-center">CO1</th>
                    <th className="border px-2 py-1 text-center">CO2</th>
                    <th className="border px-2 py-1 text-center">CO3</th>
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
                            {q1Score || ""}
                          </td>
                          <td className="border px-2 py-1 text-center"></td>
                          <td className="border px-2 py-1 text-center"></td>

                          {/* Q2 CO scores */}
                          <td className="border px-2 py-1 text-center"></td>
                          <td className="border px-2 py-1 text-center">
                            {q2Score || ""}
                          </td>
                          <td className="border px-2 py-1 text-center"></td>

                          {/* Q3 CO scores */}
                          <td className="border px-2 py-1 text-center"></td>
                          <td className="border px-2 py-1 text-center">
                            {q3Score || ""}
                          </td>
                          <td className="border px-2 py-1 text-center"></td>

                          {/* Other scores */}
                          <td className="border px-2 py-1 text-center">
                            {saqScore || ""}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {surpriseScore || ""}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {assignmentScore || ""}
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
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttainmentReport;
