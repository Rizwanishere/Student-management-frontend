import React from "react";
import { Link } from "react-router-dom";

function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
      <div className="container mx-auto">
        <h1 className="text-3xl text-blue-800 font-bold text-center mb-12">
          Reports Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Attendance Reports Section */}
          <Link to="/reports/attendance">
            <div className="p-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center border-t-4 border-secondary">
              <h2 className="text-xl font-semibold text-blue-800">
                Attendance Report
              </h2>
              <p className="text-gray-500 mt-2">
                View detailed attendance data for a period.
              </p>
            </div>
          </Link>

          {/* Marks Reports Section */}
          <Link to="/reports/marks">
            <div className="p-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center border-t-4 border-secondary">
              <h2 className="text-xl font-semibold text-blue-800">
                Marks Report
              </h2>
              <p className="text-gray-500 mt-2">
                Access comprehensive marks data for types of tests.
              </p>
            </div>
          </Link>

          {/* Progress Report Section */}
          <Link to="/progressreport">
            <div className="p-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center border-t-4 border-secondary">
              <h2 className="text-xl font-semibold text-blue-800">
                Progress Report
              </h2>
              <p className="text-gray-500 mt-2">
                Generate detailed progress reports for CIE.
              </p>
            </div>
          </Link>

          {/* Student Verification Section */}
          <Link to="/verify">
            <div className="p-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center border-t-4 border-secondary">
              <h2 className="text-xl font-semibold text-blue-800">
                Verification Report
              </h2>
              <p className="text-gray-500 mt-2">
                Verify student marks throughout a semester.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
