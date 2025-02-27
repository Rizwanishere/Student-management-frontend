import React, { useState, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import moment from "moment";
import html2pdf from "html2pdf.js";
import Loader from "../utils/Loader";

const ProgressReport = () => {
  const [rollNo, setRollNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
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
    if (!rollNo || !startDate || !endDate) {
      setError("Please provide Roll No, Start Date, and End Date.");
      return;
    }
    setLoading(true);
    setError("");
    setReportData(null);

    try {
      const formattedStartDate = moment(startDate).format("DD/MM/YYYY");
      const formattedEndDate = moment(endDate).format("DD/MM/YYYY");
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URI}/api/students/${rollNo}/data`,
        { params: { startDate: formattedStartDate, endDate: formattedEndDate } }
      );
      setReportData(response.data);
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

  const groupDataBySubject = () => {
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

  const calculateTotals = () => {
    const groupedData = groupDataBySubject();

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

  const totals = calculateTotals();

  const generatePDF = () => {
    const input = printRef.current;
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      pdf.save("progress-report.pdf");
    });
  };

  const captureAndGeneratePDF = () => {
    const element = document.getElementById("elementToCapture"); // Target the element you want to capture

    const options = {
      margin: 1,
      filename: `Progress report - ${reportData.studentName}`,
      image: { type: "jpeg", quality: 1 }, // Maximum quality for images
      html2canvas: {
        scale: 4, // Increase the scale to improve clarity (try different values)
        logging: true, // Set to true to debug rendering issues
        useCORS: true, // Use CORS for external images (important if using external logos or images)
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        precision: 16, // High precision for better quality
      },
    };

    html2pdf()
      .from(element) // Element to capture
      .set(options) // Set the options
      .save(); // Trigger download of the generated PDF
  };

  const presentDate = new Date().toLocaleDateString("en-GB");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      {/* Form */}
      <form
        className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold mb-4">Progress Report</h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Roll No
          </label>
          <input
            type="text"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Enter Roll No"
            required
          />
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
          className="w-full bg-blue-500 text-white font-semibold rounded-lg p-2 hover:bg-blue-600 transition"
        >
          Generate Report
        </button>
      </form>

      {/* Error and Loading States */}
      {error && <p className="text-red-500">{error}</p>}
      {loading && <Loader loading={loading} />}

      {/* Report Section */}
      {reportData && (
        <div
          id="elementToCapture"
          ref={printRef}
          className="w-[210mm] h-[297mm] mx-auto p-10 bg-white"
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
                  Accredited with ‘A’ grade by NAAC | Accredited by NBA
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
                Academic Year: <span className="font-semibold">2024-2025</span>
              </p>
              <p className="text-right font-semibold mr-3">
                Date: {presentDate}
              </p>
            </div>
            <div className="flex justify-between mt-1">
              <p>
                Name of the Student:{" "}
                <span className="font-semibold">{reportData.studentName}</span>
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
                {groupDataBySubject().map((data, index) => (
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
                    {totals.totalClasses}
                  </td>
                  <td className="border border-black p-2">
                    {totals.classesAttended}
                  </td>
                  <td colSpan="4" className="border border-black p-2">
                    {totals.totalMarks}
                  </td>
                </tr>
                {/* Percentage Row */}
                <tr className="text-center font-semibold">
                  <td colSpan="2" className="border border-black p-2">
                    Percentage
                  </td>
                  <td colSpan="2" className="border border-black p-2 font-bold">
                    {totals.attendancePercentage}%
                  </td>
                  <td colSpan="4" className="border border-black p-2 font-bold">
                    {totals.marksPercentage}%
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
                <p className="font-bold inline">Osmania University</p> rules, a
                student must have minimum attendance of 75% in aggregate of all
                the subjects to be eligible or promoted for the next year.{" "}
                <p className="inline font-bold">
                  Students having less than 75% attendance in aggregate will not
                  be issued Hall Ticket for the examination; such students will
                  come under Condonation/Detention category.
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
              <tbody>
                {/* Empty rows */}
                <tr>
                  <td className="border border-black px-2 py-2 text-white">
                    hello
                  </td>
                  <td className="border border-black px-2 py-2 text-white">
                    hello
                  </td>
                  <td className="border border-black px-2 py-2 text-white">
                    hello
                  </td>
                </tr>
              </tbody>
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
      )}

      {/* Button to Generate PDF */}
      {reportData && (
        <button
          onClick={captureAndGeneratePDF}
          className="bg-blue-500 text-white p-2 rounded mt-4"
        >
          Download PDF
        </button>
      )}
    </div>
  );
};

export default ProgressReport;
