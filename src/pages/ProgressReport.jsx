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
            return null;
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
        scrollY: 0,
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Progress Reports
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="mb-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Roll No
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={startRollNo}
                      onChange={(e) => setStartRollNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      placeholder="Enter Start Roll No"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    End Roll No
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={endRollNo}
                      onChange={(e) => setEndRollNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      placeholder="Enter End Roll No"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <FaSearch className="mr-2" />
                  Generate Reports
                </button>
              </div>
            </form>

            {reportsData.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Generated {reportsData.length} Reports from {startRollNo}{" "}
                      to {endRollNo}
                    </h2>
                    <button
                      onClick={captureAndGeneratePDF}
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-secondary transition-all duration-200"
                    >
                      <FaDownload className="mr-2" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div
              id="allReportsContainer"
              className="print:block"
              style={{ margin: 0, padding: 0 }}
            >
              {reportsData.map((reportData, reportIndex) => (
                <div
                  key={reportData.rollNo}
                  className="bg-white pdf-page"
                  style={{
                    width: "210mm",
                    height: "297mm",
                    padding: "10mm",
                    margin: "0 auto",
                    fontFamily: "Times New Roman, serif",
                    pageBreakInside: "avoid",
                    pageBreakBefore: "auto",
                    pageBreakAfter: "auto",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    position: "relative",
                  }}
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
                        <p className="text-md text-center font-bold">
                          (Autonomous)
                        </p>
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
                            calculateSemester(
                              reportData.year,
                              reportData.semester
                            )
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
                      The following are the details of the attendance and
                      Continuous Internal Evaluation-1 of your ward. It is
                      furnished for your information.
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
                            (From {moment(startDate).format(
                              "DD-MM-YYYY"
                            )} to {moment(endDate).format("DD-MM-YYYY")})
                          </th>
                          <th colSpan="4" className="border border-black p-1">
                            CIE-1 Marks <br />
                          </th>
                        </tr>
                        <tr>
                          <th className="border border-black p-1">
                            No. of Classes
                          </th>
                          <th className="border border-black p-1 w-[130px]">
                            No. of Classes Attended
                          </th>
                          <th className="border border-black p-1">DT (20)</th>
                          <th className="border border-black p-1">ST (10)</th>
                          <th className="border border-black p-1">AT (10)</th>
                          <th className="border border-black p-1">
                            Total (40)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupDataBySubject(reportData).map((data, index) => (
                          <tr key={data.subjectId} className="text-center">
                            <td className="border border-black p-1">
                              {index + 1}
                            </td>
                            <td className="border border-black p-1">
                              {data.subjectName}
                            </td>
                            <td className="border border-black p-1 font-bold">
                              {data.totalClasses || "-"}
                            </td>
                            <td className="border border-black p-1">
                              {data.classesAttended || "-"}
                            </td>
                            <td className="border border-black p-1">
                              {data.DT}
                            </td>
                            <td className="border border-black p-1">
                              {data.ST}
                            </td>
                            <td className="border border-black p-1">
                              {data.AT}
                            </td>
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
                    *DT – Descriptive Test ST-Surprise Test AT- Assignment
                    AB-Absent NS-Not Submitted
                  </h4>

                  {/* Important Notes */}
                  <div className="mt-2">
                    <p className="font-bold">Important Note:</p>
                    <ul className="text-sm mt-4 list-disc ml-5">
                      <li>
                        As per the{" "}
                        <p className="font-bold inline">Osmania University</p>{" "}
                        rules, a student must have minimum attendance of 75% in
                        aggregate of all the subjects to be eligible or promoted
                        for the next year.{" "}
                        <p className="inline font-bold">
                          Students having less than 75% attendance in aggregate
                          will not be issued Hall Ticket for the examination;
                          such students will come under Condonation/Detention
                          category.
                        </p>
                      </li>
                      <li className="font-bold">
                        As per State Government rules, the student is not
                        eligible for Scholarship if the attendance is less than
                        75%.
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
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loader loading={loading} />
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default ProgressReport;
