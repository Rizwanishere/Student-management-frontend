import React from "react";
import { Link } from "react-router-dom";
import { FaChartBar, FaClipboardList, FaUserCheck, FaGraduationCap, FaChartLine, FaFileAlt, FaCheckCircle, FaChartPie } from "react-icons/fa";

function ReportsPage() {
  const reportCategories = {
    "Academic Reports": {
      gradient: "from-blue-600 to-blue-400",
      reports: [
        {
          title: "Attendance Report",
          description: "View detailed attendance data for a period",
          icon: <FaUserCheck className="text-2xl" />,
          link: "/reports/attendance",
          gradient: "from-blue-500 to-blue-400",
        },
        {
          title: "Marks Report",
          description: "Access comprehensive marks data for types of tests",
          icon: <FaClipboardList className="text-2xl" />,
          link: "/reports/marks",
          gradient: "from-blue-600 to-blue-500",
        },
        {
          title: "Progress Report",
          description: "Generate detailed progress reports for CIE",
          icon: <FaChartBar className="text-2xl" />,
          link: "/progressreport",
          gradient: "from-blue-500 to-blue-400",
        },
        {
          title: "Verification Report",
          description: "Verify student marks throughout a semester",
          icon: <FaCheckCircle className="text-2xl" />,
          link: "/verify",
          gradient: "from-blue-600 to-blue-500",
        },
      ],
    },
    "Attainment Reports": {
      gradient: "from-blue-600 to-blue-400",
      reports: [
        {
          title: "CO Attainment Report",
          description: "Verify CO attainments for descriptive tests",
          icon: <FaGraduationCap className="text-2xl" />,
          link: "/attainment",
          gradient: "from-blue-500 to-blue-400",
        },
        {
          title: "SEE Attainment Report",
          description: "Verify CO attainments for Semester End Exam",
          icon: <FaFileAlt className="text-2xl" />,
          link: "/attainment/see",
          gradient: "from-blue-600 to-blue-500",
        },
        {
          title: "Direct Attainments",
          description: "Verify Direct CO attainments Reports with Graph",
          icon: <FaChartLine className="text-2xl" />,
          link: "/attainment/direct",
          gradient: "from-blue-500 to-blue-400",
        },
        {
          title: "Indirect Attainments",
          description: "Verify Indirect CO attainments Reports with Graph",
          icon: <FaChartPie className="text-2xl" />,
          link: "/attainment/indirect",
          gradient: "from-blue-600 to-blue-500",
        },
      ],
    },
    "Overall Reports": {
      gradient: "from-blue-600 to-blue-400",
      reports: [
        {
          title: "Overall Attainments",
          description: "Verify Overall CO attainments Reports with Graph",
          icon: <FaChartBar className="text-2xl" />,
          link: "/attainment/overall",
          gradient: "from-blue-500 to-blue-400",
        },
        {
          title: "PO Attainments",
          description: "Verify Overall PO attainments Reports with Graph",
          icon: <FaGraduationCap className="text-2xl" />,
          link: "/attainment/po",
          gradient: "from-blue-600 to-blue-500",
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500">
            Reports Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Access and generate various academic reports</p>
        </div>

        <div className="space-y-8">
          {Object.entries(reportCategories).map(([category, { gradient, reports }]) => (
            <div key={category} className="overflow-hidden rounded-xl shadow-lg">
              <div className={`bg-gradient-to-r ${gradient} px-6 py-4`}>
                <h2 className="text-xl font-semibold text-white">{category}</h2>
              </div>
              <div className="bg-white divide-y divide-gray-100">
                {reports.map((report, index) => (
                  <Link
                    to={report.link}
                    key={index}
                    className="block transition-all duration-300 hover:bg-blue-50"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${report.gradient} flex items-center justify-center text-white shadow-md`}>
                            {report.icon}
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${report.gradient} text-white shadow-sm`}>
                              View Report
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
