import React, { useState, useEffect } from "react";
import axios from "axios";

const InternalMarks = () => {
  const [submitted, setSubmitted] = useState(false);
  const [examType, setExamType] = useState("");
  const [maxMarks, setMaxMarks] = useState(0);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [students, setStudents] = useState([]);

  const selectedBranch = localStorage.getItem("selectedBranch");

  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedSemester) {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
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

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedSubject && examType) {
        try {
          const studentsResponse = await axios.get(
            `http://localhost:3000/api/students/filtered?branch=${selectedBranch}&year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}`
          );

          const marksResponse = await axios.get(
            `http://localhost:3000/api/internalmarks/${selectedSubject}/${examType}`
          );

          // Combine students with their marks
          const studentsWithMarks = studentsResponse.data.map((student) => {
            const markEntry = marksResponse.data.find(
              (mark) => mark.student._id === student._id
            );

            return {
              ...student,
              marks: markEntry
                ? markEntry.marks
                : {
                    Q1: { a: 0, b: 0, c: 0 },
                    Q2: { a: 0, b: 0 },
                    Q3: { a: 0, b: 0 },
                    Q4: { a: 0, b: 0 },
                  },
            };
          });

          setStudents(studentsWithMarks);
        } catch (error) {
          console.error("Error fetching students or marks:", error);
        }
      }
    };
    fetchStudents();
  }, [
    selectedSubject,
    selectedYear,
    selectedSemester,
    selectedSection,
    examType,
  ]);

  const handleMarksChange = (studentIndex, question, part, value) => {
    const updatedStudents = [...students];
    if (!updatedStudents[studentIndex].marks) {
      updatedStudents[studentIndex].marks = {};
    }
    if (!updatedStudents[studentIndex].marks[question]) {
      updatedStudents[studentIndex].marks[question] = {};
    }

    updatedStudents[studentIndex].marks[question][part] =
      parseInt(value, 10) || 0; // Ensure numerical value
    setStudents(updatedStudents);
  };

  const handleSave = async () => {
    try {
      for (let student of students) {
        const { _id, marks } = student;
        if (marks) {
          const existingMarkEntry = await axios.get(
            `http://localhost:3000/api/internalmarks/${selectedSubject}/${examType}`
          );
          const markEntryToUpdate = existingMarkEntry.data.find(
            (mark) => mark.student._id === _id
          );

          if (markEntryToUpdate) {
            // Update existing marks entry (PUT request)
            await axios.put(
              `http://localhost:3000/api/internalmarks/${selectedSubject}/${examType}/${markEntryToUpdate._id}`,
              {
                marks, // Now directly includes the updated marks
              }
            );
          } else {
            // Create a new marks entry (POST request)
            await axios.post(`http://localhost:3000/api/internalmarks`, {
              student: _id,
              subject: selectedSubject,
              examType,
              marks, // Directly include the marks
              year: selectedYear,
              semester: selectedSemester,
              section: selectedSection,
            });
          }
        }
      }
      alert("Marks saved successfully");
    } catch (error) {
      console.error("Error saving marks:", error);
      alert("Failed to save marks");
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4 text-gray-700">
            Internal Marks Entry
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Year Dropdown */}
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

            {/* Semester Dropdown */}
            <select
              className="border p-2 rounded"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="">Select Semester</option>
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
            </select>

            {/* Section Dropdown */}
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

            {/* Subject Dropdown */}
            <select
              className="border p-2 rounded"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedYear || !selectedSemester}
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

            {/* Exam Type Dropdown */}
            <select
              className="border p-2 rounded"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
            >
              <option value="">Select Test Type</option>
              <option value="CIE-1">CIE-1</option>
              <option value="CIE-2">CIE-2</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Enter
          </button>
        </form>
      </div>
      {submitted && students.length > 0 && (
        <div>
          <table className="w-full border border-black text-center text-sm mt-10">
            <thead>
              <tr className="border border-black">
                <th
                  colSpan={10}
                  className="border border-black text-lg font-bold p-2"
                >
                  Course Name:{" "}
                  {
                    subjectOptions.find(
                      (subject) => subject._id === selectedSubject
                    )?.name
                  }
                </th>

                <th
                  colSpan={10}
                  className="border border-black text-lg font-bold p-2"
                >
                  Course Code: U21CS501 {/* Dynamic Course Code */}
                </th>
              </tr>
              <tr className="border border-black">
                <th colSpan={2} className="border border-black p-2">
                  S.No
                </th>
                <th colSpan={2} className="border border-black p-2">
                  H.T. NO
                </th>
                <th colSpan={3} className="border border-black p-2">
                  Q1 (6 Marks)
                </th>
                <th colSpan={2} className="border border-black p-2">
                  Q2 (7 Marks)
                </th>
                <th colSpan={2} className="border border-black p-2">
                  Q3 (7 Marks)
                </th>
                <th colSpan={2} className="border border-black p-2">
                  Q4 (7 Marks)
                </th>
                <th colSpan={2} className="border border-black p-2">
                  Total (Max Marks 20)
                </th>
              </tr>
              <tr className="border border-black">
                <th colSpan={2} className="border border-black p-2"></th>
                <th colSpan={2} className="border border-black p-2"></th>
                <th className="border border-black p-2">a</th>
                <th className="border border-black p-2">b</th>
                <th className="border border-black p-2">c</th>
                <th className="border border-black p-2">a</th>
                <th className="border border-black p-2">b</th>
                <th className="border border-black p-2">a</th>
                <th className="border border-black p-2">b</th>
                <th className="border border-black p-2">a</th>
                <th className="border border-black p-2">b</th>
                <th colSpan={2} className="border border-black p-2"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const totalMarks =
                  (student.marks?.Q1?.a || 0) +
                  (student.marks?.Q1?.b || 0) +
                  (student.marks?.Q1?.c || 0) +
                  (student.marks?.Q2?.a || 0) +
                  (student.marks?.Q2?.b || 0) +
                  (student.marks?.Q3?.a || 0) +
                  (student.marks?.Q3?.b || 0) +
                  (student.marks?.Q4?.a || 0) +
                  (student.marks?.Q4?.b || 0);

                // Check if totalMarks exceeds 20
                if (totalMarks > 20) {
                  alert(`Marks cannot exceed 20 for ${examType}`);
                }

                return (
                  <tr key={student._id} className="border border-black">
                    <td colSpan={2} className="border border-black p-2">
                      {index + 1}
                    </td>
                    <td colSpan={2} className="border border-black p-2">
                      {student.rollNo}
                    </td>

                    {/* Q1 Marks */}
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q1?.a || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q1", "a", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q1?.b || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q1", "b", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q1?.c || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q1", "c", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>

                    {/* Q2 Marks */}
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q2?.a || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q2", "a", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q2?.b || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q2", "b", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>

                    {/* Q3 Marks */}
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q3?.a || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q3", "a", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q3?.b || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q3", "b", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>

                    {/* Q4 Marks */}
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q4?.a || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q4", "a", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={student.marks?.Q4?.b || ""}
                        onChange={(e) =>
                          handleMarksChange(index, "Q4", "b", e.target.value)
                        }
                        className="w-full p-2 text-center"
                      />
                    </td>

                    {/* Total Marks */}
                    <td colSpan={2} className="border border-black p-2">
                      {totalMarks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Save button */}
          <div className="mt-4 flex justify-end space-x-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSave}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalMarks;
