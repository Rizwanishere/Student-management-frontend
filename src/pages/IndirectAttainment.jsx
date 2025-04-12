import React, { useState, useEffect } from "react";
import axios from "axios";

const IndirectAttainment = () => {
  const [submitted, setSubmitted] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [students, setStudents] = useState([]);

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

  // Ensure original CO values are stored when data is fetched
  useEffect(() => {
    const fetchStudentsAndFeedback = async () => {
      if (submitted && selectedSubject) {
        try {
          const studentsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?branch=${selectedBranch}&year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}&subjectId=${selectedSubject}`
          );

          const feedbackResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/feebackattainment/`
          );

          const studentsWithFeedback = studentsResponse.data.map((student) => {
            const feedbackEntry = feedbackResponse.data.find(
              (feedback) =>
                feedback.student._id === student._id &&
                feedback.subject._id === selectedSubject // Filter by subject
            );
            return {
              ...student,
              CO1: feedbackEntry ? feedbackEntry.CO1 : "",
              CO2: feedbackEntry ? feedbackEntry.CO2 : "",
              CO3: feedbackEntry ? feedbackEntry.CO3 : "",
              CO4: feedbackEntry ? feedbackEntry.CO4 : "",
              CO5: feedbackEntry ? feedbackEntry.CO5 : "",
              originalCO1: feedbackEntry ? feedbackEntry.CO1 : "", // Store original values
              originalCO2: feedbackEntry ? feedbackEntry.CO2 : "",
              originalCO3: feedbackEntry ? feedbackEntry.CO3 : "",
              originalCO4: feedbackEntry ? feedbackEntry.CO4 : "",
              originalCO5: feedbackEntry ? feedbackEntry.CO5 : "",
              feedbackId: feedbackEntry ? feedbackEntry._id : null,
            };
          });

          setStudents(studentsWithFeedback);
        } catch (error) {
          console.error(
            "Error fetching students or feedback attainment:",
            error
          );
        }
      }
    };
    fetchStudentsAndFeedback();
  }, [
    submitted,
    selectedSubject,
    selectedYear,
    selectedSemester,
    selectedSection,
  ]);

  // Ensure the table remains visible after clicking submit by keeping `submitted` true
  const handleDropdownSubmit = (e) => {
    e.preventDefault();
    setStudents([]); // Clear the students data to ensure the table is reset
    setSubmitted(false); // Temporarily set to false to trigger re-fetch
    setTimeout(() => setSubmitted(true), 0); // Immediately set back to true to keep the table visible
  };

  // Updated the handleSubmit function to only make PUT or POST requests for students whose CO values have changed
  const handleSubmit = async () => {
    try {
      for (let student of students) {
        const { _id, CO1, CO2, CO3, CO4, CO5, feedbackId } = student;

        // Check if any CO value has changed
        if (
          student.originalCO1 !== CO1 ||
          student.originalCO2 !== CO2 ||
          student.originalCO3 !== CO3 ||
          student.originalCO4 !== CO4 ||
          student.originalCO5 !== CO5
        ) {
          if (feedbackId) {
            // Update existing feedback
            await axios.put(
              `${process.env.REACT_APP_BACKEND_URI}/api/feebackattainment/${feedbackId}`,
              {
                student: _id,
                subject: selectedSubject,
                CO1,
                CO2,
                CO3,
                CO4,
                CO5,
              }
            );
          } else {
            // Create new feedback
            await axios.post(
              `${process.env.REACT_APP_BACKEND_URI}/api/feebackattainment/`,
              {
                student: _id,
                subject: selectedSubject,
                CO1,
                CO2,
                CO3,
                CO4,
                CO5,
              }
            );
          }
        }
      }
      alert("Feedback attainment data saved successfully");
    } catch (error) {
      console.error("Error saving feedback attainment data:", error);
      alert("Failed to save feedback attainment data");
    }
  };

  const handleCOChange = (index, coKey, value) => {
    if (value <= 3) {
      const updatedStudents = [...students];
      updatedStudents[index][coKey] = value;
      setStudents(updatedStudents);
    } else {
      alert("Values cannot exceed 3");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <form
        className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl"
        onSubmit={handleDropdownSubmit}
      >
        <h2 className="text-2xl font-semibold mb-4">Indirect Attainment</h2>

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

        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>

      {submitted && students.length > 0 && (
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
              {students.map((student, index) => (
                <tr key={student._id}>
                  <td className="py-2 border text-center">{index + 1}</td>
                  <td className="py-2 border text-center">{student.rollNo}</td>

                  {["CO1", "CO2", "CO3", "CO4", "CO5"].map((coKey) => (
                    <td className="py-2 border text-center" key={coKey}>
                      <input
                        type="number"
                        className="border p-2 rounded w-full text-center"
                        value={student[coKey]}
                        onChange={(e) =>
                          handleCOChange(index, coKey, e.target.value)
                        }
                        max={3}
                        min={0}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end space-x-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndirectAttainment;
