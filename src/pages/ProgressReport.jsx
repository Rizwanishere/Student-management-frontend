import React, { useState, useRef } from "react";
import axios from "axios";
import moment from "moment";
import html2pdf from "html2pdf.js";
import Loader from "../utils/Loader";
import { FaSearch, FaDownload } from "react-icons/fa";

const ProgressReport = () => {
  const [startRollNo, setStartRollNo] = useState("");
  const [endRollNo, setEndRollNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef();

  const calculateSemester = (year, semester) => (year - 1) * 2 + semester;
  const convertToRoman = (num) => {
    const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    return romanNumerals[num - 1] || num;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startRollNo || !endRollNo || !startDate || !endDate) {
      setError(
        "Please provide Start Roll No, End Roll No, Start Date, and End Date."
      );
      return;
    }

    // Convert roll numbers to integers for range calculation
    const startNum = parseInt(startRollNo);
    const endNum = parseInt(endRollNo);

    if (isNaN(startNum) || isNaN(endNum)) {
      setError("Roll numbers must be valid numbers.");
      return;
    }

    if (startNum > endNum) {
      setError("Start Roll No must be less than or equal to End Roll No.");
      return;
    }

    if (endNum - startNum > 200) {
      setError("Maximum range allowed is 200 roll numbers.");
      return;
    }

    setLoading(true);
    setError("");
    setReportsData([]);

    try {
      const formattedStartDate = moment(startDate).format("DD/MM/YYYY");
      const formattedEndDate = moment(endDate).format("DD/MM/YYYY");

      // Generate array of roll numbers in the range
      const rollNumbers = [];
      for (let i = startNum; i <= endNum; i++) {
        rollNumbers.push(i.toString());
      }

      // Fetch data for all roll numbers in parallel
      const reports = await Promise.all(
        rollNumbers.map(async (rollNo) => {
          try {
            const response = await axios.get(
              `${process.env.REACT_APP_BACKEND_URI}/api/students/${rollNo}/data`,
              {
                params: {
                  startDate: formattedStartDate,
                  endDate: formattedEndDate,
                },
              }
            );
            return response.data;
          } catch (err) {
            console.error(
              `Failed to fetch data for roll number ${rollNo}:`,
              err
            );
            return null; // Return null for failed requests
          }
        })
      );

      // Filter out null values (failed requests)
      const validReports = reports.filter((report) => report !== null);

      if (validReports.length === 0) {
        setError("No valid data found for the provided roll number range.");
      } else {
        setReportsData(validReports);
      }
    } catch (err) {
      setError("Failed to fetch data. Please check the inputs or try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = (attendance) => {
    const filteredAttendance = {};

    attendance.forEach((record) => {
      // Create a unique key for each subject, month, and year
      const key = `${record.subjectId}-${record.year}-${record.month}`;

      // If no record exists for this key, add it
      if (!filteredAttendance[key]) {
        filteredAttendance[key] = record;
      } else {
        // If a record already exists and the current record is `period:30th`, replace it
        if (record.period === "30th") {
          filteredAttendance[key] = record;
        }
      }
    });

    return Object.values(filteredAttendance); // Return filtered attendance as an array
  };

  const calculateAttendanceBySubject = (attendance) => {
    const groupedAttendance = {};

    attendance.forEach((record) => {
      if (!groupedAttendance[record.subjectId]) {
        groupedAttendance[record.subjectId] = {
          subjectId: record.subjectId,
          subjectName: record.subjectName,
          totalClasses: 0,
          classesAttended: 0,
        };
      }

      // Sum up the total classes and classes attended for the subject
      groupedAttendance[record.subjectId].totalClasses += record.totalClasses;
      groupedAttendance[record.subjectId].classesAttended +=
        record.classesAttended;
    });

    return Object.values(groupedAttendance); // Return grouped attendance as an array
  };

  const groupDataBySubject = (reportData) => {
    if (!reportData) return [];

    // Filter and group attendance
    const filteredAttendance = filterAttendance(reportData.attendance);
    const attendanceBySubject =
      calculateAttendanceBySubject(filteredAttendance);

    // Group marks by subjectId
    const groupedMarks = reportData.marks.reduce((acc, mark) => {
      if (!acc[mark.subjectId]) {
        acc[mark.subjectId] = {
          subjectId: mark.subjectId,
          subjectName: mark.subjectName,
          DT: 0,
          ST: 0,
          AT: 0,
          totalMarks: 0,
        };
      }

      // Add marks based on exam type
      if (mark.examType === "CIE-1") acc[mark.subjectId].DT = mark.marks;
      if (mark.examType === "SURPRISE TEST-1")
        acc[mark.subjectId].ST = mark.marks;
      if (mark.examType === "ASSIGNMENT-1") acc[mark.subjectId].AT = mark.marks;

      acc[mark.subjectId].totalMarks =
        acc[mark.subjectId].DT +
        acc[mark.subjectId].ST +
        acc[mark.subjectId].AT;
      return acc;
    }, {});

    // Merge attendance and marks data
    attendanceBySubject.forEach((att) => {
      if (groupedMarks[att.subjectId]) {
        groupedMarks[att.subjectId].totalClasses = att.totalClasses;
        groupedMarks[att.subjectId].classesAttended = att.classesAttended;
      } else {
        groupedMarks[att.subjectId] = {
          subjectId: att.subjectId,
          subjectName: att.subjectName,
          DT: 0,
          ST: 0,
          AT: 0,
          totalMarks: 0,
          totalClasses: att.totalClasses,
          classesAttended: att.classesAttended,
        };
      }
    });

    return Object.values(groupedMarks); // Return the grouped data as an array
  };

  const calculateTotals = (reportData) => {
    const groupedData = groupDataBySubject(reportData);

    const attendanceSummary = groupedData.reduce(
      (totals, data) => {
        totals.totalClasses += data.totalClasses || 0;
        totals.classesAttended += data.classesAttended || 0;
        totals.totalMarks += data.totalMarks || 0;
        return totals;
      },
      { totalClasses: 0, classesAttended: 0, totalMarks: 0 }
    );

    const attendancePercentage = attendanceSummary.totalClasses
      ? (
          (attendanceSummary.classesAttended / attendanceSummary.totalClasses) *
          100
        ).toFixed(2)
      : 0;

    const marksPercentage = groupedData.length
      ? (
          (attendanceSummary.totalMarks / (groupedData.length * 40)) *
          100
        ).toFixed(2)
      : 0;

    return { ...attendanceSummary, attendancePercentage, marksPercentage };
  };

  const captureAndGeneratePDF = () => {
    const element = document.getElementById("allReportsContainer");

    const options = {
      margin: 1,
      filename: `Progress reports - ${startRollNo} to ${endRollNo}`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 4,
        logging: true,
        useCORS: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        precision: 16,
      },
    };

    html2pdf().from(element).set(options).save();
  };

  const presentDate = new Date().toLocaleDateString("en-GB");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      {/* Form */}
      <form
        className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold mb-4">
          Progress Reports Generator
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Start Roll No
            </label>
            <input
              type="text"
              value={startRollNo}
              onChange={(e) => setStartRollNo(e.target.value)}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter Start Roll No"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              End Roll No
            </label>
            <input
              type="text"
              value={endRollNo}
              onChange={(e) => setEndRollNo(e.target.value)}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter End Roll No"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white font-semibold rounded-lg px-6 py-3 hover:bg-blue-600 transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center justify-center"
        >
          <FaSearch className="mr-2" />
          Generate Reports
        </button>
      </form>

      {/* Error and Loading States */}
      {error && <p className="text-red-500">{error}</p>}
      {loading && <Loader loading={loading} />}

      {/* Reports Summary */}
      {reportsData.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-2">Generated Reports</h2>
          <p>Total Reports: {reportsData.length}</p>
          <p>
            Roll Number Range: {startRollNo} to {endRollNo}
          </p>
          <button
            onClick={captureAndGeneratePDF}
            className="bg-primary text-white font-semibold rounded-lg px-6 py-3 hover:bg-blue-600 transition-all duration-300 hover:shadow-lg transform hover:scale-105 flex items-center justify-center mt-4 w-full"
          >
            <FaDownload className="mr-2" />
            Download All Reports PDF
          </button>
        </div>
      )}

      {/* All Reports Container */}
      <div id="allReportsContainer" className="print:block">
        {reportsData.map((reportData, reportIndex) => (
          <div
            key={reportData.rollNo}
            className="w-[210mm] h-[297mm] mx-auto p-10 bg-white mb-8 page-break-after-always"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/en/e/e9/Lords_Institute_of_Engineering_and_Technology_logo.png"
                  alt="Lords Institute Logo"
                  className="w-[100px] h-[100px]"
                />
                <div className="text-left">
                  <h1 className="text-xl font-bold">
                    LORDS INSTITUTE OF ENGINEERING & TECHNOLOGY
                  </h1>
                  <p className="text-md text-center font-bold">(Autonomous)</p>
                  <p className="text-md text-center">
                    Approved by AICTE | Affiliated to Osmania University |
                    Estd.2003
                  </p>
                  <p className="text-md text-center">
                    Accredited with 'A' grade by NAAC | Accredited by NBA
                  </p>
                  <p className="text-lg font-bold text-red-500 text-center">
                    Department of Computer Science and Engineering
                  </p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="mt-4 text-md">
              <div className="flex justify-between">
                <p>
                  Academic Year:{" "}
                  <span className="font-semibold">2024-2025</span>
                </p>
                <p className="text-right font-semibold mr-3">
                  Date: {presentDate}
                </p>
              </div>
              <div className="flex justify-between mt-1">
                <p>
                  Name of the Student:{" "}
                  <span className="font-semibold">
                    {reportData.studentName}
                  </span>
                </p>
                <p className="text-right mt-1">
                  B.E-{" "}
                  <span className="font-semibold">
                    {convertToRoman(
                      calculateSemester(reportData.year, reportData.semester)
                    )}{" "}
                    Semester
                  </span>
                </p>
              </div>
              <p className="mt-1">
                Roll No:{" "}
                <span className="font-semibold">{reportData.rollNo}</span>
              </p>
            </div>

            {/* Greeting Section */}
            <div className="mt-2">
              <p className="text-md font-bold">Dear Parent/Guardian,</p>
              <p className="text-md mt-2">
                The following are the details of the attendance and Continuous
                Internal Evaluation-1 of your ward. It is furnished for your
                information.
              </p>
            </div>

            {/* Table Section */}
            <div className="mt-2">
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th rowSpan="2" className="border border-black p-1">
                      S. No.
                    </th>
                    <th rowSpan="2" className="border border-black p-1">
                      Course Title
                    </th>
                    <th colSpan="2" className="border border-black p-1">
                      Attendance <br />
                      (From {moment(startDate).format("DD-MM-YYYY")} to{" "}
                      {moment(endDate).format("DD-MM-YYYY")})
                    </th>
                    <th colSpan="4" className="border border-black p-1">
                      CIE-1 Marks <br />
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-black p-1">No. of Classes</th>
                    <th className="border border-black p-1 w-[130px]">
                      No. of Classes Attended
                    </th>
                    <th className="border border-black p-1">DT (20)</th>
                    <th className="border border-black p-1">ST (10)</th>
                    <th className="border border-black p-1">AT (10)</th>
                    <th className="border border-black p-1">Total (40)</th>
                  </tr>
                </thead>
                <tbody>
                  {groupDataBySubject(reportData).map((data, index) => (
                    <tr key={data.subjectId} className="text-center">
                      <td className="border border-black p-1">{index + 1}</td>
                      <td className="border border-black p-1">
                        {data.subjectName}
                      </td>
                      <td className="border border-black p-1 font-bold">
                        {data.totalClasses || "-"}
                      </td>
                      <td className="border border-black p-1">
                        {data.classesAttended || "-"}
                      </td>
                      <td className="border border-black p-1">{data.DT}</td>
                      <td className="border border-black p-1">{data.ST}</td>
                      <td className="border border-black p-1">{data.AT}</td>
                      <td className="border border-black p-1">
                        {data.totalMarks}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="text-center font-semibold">
                    <td colSpan="2" className="border border-black p-2">
                      Total
                    </td>
                    <td className="border border-black p-2 font-bold">
                      {calculateTotals(reportData).totalClasses}
                    </td>
                    <td className="border border-black p-2">
                      {calculateTotals(reportData).classesAttended}
                    </td>
                    <td colSpan="4" className="border border-black p-2">
                      {calculateTotals(reportData).totalMarks}
                    </td>
                  </tr>
                  {/* Percentage Row */}
                  <tr className="text-center font-semibold">
                    <td colSpan="2" className="border border-black p-2">
                      Percentage
                    </td>
                    <td
                      colSpan="2"
                      className="border border-black p-2 font-bold"
                    >
                      {calculateTotals(reportData).attendancePercentage}%
                    </td>
                    <td
                      colSpan="4"
                      className="border border-black p-2 font-bold"
                    >
                      {calculateTotals(reportData).marksPercentage}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="mt-1">
              *DT – Descriptive Test ST-Surprise Test AT- Assignment AB-Absent
              NS-Not Submitted
            </h4>

            {/* Important Notes */}
            <div className="mt-2">
              <p className="font-bold">Important Note:</p>
              <ul className="text-sm mt-4 list-disc ml-5">
                <li>
                  As per the{" "}
                  <p className="font-bold inline">Osmania University</p> rules,
                  a student must have minimum attendance of 75% in aggregate of
                  all the subjects to be eligible or promoted for the next year.{" "}
                  <p className="inline font-bold">
                    Students having less than 75% attendance in aggregate will
                    not be issued Hall Ticket for the examination; such students
                    will come under Condonation/Detention category.
                  </p>
                </li>
                <li className="font-bold">
                  As per State Government rules, the student is not eligible for
                  Scholarship if the attendance is less than 75%.
                </li>
              </ul>
            </div>
            {/* Backlog Data */}
            <div className="mt-2">
              <h3 className="font-semibold">Backlog Data:</h3>
              <table className="mt-1 w-full border border-collapse border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center min-h-[40px]">
                      ___ Sem.
                    </th>
                    <th className="border border-black px-2 py-2 text-center min-h-[40px]">
                      ___ Sem.
                    </th>
                    <th className="border border-black px-2 py-2 text-center min-h-[40px]">
                      Remarks by Head of the Department
                    </th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>

            {/* Signature Section */}
            <div className="mt-6 flex justify-between">
              <div className="flex items-center space-x-2">
                <p className="text-sm">Sign. of the Student:</p>
                <div className="border-b border-black w-48 mt-4"></div>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm">Sign. of the Parent/Guardian:</p>
                <div className="border-b border-black w-48 mt-4"></div>
              </div>
            </div>

            {/* Footer with Mentor and HOD */}
            <div className="mt-8 flex justify-between">
              <p className="font-semibold">Mentor</p>
              <p className="font-semibold">Head of the Department</p>
            </div>
          </div>
        ))}
      </div>

      {/* Visible Reports Preview */}
      {reportsData.length > 0 && (
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Report Previews
          </h2>
          <div className="space-y-8">
            {reportsData.slice(0, 3).map((reportData, index) => (
              <div
                key={reportData.rollNo}
                className="bg-white shadow-md rounded-lg p-6 border border-gray-200"
              >
                <h3 className="text-lg font-semibold mb-2">
                  Report {index + 1}: {reportData.studentName} (Roll No:{" "}
                  {reportData.rollNo})
                </h3>
                <p>Total Classes: {calculateTotals(reportData).totalClasses}</p>
                <p>
                  Classes Attended:{" "}
                  {calculateTotals(reportData).classesAttended}
                </p>
                <p>
                  Attendance: {calculateTotals(reportData).attendancePercentage}
                  %
                </p>
                <p>Total Marks: {calculateTotals(reportData).totalMarks}</p>
                <p>
                  Marks Percentage:{" "}
                  {calculateTotals(reportData).marksPercentage}%
                </p>
              </div>
            ))}
            {reportsData.length > 3 && (
              <p className="text-center text-gray-500">
                + {reportsData.length - 3} more reports (all will be included in
                the PDF)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressReport;
