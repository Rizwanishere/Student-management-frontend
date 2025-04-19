import React from "react";
import { Link } from "react-router-dom";
import { FaChartBar, FaClipboardList, FaUserCheck, FaGraduationCap, FaChartLine, FaFileAlt, FaCheckCircle, FaChartPie } from "react-icons/fa";

function ReportsPage() {
  const reportCards = [
    {
      title: "Attendance Report",
      description: "View detailed attendance data for a period",
      icon: <FaUserCheck className="text-4xl" />,
      link: "/reports/attendance",
      color: "from-primary to-secondary"
    },
    {
      title: "Marks Report",
      description: "Access comprehensive marks data for types of tests",
      icon: <FaClipboardList className="text-4xl" />,
      link: "/reports/marks",
      color: "from-secondary to-primary"
    },
    {
      title: "Progress Report",
      description: "Generate detailed progress reports for CIE",
      icon: <FaChartBar className="text-4xl" />,
      link: "/progressreport",
      color: "from-primary to-secondary"
    },
    {
      title: "Verification Report",
      description: "Verify student marks throughout a semester",
      icon: <FaCheckCircle className="text-4xl" />,
      link: "/verify",
      color: "from-secondary to-primary"
    },
    {
      title: "CO Attainment Report",
      description: "Verify CO attainments for descriptive tests",
      icon: <FaGraduationCap className="text-4xl" />,
      link: "/attainment",
      color: "from-primary to-secondary"
    },
    {
      title: "SEE Attainment Report",
      description: "Verify CO attainments for Semester End Exam",
      icon: <FaFileAlt className="text-4xl" />,
      link: "/attainment/see",
      color: "from-secondary to-primary"
    },
    {
      title: "Direct Attainments",
      description: "Verify Direct CO attainments Reports with Graph",
      icon: <FaChartLine className="text-4xl" />,
      link: "/attainment/direct",
      color: "from-primary to-secondary"
    },
    {
      title: "Indirect Attainments",
      description: "Verify Indirect CO attainments Reports with Graph",
      icon: <FaChartPie className="text-4xl" />,
      link: "/attainment/indirect",
      color: "from-secondary to-primary"
    },
    {
      title: "Overall Attainments",
      description: "Verify Overall CO attainments Reports with Graph",
      icon: <FaChartBar className="text-4xl" />,
      link: "/attainment/overall",
      color: "from-primary to-secondary"
    },
    {
      title: "PO Attainments",
      description: "Verify Overall PO attainments Reports with Graph",
      icon: <FaGraduationCap className="text-4xl" />,
      link: "/attainment/po",
      color: "from-secondary to-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reports Dashboard</h1>
          <p className="text-xl text-gray-600">Access and generate various academic reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reportCards.map((card, index) => (
            <Link
              to={card.link}
              key={index}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                <div className={`bg-gradient-to-r ${card.color} rounded-t-2xl p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    {card.icon}
                    <span className="text-2xl font-bold">{card.title}</span>
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                    {card.description}
                  </p>
                </div>
                <div className="px-6 pb-6">
                  <button className="w-full bg-gray-100 text-primary font-semibold py-2 px-4 rounded-lg hover:bg-primary hover:text-white transition-all duration-300 transform group-hover:scale-105">
                    View Report
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
