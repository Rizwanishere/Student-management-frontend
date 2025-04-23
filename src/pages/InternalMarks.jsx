import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaSave } from "react-icons/fa";

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
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [customRegulation, setCustomRegulation] = useState("");
  const [showCustomRegulation, setShowCustomRegulation] = useState(false);

  const regulations = ["LR21", "LR22", "LR23", "Other"];

  const selectedBranch = localStorage.getItem("selectedBranch");

  const handleRegulationChange = (e) => {
    const value = e.target.value;
    setSelectedRegulation(value);
    setShowCustomRegulation(value === "Other");
    if (value !== "Other") {
      setCustomRegulation("");
    }
  };

  const handleCustomRegulationChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(value)) {
      setCustomRegulation(value);
      setSelectedRegulation(value);
    }
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedYear || !selectedSemester || !selectedBranch || !selectedRegulation || (showCustomRegulation && !customRegulation)) return;
      try {
        const regulationValue = showCustomRegulation ? customRegulation : selectedRegulation;
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}/regulation/${regulationValue}`
        );
        setSubjectOptions(response.data || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjectOptions([]);
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch, selectedRegulation, customRegulation, showCustomRegulation]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedSubject && examType) {
        try {
          const studentsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?branch=${selectedBranch}&year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}`
          );

          const marksResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/internalmarks/${selectedSubject}/${examType}`
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
            `${process.env.REACT_APP_BACKEND_URI}/api/internalmarks/${selectedSubject}/${examType}`
          );
          const markEntryToUpdate = existingMarkEntry.data.find(
            (mark) => mark.student._id === _id
          );

          if (markEntryToUpdate) {
            // Update existing marks entry (PUT request)
            await axios.put(
              `${process.env.REACT_APP_BACKEND_URI}/api/internalmarks/${selectedSubject}/${examType}/${markEntryToUpdate._id}`,
              {
                marks, // Now directly includes the updated marks
              }
            );
          } else {
            // Create a new marks entry (POST request)
            await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/internalmarks`, {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Internal Marks Entry</h1>
          <p className="text-gray-600">Enter and manage internal marks for students</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Regulation</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={selectedRegulation}
                    onChange={handleRegulationChange}
                  >
                    <option value="">Select Regulation</option>
                    {regulations.map((regulation) => (
                      <option key={regulation} value={regulation}>
                        {regulation}
                      </option>
                    ))}
                  </select>
                </div>

                {showCustomRegulation && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Custom Regulation</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={customRegulation}
                      onChange={handleCustomRegulationChange}
                      placeholder="Enter Regulation Code"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedYear || !selectedSemester || !selectedRegulation || (showCustomRegulation && !customRegulation)}
                  >
                    <option value="">Select Subject</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Test Type</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                  >
                    <option value="">Select Test Type</option>
                    <option value="CIE-1">CIE-1</option>
                    <option value="CIE-2">CIE-2</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center space-x-2"
                >
                  <FaSearch />
                  <span>Search Students</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {submitted && students.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Student Internal Marks</h2>
                  <p className="text-gray-600 mt-1">
                    Course: {subjectOptions.find(subject => subject._id === selectedSubject)?.name}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={handleSave}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <FaSave />
                    <span>Save Marks</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">S.No</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Roll No</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">Q1 (6)</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="2">Q2 (7)</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="2">Q3 (7)</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="2">Q4 (7)</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Total</th>
                    </tr>
                    <tr>
                      <th className="px-2 py-2"></th>
                      <th className="px-2 py-2"></th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">a</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">b</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">c</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">a</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">b</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">a</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">b</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">a</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">b</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">(20)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
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

                      return (
                        <tr key={student._id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{index + 1}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{student.rollNo}</td>
                          
                          {/* Q1 Marks */}
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q1?.a || ""}
                              onChange={(e) => handleMarksChange(index, "Q1", "a", e.target.value)}
                              min="0"
                              max="2"
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q1?.b || ""}
                              onChange={(e) => handleMarksChange(index, "Q1", "b", e.target.value)}
                              min="0"
                              max="2"
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q1?.c || ""}
                              onChange={(e) => handleMarksChange(index, "Q1", "c", e.target.value)}
                              min="0"
                              max="2"
                            />
                          </td>

                          {/* Q2 Marks */}
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q2?.a || ""}
                              onChange={(e) => handleMarksChange(index, "Q2", "a", e.target.value)}
                              min="0"
                              max="3.5"
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q2?.b || ""}
                              onChange={(e) => handleMarksChange(index, "Q2", "b", e.target.value)}
                              min="0"
                              max="3.5"
                            />
                          </td>

                          {/* Q3 Marks */}
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q3?.a || ""}
                              onChange={(e) => handleMarksChange(index, "Q3", "a", e.target.value)}
                              min="0"
                              max="3.5"
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q3?.b || ""}
                              onChange={(e) => handleMarksChange(index, "Q3", "b", e.target.value)}
                              min="0"
                              max="3.5"
                            />
                          </td>

                          {/* Q4 Marks */}
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q4?.a || ""}
                              onChange={(e) => handleMarksChange(index, "Q4", "a", e.target.value)}
                              min="0"
                              max="3.5"
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-12 border border-gray-200 rounded-lg px-1 py-1 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 text-center text-sm"
                              value={student.marks?.Q4?.b || ""}
                              onChange={(e) => handleMarksChange(index, "Q4", "b", e.target.value)}
                              min="0"
                              max="3.5"
                            />
                          </td>

                          {/* Total Marks */}
                          <td className="px-2 py-2 whitespace-nowrap text-center">
                            <span className={`font-semibold text-sm ${totalMarks > 20 ? 'text-red-600' : 'text-gray-900'}`}>
                              {totalMarks}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalMarks;
