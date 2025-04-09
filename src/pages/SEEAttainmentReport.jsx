import React, { useEffect, useState } from "react";
import axios from "axios";

const SEEAttainmentReport = () => {
  const selectedBranch = localStorage.getItem("selectedBranch");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [marksData, setMarksData] = useState([]);

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

  const fetchMarks = async (id) => {
    try {
      const marksUrl = `${process.env.REACT_APP_BACKEND_URI}/api/marks/${id}/SEE`;
      const res = await axios.get(marksUrl);
      setMarksData(res.data);
    } catch (err) {
      console.error("Failed to fetch marks:", err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto mb-44">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">
        CO SEE Attainment Report
      </h1>

      {/* Dropdowns */}
      <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-center gap-4 mb-10">
        <select
          onChange={(e) => setYear(e.target.value)}
          value={year}
          className="p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Year</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => setSemester(e.target.value)}
          value={semester}
          className="p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Semester</option>
          {semesterOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => {
            setSubjectId(e.target.value);
            fetchMarks(e.target.value);
          }}
          value={subjectId}
          className="p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Subject</option>
          {subjects.map((subj) => (
            <option key={subj._id} value={subj._id}>
              {subj.name}
            </option>
          ))}
        </select>
      </div>

      {/* Marks Table */}
      {marksData.length > 0 && (
        <>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full bg-white shadow-md">
              <thead className="bg-blue-100 text-blue-800 text-md rounded-t-2xl">
                <tr>
                  <th className="py-3 px-4 border-b">S No</th>
                  <th className="py-3 px-4 border-b">Roll No</th>
                  <th className="py-3 px-4 border-b">FINAL Grade Point</th>
                  <th className="py-3 px-4 border-b">Grade Value</th>
                </tr>
              </thead>
              <tbody>
                {marksData.map((entry, index) => {
                  const percent = (entry.marks / entry.maxMarks) * 100;
                  let gradePoint = 0;

                  if (percent >= 90) gradePoint = 10;
                  else if (percent >= 80) gradePoint = 9;
                  else if (percent >= 70) gradePoint = 8;
                  else if (percent >= 60) gradePoint = 7;
                  else if (percent >= 50) gradePoint = 6;
                  else if (percent >= 40) gradePoint = 5;
                  else gradePoint = 0;

                  entry.finalGrade = gradeMapper[gradePoint]; // add grade to entry

                  return (
                    <tr
                      key={entry._id || index}
                      className="text-center hover:bg-blue-50 transition duration-200"
                    >
                      <td className="py-2 px-4 border-b">{index + 1}</td>
                      <td className="py-2 px-4 border-b">
                        {entry.student?.rollNo}
                      </td>
                      <td className="py-2 px-4 border-b">{gradePoint}</td>
                      <td className="py-2 px-4 border-b">{entry.finalGrade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Table */}
          <div className="overflow-x-auto">
            <table className="min-w-1/2 bg-white shadow-md">
              <thead className="bg-green-100 text-green-800 text-md">
                <tr>
                  <th className="py-3 px-4 border-b text-left">Metric</th>
                  <th className="py-3 px-8 border-b text-left">Value</th>
                </tr>
              </thead>
              <tbody className="text-left">
                {(() => {
                  const attempted = marksData.length;
                  const securedAboveThreshold = marksData.filter((entry) =>
                    ["S", "A", "B", "C", "D", "E"].includes(entry.finalGrade)
                  ).length;

                  const percentSecured = attempted
                    ? (securedAboveThreshold / attempted).toFixed(2)
                    : 0;

                  const attainmentLevel =
                    percentSecured >= 0.7
                      ? 3
                      : percentSecured >= 0.5
                      ? 2
                      : percentSecured >= 0.1
                      ? 1
                      : 0;

                  return (
                    <>
                      <tr>
                        <td className="py-2 px-4 border-b">
                          No. of Students Attempted
                        </td>
                        <td className="py-2 px-8 border-b">{attempted}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">
                          No. of Students secured &gt; Threshold
                        </td>
                        <td className="py-2 px-8 border-b">
                          {securedAboveThreshold}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">
                          % of Students secured &gt; Threshold marks
                        </td>
                        <td className="py-2 px-8 border-b">
                          {(percentSecured * 100).toFixed(2)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">Attainment Level</td>
                        <td className="py-2 px-8 border-b">
                          {attainmentLevel}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b">
                          CO SEE ATTAINMENT
                        </td>
                        <td className="py-2 px-8 border-b">
                          {attainmentLevel}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}

      {marksData.length === 0 && subjectId && (
        <div className="text-center text-gray-500 mt-10">
          No marks data found for this subject.
        </div>
      )}
    </div>
  );
};

export default SEEAttainmentReport;
