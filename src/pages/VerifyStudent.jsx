import React, { useState } from "react";
import axios from "axios";

const VerifyStudent = () => {
  const [rollNo, setRollNo] = useState("");
  const [studentData, setStudentData] = useState(null);

  const fetchStudentMarks = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/students/getall/${rollNo}`
      );
      setStudentData(response.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
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
      return <p>No data available</p>;
    }

    // Extract subjects dynamically
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
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Subjects</th>
              {testTypes.map((testType, index) => (
                <th key={index} className="border border-gray-300 px-4 py-2">
                  {testType}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2 font-semibold text-left">
                  {subject}
                </td>
                {testTypes.map((testType, i) => {
                  // Find the backend key that corresponds to the current table header (testType)
                  const backendExamType = Object.keys(mapExamTypes).find(
                    (key) => mapExamTypes[key] === testType
                  );

                  return (
                    <td
                      key={i}
                      className="border border-gray-300 px-4 py-2 text-center"
                    >
                      {/* Access marks for the backend exam type */}
                      {studentData.marks[subject][backendExamType]?.marks ||
                        "N/A"}
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
    <div className="min-h-screen flex flex-col items-center">
      {/* First div: Centered Roll No Input */}
      <div className="bg-white shadow-md rounded-lg mb-1 p-6 mb-8 w-full max-w-xl mt-16">
        <div>
          <h2 className="text-xl text-primary font-bold mb-4 text-center">
            Student marks verification
          </h2>
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="border border-gray-300 rounded px-8 py-2 mb-2"
              placeholder="Roll No"
            />
            <button
              onClick={handleGenerateTable}
              className="bg-blue-500 mt-4 text-white items-left px-3 py-2 ml-36 rounded hover:bg-blue-600"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Second div: Table rendered below the input */}
      {studentData ? (
        <div className="w-full bg-white shadow-xl rounded-lg mb-18 p-6 mb-8 w-full max-w-5xl">
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Marks for Student, {studentData.student} with Roll No:{" "}
              {studentData.rollNo}
            </h3>
            {renderTable()}
          </div>
        </div>
      ) : (
        <div className="flex-grow"></div> // Ensures footer stays at the bottom when no table is rendered
      )}
    </div>
  );
};

export default VerifyStudent;
