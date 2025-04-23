import React, { useState } from "react";

function PostStudent() {
  const [studentData, setStudentData] = useState("");
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (event) => {
    setStudentData(event.target.value);
    setErrorMessage(""); // Clear error message on input change
  };

  const handleSubmit = async () => {
    try {
      const records = JSON.parse(studentData); // Parse the entire input as an array

      if (Array.isArray(records)) {
        for (const record of records) {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URI}/api/students`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(record),
          });

          if (response.ok) {
            const data = await response.json();
            setSubmittedRecords((prevRecords) => [...prevRecords, data]);
          } else {
            setErrorMessage(`Error submitting record: ${response.status}`);
          }
        }
      } else {
        setErrorMessage(
          "Invalid input format. Expected an array of JSON objects."
        );
      }
    } catch (error) {
      setErrorMessage("Invalid JSON format. Please check your input.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Student Records Input</h2>
        <textarea
          rows="19"
          cols="80"
          value={studentData}
          onChange={handleInputChange}
          placeholder="Enter student records in JSON array format e.g: 
          [
            {
            'rollNo': '123',
            'name': 'John',
            'fartherName': 'Doe',
            'branch': 'CSE',
            'currentYear': 4,
            'currentSemester': 1,
            'section': 'B'
            },
            { 
            'rollNo': '123',
            'name': 'John',
            'fartherName': 'Doe',
            'branch': 'CSE',
            'currentYear': 4,
            'currentSemester': 1,
            'section': 'B' 
            }
          ]"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Students
        </button>

        {errorMessage && (
          <div className="mt-4 text-red-500">{errorMessage}</div>
        )}

        {submittedRecords.length > 0 && (
          <ul className="mt-4">
            {submittedRecords.map((record, index) => (
              <li key={index} className="border-b py-2">
                Submitted record: {JSON.stringify(record.rollNo)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PostStudent;
