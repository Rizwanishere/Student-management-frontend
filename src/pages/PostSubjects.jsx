import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function PostSubjects() {
  const [subjectData, setSubjectData] = useState("");
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    setSubjectData(event.target.value);
    setErrorMessage(""); // Clear error message on input change
  };

  const handleSubmit = async () => {
    try {
      const records = JSON.parse(subjectData); // Parse the entire input as an array

      if (Array.isArray(records)) {
        // Send all records in a single API call
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URI}/api/subjects`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(records), // Send the entire array
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSubmittedRecords(data); // Set all returned subjects at once
          setErrorMessage(""); // Clear any previous errors
        } else {
          setErrorMessage(`Error submitting subjects: ${response.status}`);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/home")}
          className="mb-6 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subject Records Input</h2>
          <textarea
            rows="19"
            cols="80"
            value={subjectData}
            onChange={handleInputChange}
            placeholder="Enter subject records in JSON array format e.g: 
          [
            {
              'name': 'Software Engineering',
              'branch': 'CSE',
              'year': 3,
              'semester': 1,
              'regulation': 'LR22',
              'courseCode': 'CS301'
            },
            {
              'name': 'Database Management',
              'branch': 'CSE', 
              'year': 3,
              'semester': 1,
              'regulation': 'LR22',
              'courseCode': 'CS302'
            }
          ]"
            className="border p-2 rounded w-full"
          />
          <button
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit All Subjects
          </button>

          {errorMessage && (
            <div className="mt-4 text-red-500">{errorMessage}</div>
          )}

          {submittedRecords.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">
                Successfully submitted {submittedRecords.length} subjects:
              </h3>
              <ul className="space-y-2">
                {submittedRecords.map((record, index) => (
                  <li key={index} className="border-b py-2">
                    {record.name} ({record.courseCode}) - Year {record.year},
                    Sem {record.semester}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostSubjects;
