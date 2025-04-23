import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaSave, FaGraduationCap, FaBook, FaUsers } from 'react-icons/fa';
import Loader from "../utils/Loader";

const IndirectAttainment = () => {
  const [submitted, setSubmitted] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch subjects based on selected year, semester, section, and regulation
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

  // Ensure original CO values are stored when data is fetched
  useEffect(() => {
    const fetchStudentsAndFeedback = async () => {
      if (submitted && selectedSubject) {
        try {
          const studentsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?branch=${selectedBranch}&year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}&subjectId=${selectedSubject}`
          );

          const feedbackResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/feedbackattainment/`
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

  const handleDropdownSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStudents([]); 
    setSubmitted(false);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 0);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      for (let student of students) {
        const { _id, CO1, CO2, CO3, CO4, CO5, feedbackId } = student;

        if (
          student.originalCO1 !== CO1 ||
          student.originalCO2 !== CO2 ||
          student.originalCO3 !== CO3 ||
          student.originalCO4 !== CO4 ||
          student.originalCO5 !== CO5
        ) {
          if (feedbackId) {
            await axios.put(
              `${process.env.REACT_APP_BACKEND_URI}/api/feedbackattainment/${feedbackId}`,
              {
                student: _id,
                subject: selectedSubject,
                CO1, CO2, CO3, CO4, CO5,
              }
            );
          } else {
            await axios.post(
              `${process.env.REACT_APP_BACKEND_URI}/api/feedbackattainment/`,
              {
                student: _id,
                subject: selectedSubject,
                CO1, CO2, CO3, CO4, CO5,
              }
            );
          }
        }
      }
      alert("Feedback attainment data saved successfully");
    } catch (error) {
      console.error("Error saving feedback attainment data:", error);
      alert("Failed to save feedback attainment data");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Indirect Attainment</h1>
              <div className="text-sm text-gray-500">
                {selectedBranch && `Branch: ${selectedBranch}`}
              </div>
            </div>

            <form onSubmit={handleDropdownSubmit} className="mb-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaGraduationCap className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBook className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                      <option value="">Select Semester</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Regulation</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
                  {showCustomRegulation && (
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50 mt-2"
                      placeholder="Enter Custom Regulation"
                      value={customRegulation}
                      onChange={handleCustomRegulationChange}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUsers className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      <option value="">Select Section</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <FaSearch className="mr-2" />
                  Search Students
                </button>
              </div>
            </form>

            {submitted && students.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Feedback Attainment Data</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CO1</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CO2</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CO3</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CO4</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CO5</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student, index) => (
                          <tr key={student._id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNo}</td>
                            {["CO1", "CO2", "CO3", "CO4", "CO5"].map((coKey) => (
                              <td className="px-6 py-4 whitespace-nowrap text-center" key={coKey}>
                                <input
                                  type="number"
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-center"
                                  value={student[coKey]}
                                  onChange={(e) => handleCOChange(index, coKey, e.target.value)}
                                  max={3}
                                  min={0}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      onClick={handleSubmit}
                    >
                      <FaSave className="mr-2" />
                      Save Changes
                    </button>
                  </div>
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

export default IndirectAttainment;
