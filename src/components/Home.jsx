import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaClipboardList, FaChartBar, FaUserCheck, FaBook, FaChartLine } from 'react-icons/fa';
import { RiUserAddFill } from 'react-icons/ri';

const Home = () => {
  const menuItems = [
    {
      title: "Marks Entry",
      description: "Enter marks for various tests such as CIE, Assignments, and more.",
      icon: <FaGraduationCap className="text-4xl" />,
      link: "/marks",
      color: "from-primary to-secondary"
    },
    {
      title: "Internal Marks Entry",
      description: "View, Enter and update internal marks for the internal exams.",
      icon: <FaClipboardList className="text-4xl" />,
      link: "/internalmarks",
      color: "from-secondary to-primary"
    },
    {
      title: "Attendance Entry",
      description: "Record student attendance for different subjects and dates.",
      icon: <FaUserCheck className="text-4xl" />,
      link: "/attendance",
      color: "from-primary to-secondary"
    },
    {
      title: "Course Outcome Entry",
      description: "Enter and manage course outcomes for subjects.",
      icon: <FaBook className="text-4xl" />,
      link: "/course-outcome",
      color: "from-primary to-secondary"
    },
    {
      title: "CO Attainments Entry",
      description: "Enter and manage indirect attainments for subjects.",
      icon: <FaChartLine className="text-4xl" />,
      link: "/attainment/entry",
      color: "from-secondary to-primary"
    },
    {
      title: "View Reports",
      description: "View and generate reports for marks and attendance.",
      icon: <FaChartBar className="text-4xl" />,
      link: "/reports",
      color: "from-secondary to-primary"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-5 overflow-hidden py-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient">
            Student Management Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item, index) => (
            <Link
              to={item.link}
              key={index}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                <div className={`bg-gradient-to-r ${item.color} rounded-t-2xl p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    {item.icon}
                    <span className="text-2xl font-bold">{item.title}</span>
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                    {item.description}
                  </p>
                </div>
                <div className="px-6 pb-6">
                  <button className="w-full bg-gray-100 text-primary font-semibold py-2 px-4 rounded-lg hover:bg-primary hover:text-white transition-all duration-300 transform group-hover:scale-105">
                    Access Module
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
