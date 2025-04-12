import React, { useState, useEffect } from "react";
import axios from "axios";

const IndirectCOAttainmentReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);

  const selectedBranch = localStorage.getItem("selectedBranch");

  // Fetch subjects based on selected year, semester, and section
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedSemester) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
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
      } else {
        setSubjectOptions([]);
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch feedback data based on selected subject
  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (selectedSubject) {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/feebackattainment/subject/${selectedSubject}`
          );
          setFeedbackData(response.data);
        } catch (error) {
          console.error("Error fetching feedback data:", error);
          setFeedbackData([]);
        }
      }
    };
    fetchFeedbackData();
  }, [selectedSubject]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <form className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">
          Indirect CO Attainment Report
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select
            className="border p-2 rounded"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            className="border p-2 rounded"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>

          <select
            className="border p-2 rounded"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          <select
            className="border p-2 rounded"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjectOptions.length > 0 ? (
              subjectOptions.map((subject) => (
                <option key={subject.id} value={subject._id}>
                  {subject.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No subjects available
              </option>
            )}
          </select>
        </div>
      </form>

      {feedbackData.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">
            Feedback Attainment Data
          </h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 border">S.No</th>
                <th className="py-2 border">Roll No</th>
                <th className="py-2 border">CO1</th>
                <th className="py-2 border">CO2</th>
                <th className="py-2 border">CO3</th>
                <th className="py-2 border">CO4</th>
                <th className="py-2 border">CO5</th>
              </tr>
            </thead>
            <tbody>
              {feedbackData.map((feedback, index) => (
                <tr key={feedback._id}>
                  <td className="py-2 border text-center">{index + 1}</td>
                  <td className="py-2 border text-center">
                    {feedback.student.rollNo}
                  </td>
                  <td className="py-2 border text-center">{feedback.CO1}</td>
                  <td className="py-2 border text-center">{feedback.CO2}</td>
                  <td className="py-2 border text-center">{feedback.CO3}</td>
                  <td className="py-2 border text-center">{feedback.CO4}</td>
                  <td className="py-2 border text-center">{feedback.CO5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IndirectCOAttainmentReport;
