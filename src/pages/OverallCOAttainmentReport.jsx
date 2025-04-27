import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import Loader from "../utils/Loader";
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
import { FaFilePdf, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OverallCOAttainmentReport = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [directAttainment, setDirectAttainment] = useState([]);
  const [indirectAttainment, setIndirectAttainment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [actionPlans, setActionPlans] = useState({});

  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [customRegulation, setCustomRegulation] = useState("");
  const [showCustomRegulation, setShowCustomRegulation] = useState(false);

  const regulations = ["LR21", "LR22", "LR23", "Other"];

  const handleRegulationChange = (e) => {
    const value = e.target.value;
    setSelectedRegulation(value);
    setShowCustomRegulation(value === "Other");
    if (value !== "Other") {
      setCustomRegulation("");
    }
  };

  const handleCustomRegulationChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(value)) {
      setCustomRegulation(value);
      setSelectedRegulation(value);
    }
  };

  const handleSubmit = () => {
    setShowTable(true);
  };

  const fetchSubjects = async () => {
    if (selectedYear && selectedSemester) {
      try {
        setLoading(true);
        const regulationValue = showCustomRegulation
          ? customRegulation
          : selectedRegulation;
        const response = await axios.get(
          `${
            process.env.REACT_APP_BACKEND_URI
          }/api/subjects/branch/${localStorage.getItem(
            "selectedBranch"
          )}/year/${selectedYear}/semester/${selectedSemester}/regulation/${regulationValue}`
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

  const fetchAttainments = async () => {
    if (selectedSubject) {
      try {
        setLoading(true);
        const [directResponse, indirectResponse] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/attainmentType/computedDirect`
          ),
          axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/attainmentType/computedIndirect`
          ),
        ]);
        setDirectAttainment(directResponse.data[0]?.attainmentData || []);
        setIndirectAttainment(indirectResponse.data[0]?.attainmentData || []);

        // Initialize action plans with default values
        const initialActionPlans = {};
        directResponse.data[0]?.attainmentData.forEach((item) => {
          initialActionPlans[item.coNo] =
            "• Assignment for critical topics\n• Solutions for problems in previous question papers";
        });
        setActionPlans(initialActionPlans);
      } catch (error) {
        console.error("Error fetching attainments:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [
    selectedYear,
    selectedSemester,
    selectedRegulation,
    customRegulation,
    showCustomRegulation,
  ]);

  useEffect(() => {
    fetchAttainments();
  }, [selectedSubject]);

  const calculateOverallAttainment = () => {
    return directAttainment.map((direct) => {
      const indirect = indirectAttainment.find(
        (indirect) => indirect.coNo === direct.coNo
      );
      const overall = indirect
        ? (
            0.8 * direct.attainmentLevel +
            0.2 * indirect.attainmentLevel
          ).toFixed(2)
        : direct.attainmentLevel;
      return {
        coNo: direct.coNo,
        direct: direct.attainmentLevel,
        indirect: indirect?.attainmentLevel || 0,
        overall: parseFloat(overall),
      };
    });
  };

  const overallData = calculateOverallAttainment();

  // Calculate average CO attainment
  const calculateAverageAttainment = () => {
    if (overallData.length === 0) return 0;
    const sum = overallData.reduce((total, item) => total + item.overall, 0);
    return (sum / overallData.length).toFixed(2);
  };

  const averageAttainment = calculateAverageAttainment();

  const renderGraph = () => {
    const data = {
      labels: overallData.map((item) => item.coNo),
      datasets: [
        {
          label: "CO Overall Attainment",
          data: overallData.map((item) => item.overall),
          backgroundColor: "rgba(220, 53, 69, 0.8)",
          borderColor: "rgba(220, 53, 69, 1)",
          borderWidth: 1,
          barThickness: 30,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "CO Overall Attainment",
          font: {
            size: 18,
            weight: "bold",
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 3.0,
          ticks: {
            stepSize: 0.5,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    };

    return (
      <div style={{ height: "350px", width: "100%" }}>
        <Bar data={data} options={options} />
      </div>
    );
  };

  const handleActionPlanChange = (coNo, value) => {
    setActionPlans({
      ...actionPlans,
      [coNo]: value,
    });
  };

  const handleSubmitAttainments = async () => {
    const attainmentData = overallData.map((item) => ({
      coNo: item.coNo,
      attainmentLevel: item.overall,
    }));

    const payload = {
      subject: selectedSubject,
      attainmentData,
      attainmentType: "computedOverall",
      examType: "COMPUTED",
    };

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}/api/attainment`,
        payload
      );
      alert("Attainments submitted successfully!");
    } catch (error) {
      console.error("Error submitting attainments:", error);
      alert("Failed to submit attainments. Please try again.");
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

      // Get the elements we want to capture (only the content, not the dropdowns and buttons)
      const contentElement = document.querySelector(".flex.flex-col.gap-6");

      if (!contentElement) {
        throw new Error("Content not found. Please ensure all data is loaded.");
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

      // Capture the content
      const contentCanvas = await captureElement(contentElement);
      if (!contentCanvas) {
        throw new Error("Failed to capture content");
      }

      const contentImgData = contentCanvas.toDataURL("image/jpeg", 1.0);
      const contentWidth = pdf.internal.pageSize.getWidth() - 20;
      const contentHeight =
        (contentCanvas.height * contentWidth) / contentCanvas.width;

      // Add content to PDF
      pdf.addImage(contentImgData, "JPEG", 10, 10, contentWidth, contentHeight);

      // Save the PDF
      pdf.save("Overall_CO_Attainment_Report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Error generating PDF: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/reports")}
          className="mb-6 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Reports
        </button>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-blue-600 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              Overall CO Attainment
            </h2>
            {showTable && (
              <button
                onClick={exportToPDF}
                className="inline-flex items-center px-6 py-3 bg-white text-primary rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                <FaFilePdf className="mr-2 text-xl" />
                Export to PDF
              </button>
            )}
          </div>

          {/* Filters with added margin */}
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6 px-4">
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
                  Regulation
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  value={selectedRegulation}
                  onChange={handleRegulationChange}
                >
                  <option value="">Select Regulation</option>
                  {regulations.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
                {showCustomRegulation && (
                  <input
                    type="text"
                    className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                    placeholder="Enter Custom Regulation"
                    value={customRegulation}
                    onChange={handleCustomRegulationChange}
                    pattern="[A-Z0-9]*"
                  />
                )}
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

            <div className="flex justify-center mb-6">
              <button
                onClick={handleSubmit}
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-primary-dark transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <p className="text-center">
            <Loader />
          </p>
        )}

        {showTable && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center mt-12">
              OVERALL CO ATTAINMENT
            </h1>
            <p className="text-lg font-semibold text-center mb-6">
              Computation of Attainment of COs = 80% of Direct CO Attainment +
              20% of Indirect CO Attainment
            </p>
            <hr className="border-t-2 border-black mb-6" />

            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3">
                  <table className="w-full border-collapse border border-gray-800">
                    <thead>
                      <tr>
                        <th
                          className="border border-gray-800 p-3 bg-white text-center"
                          rowSpan="2"
                        >
                          CO
                        </th>
                        <th className="border border-gray-800 p-3 bg-white text-center">
                          Direct CO
                        </th>
                        <th className="border border-gray-800 p-3 bg-white text-center">
                          Indirect CO
                        </th>
                        <th className="border border-gray-800 p-3 bg-white text-center">
                          Overall CO
                        </th>
                      </tr>
                      <tr>
                        <th className="border border-gray-800 p-3 bg-white text-center">
                          Attainment Level (DA)
                        </th>
                        <th className="border border-gray-800 p-3 bg-white text-center">
                          Attainment Level (IDA)
                        </th>
                        <th className="border border-gray-800 p-3 bg-white text-center">
                          Attainment Level ((0.8*DA)+(0.2*IDA))
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {overallData.map((item) => (
                        <tr key={item.coNo}>
                          <td className="border border-gray-800 p-3 text-center font-semibold">
                            {item.coNo}
                          </td>
                          <td className="border border-gray-800 p-3 text-center">
                            {item.direct.toFixed(2)}
                          </td>
                          <td className="border border-gray-800 p-3 text-center">
                            {item.indirect.toFixed(2)}
                          </td>
                          <td className="border border-gray-800 p-3 text-center">
                            {item.overall.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td
                          className="border border-gray-800 p-3 text-right font-semibold"
                          colSpan="3"
                        >
                          Average CO Attainment
                        </td>
                        <td className="border border-gray-800 p-3 text-center font-bold">
                          {averageAttainment}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="md:w-[500px] border border-gray-300 rounded-lg p-4">
                  {renderGraph()}
                </div>
              </div>

              {/* Course Outcome Action Plan Table */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  Course Outcome Action Plan
                </h2>
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr className="bg-white">
                      <th className="border border-gray-800 p-2 text-center w-1/6">
                        CO
                      </th>
                      <th className="border border-gray-800 p-2 text-center w-1/6">
                        Attainment
                      </th>
                      <th className="border border-gray-800 p-2 text-center">
                        Action Plan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {overallData.map((item) => (
                      <tr key={`action-${item.coNo}`}>
                        <td className="border border-gray-800 p-2 text-center font-semibold">
                          {item.coNo}
                        </td>
                        <td className="border border-gray-800 p-2 text-center">
                          {item.overall.toFixed(2)}
                        </td>
                        <td className="border border-gray-800 p-2">
                          <textarea
                            className="w-full p-2 border border-gray-300 rounded"
                            rows="2"
                            value={actionPlans[item.coNo] || ""}
                            onChange={(e) =>
                              handleActionPlanChange(item.coNo, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmitAttainments}
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-primary-dark transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              >
                Submit Attainments
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OverallCOAttainmentReport;
