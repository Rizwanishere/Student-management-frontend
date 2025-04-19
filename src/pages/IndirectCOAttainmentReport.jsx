import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaFilePdf } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const IndirectCOAttainmentReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [coHeaders, setCOHeaders] = useState([]);

  const selectedBranch = localStorage.getItem("selectedBranch");

  // Fetch subjects based on selected year, semester, and section
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedSemester) {
        try {
          setLoading(true);
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
          );
          if (
            response.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            setSubjectOptions(response.data);
          } else {
            setSubjectOptions([]);
          }
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubjectOptions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSubjectOptions([]);
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch CO headers from attainment API
  useEffect(() => {
    const fetchCOHeaders = async () => {
      if (selectedSubject) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/examType/SEE`
          );

          if (
            response.data &&
            response.data.length > 0 &&
            response.data[0].attainmentData
          ) {
            const headers = response.data[0].attainmentData.map(
              (item) => item.coNo
            );
            setCOHeaders(headers);
          } else {
            setCOHeaders(["C211.1", "C211.2", "C211.3", "C211.4", "C211.5"]);
          }
        } catch (error) {
          console.error("Error fetching CO headers:", error);
          setCOHeaders(["C211.1", "C211.2", "C211.3", "C211.4", "C211.5"]);
        }
      }
    };
    fetchCOHeaders();
  }, [selectedSubject]);

  // Fetch feedback data based on selected subject
  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (selectedSubject) {
        try {
          setLoading(true);
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/feedbackattainment/subject/${selectedSubject}`
          );
          setFeedbackData(response.data);

          // Find the subject name from options
          const subject = subjectOptions.find((s) => s._id === selectedSubject);
          if (subject) {
            setSubjectName(subject.name);
          }
        } catch (error) {
          console.error("Error fetching feedback data:", error);
          setFeedbackData([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFeedbackData();
  }, [selectedSubject, subjectOptions]);

  // Calculate CO summary data with proper mapping between CO1-CO5 and C211.1-C211.5
  const calculateSummary = () => {
    if (!feedbackData || feedbackData.length === 0 || coHeaders.length === 0) {
      return null;
    }

    const totalStudents = feedbackData.length;
    const summary = {};

    // Map CO1-CO5 to C211.1-C211.5
    const coMapping = {
      "C211.1": "CO1",
      "C211.2": "CO2",
      "C211.3": "CO3",
      "C211.4": "CO4",
      "C211.5": "CO5",
    };

    coHeaders.forEach((coHeader, index) => {
      // Find the corresponding CO field in the feedback data (CO1, CO2, etc.)
      const feedbackField = coMapping[coHeader] || `CO${index + 1}`;

      // Count students at each level
      const level1Count = feedbackData.filter(
        (item) => item[feedbackField] === 1
      ).length;
      const level2Count = feedbackData.filter(
        (item) => item[feedbackField] === 2
      ).length;
      const level3Count = feedbackData.filter(
        (item) => item[feedbackField] === 3
      ).length;

      // Calculate attainment using the formula
      const attainment =
        (1 * level1Count + 2 * level2Count + 3 * level3Count) / totalStudents;

      summary[coHeader] = {
        level1: level1Count,
        level2: level2Count,
        level3: level3Count,
        total: totalStudents,
        attainment: parseFloat(attainment.toFixed(1)),
      };
    });

    return summary;
  };

  const summaryData = calculateSummary();

  const renderGraph = () => {
    if (!summaryData || coHeaders.length === 0) {
      return null;
    }

    const data = {
      labels: coHeaders,
      datasets: [
        {
          label: "CO Indirect Attainment Level",
          data: coHeaders.map((header) => summaryData[header].attainment),
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
          barThickness: 30, // Adjust bar thickness
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false, // Allow custom height and width
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "CO Indirect Attainment Levels",
        },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    };

    return (
      <div style={{ height: "400px", width: "450px", marginTop: "10px" }}>
        {" "}
        {/* Add margin-top and set height */}
        <Bar data={data} options={options} />
      </div>
    );
  };

  const handleSubmitAttainments = async () => {
    if (!summaryData || coHeaders.length === 0) {
      console.log("No data available to submit.");
      return;
    }

    const attainmentData = coHeaders.map((header) => ({
      coNo: header,
      attainmentLevel: summaryData[header].attainment,
    }));

    const payload = {
      subject: selectedSubject,
      attainmentData,
      attainmentType: "computedIndirect",
      examType: "COMPUTED",
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}/api/attainment`,
        payload
      );
      console.log("Attainments submitted successfully:", response.data);
    } catch (error) {
      console.error("Error submitting attainments:", error);
    }
  };

  // Export data to PDF
  const exportToPDF = async () => {
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Get the elements we want to capture
      const firstTableElement = document.querySelector(".bg-white.shadow-lg.rounded-lg.p-6.mb-8 table"); // Student response table
      const secondTableElement = document.querySelectorAll(".bg-white.shadow-lg.rounded-lg.p-6 table")[1]; // CO attainment table
      const graphElement = document.querySelector(".bg-white.shadow-lg.rounded-lg.p-6.mb-8.mt-6"); // Graph container

      if (!firstTableElement || !secondTableElement || !graphElement) {
        throw new Error("Required elements not found. Please ensure all data is loaded.");
      }

      // Function to capture an element as canvas
      const captureElement = async (element) => {
        if (!element) return null;
        
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: "#ffffff",
        });
        return canvas;
      };

      // Add first table (Student response sheet)
      const firstTableCanvas = await captureElement(firstTableElement);
      if (!firstTableCanvas) {
        throw new Error("Failed to capture first table");
      }

      const firstTableImgData = firstTableCanvas.toDataURL("image/jpeg", 1.0);
      const firstTableWidth = pdf.internal.pageSize.getWidth() - 20;
      const firstTableHeight = (firstTableCanvas.height * firstTableWidth) / firstTableCanvas.width;
      
      pdf.addImage(firstTableImgData, "JPEG", 10, 20, firstTableWidth, firstTableHeight);

      // Add second table (CO attainment)
      pdf.addPage();
      const secondTableCanvas = await captureElement(secondTableElement);
      if (!secondTableCanvas) {
        throw new Error("Failed to capture second table");
      }

      const secondTableImgData = secondTableCanvas.toDataURL("image/jpeg", 1.0);
      const secondTableWidth = pdf.internal.pageSize.getWidth() - 20;
      const secondTableHeight = (secondTableCanvas.height * secondTableWidth) / secondTableCanvas.width;
      
      pdf.addImage(secondTableImgData, "JPEG", 10, 20, secondTableWidth, secondTableHeight);

      // Add graph (always on a new page)
      pdf.addPage();
      const graphCanvas = await captureElement(graphElement);
      if (!graphCanvas) {
        throw new Error("Failed to capture graph");
      }

      const graphImgData = graphCanvas.toDataURL("image/jpeg", 1.0);
      const graphWidth = pdf.internal.pageSize.getWidth() - 40;
      const graphHeight = (graphCanvas.height * graphWidth) / graphCanvas.width;
      
      pdf.addImage(graphImgData, "JPEG", 20, 20, graphWidth, graphHeight);

      // Save the PDF
      pdf.save("Indirect_CO_Attainment_Report.pdf");

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Error generating PDF: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="bg-gradient-to-r from-primary to-blue-600 p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">
              CO ATTAINMENT (INDIRECT METHOD)
            </h1>
            {summaryData && (
              <button
                onClick={exportToPDF}
                className="inline-flex items-center px-6 py-3 bg-white text-primary rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                <FaFilePdf className="mr-2 text-xl" />
                Export to PDF
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 mt-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Select Year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Semester
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Section
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="">Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={loading || subjectOptions.length === 0}
              >
                <option value="">Select Subject</option>
                {subjectOptions.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        )}

        {!loading && feedbackData.length > 0 && (
          <>
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-2 text-blue-800">
                Course End Semester Feedback Student's Response sheet:
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="px-4 py-2 border border-gray-300 text-center">
                        S.No.
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-center">
                        Roll. No.
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-center">
                        CO1
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-center">
                        CO2
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-center">
                        CO3
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-center">
                        CO4
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-center">
                        CO5
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackData.map((feedback, index) => (
                      <tr
                        key={feedback._id || index}
                        className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="px-4 py-2 border border-gray-300 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-center">
                          {feedback.student?.rollNo ||
                            `160921733${(index + 1)
                              .toString()
                              .padStart(3, "0")}`}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-center">
                          {feedback.CO1}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-center">
                          {feedback.CO2}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-center">
                          {feedback.CO3}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-center">
                          {feedback.CO4}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-center">
                          {feedback.CO5}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {summaryData && (
              <>
                <div className="bg-white shadow-lg rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 text-blue-800">
                    Computation of CO Indirect Attainment in the course:
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="px-4 py-2 border border-gray-300 text-center">
                            Course Outcomes
                          </th>
                          {coHeaders.map((header) => (
                            <th
                              key={header}
                              className="px-4 py-2 border border-gray-300 text-center"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border border-gray-300 font-bold">
                            Students Answered Level-1
                          </td>
                          {coHeaders.map((header) => (
                            <td
                              key={`${header}-l1`}
                              className="px-4 py-2 border border-gray-300 text-center"
                            >
                              {summaryData[header].level1}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border border-gray-300 font-bold">
                            Students Answered Level-2
                          </td>
                          {coHeaders.map((header) => (
                            <td
                              key={`${header}-l2`}
                              className="px-4 py-2 border border-gray-300 text-center"
                            >
                              {summaryData[header].level2}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border border-gray-300 font-bold">
                            Students Answered Level-3
                          </td>
                          {coHeaders.map((header) => (
                            <td
                              key={`${header}-l3`}
                              className="px-4 py-2 border border-gray-300 text-center"
                            >
                              {summaryData[header].level3}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border border-gray-300 font-bold">
                            Total Students participated
                          </td>
                          {coHeaders.map((header) => (
                            <td
                              key={`${header}-total`}
                              className="px-4 py-2 border border-gray-300 text-center"
                            >
                              {summaryData[header].total}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border border-gray-300 font-bold">
                            CO Indirect Attainment Level
                          </td>
                          {coHeaders.map((header) => (
                            <td
                              key={`${header}-attainment`}
                              className="px-4 py-2 border border-gray-300 text-center font-bold text-xl"
                            >
                              {summaryData[header].attainment}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6 mb-8 mt-6 flex justify-center">
                  {" "}
                  {/* Added flex and justify-center to align graph in center */}
                  <div style={{ height: "500px", width: "450px" }}>
                    {" "}
                    {/* Adjusted width to match graph box */}
                    <h2 className="text-xl font-bold mb-4 text-blue-800 text-center">
                      {" "}
                      {/* Centered the heading */}
                      Graphical Representation of CO Indirect Attainment:
                    </h2>
                    {renderGraph()}
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleSubmitAttainments}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Submit Attainments
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {!loading && selectedSubject && feedbackData.length === 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <p className="text-gray-600">
              No feedback data available for the selected subject.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndirectCOAttainmentReport;
