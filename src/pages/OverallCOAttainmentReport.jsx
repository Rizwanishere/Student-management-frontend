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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OverallCOAttainmentReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [directAttainment, setDirectAttainment] = useState([]);
  const [indirectAttainment, setIndirectAttainment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [actionPlans, setActionPlans] = useState({});

  const handleSubmit = () => {
    setShowTable(true);
  };

  const fetchSubjects = async () => {
    if (selectedYear && selectedSemester) {
      try {
        setLoading(true);
        const response = await axios.get(
          `${
            process.env.REACT_APP_BACKEND_URI
          }/api/subjects/branch/${localStorage.getItem(
            "selectedBranch"
          )}/year/${selectedYear}/semester/${selectedSemester}`
        );
        setSubjectOptions(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
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
  }, [selectedYear, selectedSemester]);

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

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Submit
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-center">
            <Loader />
          </p>
        )}

        {showTable && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center">
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
          </>
        )}
      </div>
    </div>
  );
};

export default OverallCOAttainmentReport;
