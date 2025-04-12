import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">Student Management Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Marks Entry Column */}
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Marks Entry</h2>
            <p className="text-gray-600">Enter marks for various tests such as CIE, Assignments, and more.</p>
            <Link to="/marks">
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded">
                Go to Marks Entry
              </button>
            </Link>
          </div>

          {/* Internal Marks Entry Column */}
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Internal Marks Entry</h2>
            <p className="text-gray-600">View, Enter and update internal marks for the internal exams.</p>
            <Link to="/internalmarks">
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded">
                Go to Internal Marks Entry
              </button>
            </Link>
          </div>

          {/* Attendance Entry Column */}
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Attendance Entry</h2>
            <p className="text-gray-600">Record student attendance for different subjects and dates.</p>
            <Link to="/attendance">
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded">
                Go to Attendance Entry
              </button>
            </Link>
          </div>

          {/* Reports Column */}
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Reports</h2>
            <p className="text-gray-600">View and generate reports for marks and attendance.</p>
            <Link to="/reports">
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded">
                Go to Reports
              </button>
            </Link>
          </div>

          {/* Course Outcome Entry Column */}
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Course Outcome Entry</h2>
            <p className="text-gray-600">Enter and manage course outcomes for subjects.</p>
            <Link to="/course-outcome">
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded">
                Go to Course Outcome Entry
              </button>
            </Link>
          </div>

          {/* Feedback indirect attainment Entry Column */}
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">CO Attainments Entry</h2>
            <p className="text-gray-600">Enter and manage indirect attainments for subjects.</p>
            <Link to="/attainment/entry">
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded">
                Go to Indirect Attainments
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
