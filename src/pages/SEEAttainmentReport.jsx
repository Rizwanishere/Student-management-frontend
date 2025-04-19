import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaGraduationCap, FaBook, FaChalkboardTeacher } from 'react-icons/fa';
import Loader from "../utils/Loader";

const SEEAttainmentReport = () => {
  const selectedBranch = localStorage.getItem("selectedBranch");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [marksData, setMarksData] = useState([]);

  // Add new state for CO numbers
  const [coNumbers, setCoNumbers] = useState([]);

  const yearOptions = [1, 2, 3, 4];
  const semesterOptions = [1, 2];

  const gradeMapper = {
    10: "S",
    9: "A",
    8: "B",
    7: "C",
    6: "D",
    5: "E",
    0: "F",
  };

  const fetchMarks = async (id) => {
    try {
      const marksUrl = `${process.env.REACT_APP_BACKEND_URI}/api/marks/${id}/SEE`;
      const res = await axios.get(marksUrl);
      
      // Process the marks data to add grades
      const processedData = res.data.map(entry => {
        const percent = (entry.marks / entry.maxMarks) * 100;
        let gradePoint = 0;

        if (percent >= 90) gradePoint = 10;
        else if (percent >= 80) gradePoint = 9;
        else if (percent >= 70) gradePoint = 8;
        else if (percent >= 60) gradePoint = 7;
        else if (percent >= 50) gradePoint = 6;
        else if (percent >= 40) gradePoint = 5;
        else gradePoint = 0;

        return {
          ...entry,
          gradePoint,
          finalGrade: gradeMapper[gradePoint]
        };
      });

      setMarksData(processedData);
      
      // Only fetch CIE data and post attainment if we have marks data
      if (processedData.length > 0) {
        // Calculate attainment level here before passing to fetchCIEAttainment
        const attempted = processedData.length;
        const securedAboveThreshold = processedData.filter((entry) =>
          ["S", "A", "B", "C", "D", "E"].includes(entry.finalGrade)
        ).length;

        const percentSecured = attempted ? (securedAboveThreshold / attempted) : 0;
        const calculatedAttainmentLevel = percentSecured >= 0.7 ? 3 
          : percentSecured >= 0.5 ? 2 
          : percentSecured >= 0.1 ? 1 
          : 0;

        await fetchCIEAttainment(id, calculatedAttainmentLevel);
      }
    } catch (err) {
      console.error("Failed to fetch marks:", err);
    }
  };

  const fetchCIEAttainment = async (id, calculatedAttainmentLevel) => {
    try {
      const [cie1Response, cie2Response] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${id}/examType/CIE-1`),
        axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${id}/examType/CIE-2`)
      ]);

      // Extract unique CO numbers from both CIE-1 and CIE-2
      const cie1COs = cie1Response.data[0]?.attainmentData?.map(item => item.coNo) || [];
      const cie2COs = cie2Response.data[0]?.attainmentData?.map(item => item.coNo) || [];
      
      // Combine and remove duplicates
      const uniqueCOs = [...new Set([...cie1COs, ...cie2COs])].sort();
      setCoNumbers(uniqueCOs);

      // Post the CO numbers for SEE attainment with the passed attainment level
      await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/attainment`, {
        subject: id,
        attainmentData: uniqueCOs.map(coNo => ({ 
          coNo,
          attainmentLevel: calculatedAttainmentLevel // Use the passed attainment level
        })),
        attainmentType: "direct",
        examType: "SEE"
      });
    } catch (err) {
      console.error("Failed to fetch CIE data or post SEE attainment:", err);
    }
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      if (year && semester) {
        const subjectsUrl = `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${year}/semester/${semester}`;
        try {
          const res = await axios.get(subjectsUrl);
          setSubjects(res.data);
        } catch (err) {
          console.error("Failed to fetch subjects:", err);
        }
      }
    };
    fetchSubjects();
  }, [year, semester]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 -mx-8 -mt-8 px-8 py-6 mb-8">
              <h1 className="text-2xl font-bold text-white text-center">
                CO SEE Attainment Report
              </h1>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    onChange={(e) => setYear(e.target.value)}
                    value={year}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
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
                    onChange={(e) => setSemester(e.target.value)}
                    value={semester}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  >
                    <option value="">Select Semester</option>
                    {semesterOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaChalkboardTeacher className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      fetchMarks(e.target.value);
                    }}
                    value={subjectId}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subj) => (
                      <option key={subj._id} value={subj._id}>
                        {subj.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Marks Table */}
            {marksData.length > 0 && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Final Grade Point</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {marksData.map((entry, index) => (
                          <tr key={entry._id || index} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.student?.rollNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">{entry.gradePoint}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">{entry.finalGrade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(() => {
                          const attempted = marksData.length;
                          const securedAboveThreshold = marksData.filter((entry) =>
                            ["S", "A", "B", "C", "D", "E"].includes(entry.finalGrade)
                          ).length;

                          const percentSecured = attempted
                            ? (securedAboveThreshold / attempted).toFixed(2)
                            : 0;

                          const attainmentLevel =
                            percentSecured >= 0.7 ? 3
                            : percentSecured >= 0.5 ? 2
                            : percentSecured >= 0.1 ? 1
                            : 0;

                          return (
                            <>
                              <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">No. of Students Attempted</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{attempted}</td>
                              </tr>
                              <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">No. of Students secured > Threshold</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{securedAboveThreshold}</td>
                              </tr>
                              <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">% of Students secured > Threshold marks</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{(percentSecured * 100).toFixed(2)}%</td>
                              </tr>
                              <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">Attainment Level</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{attainmentLevel}</td>
                              </tr>
                              <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">CO SEE ATTAINMENT</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-bold">{attainmentLevel}</td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {marksData.length === 0 && subjectId && (
              <div className="text-center text-gray-500 mt-8 p-8 bg-gray-50 rounded-lg">
                No marks data found for this subject.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEEAttainmentReport;
