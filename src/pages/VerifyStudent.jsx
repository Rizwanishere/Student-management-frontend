import React, { useState } from "react";
import axios from "axios";
import { FaSearch, FaUserGraduate } from 'react-icons/fa';
import Loader from "../utils/Loader";

const VerifyStudent = () => {
  const [rollNo, setRollNo] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStudentMarks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URI}/api/students/getall/${rollNo}`
      );
      setStudentData(response.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTable = () => {
    fetchStudentMarks();
  };

  // Mapping backend exam types to table headers
  const mapExamTypes = {
    "ASSIGNMENT-1": "AT-1",
    "ASSIGNMENT-2": "AT-2",
    "ASSIGNMENT-3": "AT-3",
    "SURPRISE TEST-1": "ST-1",
    "SURPRISE TEST-2": "ST-2",
    "SURPRISE TEST-3": "ST-3",
    "CIE-1": "CIE-1",
    "CIE-2": "CIE-2",
  };

  const renderTable = () => {
    if (!studentData || !studentData.marks) {
      return <p className="text-gray-500 text-center mt-4">No data available</p>;
    }

    const subjects = Object.keys(studentData.marks);
    const testTypes = [
      "AT-1",
      "AT-2",
      "AT-3",
      "ST-1",
      "ST-2",
      "ST-3",
      "CIE-1",
      "CIE-2",
    ];

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
              {testTypes.map((testType, index) => (
                <th key={index} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {testType}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjects.map((subject, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {subject}
                </td>
                {testTypes.map((testType, i) => {
                  const backendExamType = Object.keys(mapExamTypes).find(
                    (key) => mapExamTypes[key] === testType
                  );

                  return (
                    <td key={i} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {studentData.marks[subject][backendExamType]?.marks || "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Student Marks Verification</h1>
            </div>

            <div className="max-w-xl mx-auto">
              <div className="flex flex-col space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserGraduate className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    placeholder="Enter Roll Number"
                  />
                </div>

                <button
                  onClick={handleGenerateTable}
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <FaSearch className="mr-2" />
                  Verify Marks
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center mt-8">
                <Loader />
              </div>
            )}

            {studentData && (
              <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Student Details
                    </h2>
                    <p className="text-gray-600">
                      Name: <span className="font-semibold">{studentData.student}</span>
                    </p>
                    <p className="text-gray-600">
                      Roll No: <span className="font-semibold">{studentData.rollNo}</span>
                    </p>
                  </div>
                  {renderTable()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyStudent;
