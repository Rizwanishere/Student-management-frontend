import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus, FaUsers } from "react-icons/fa";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") {
      navigate("/admin-login");
    }
  }, [navigate]);

  const cards = [
    {
      title: "Add Faculties",
      description: "Add new faculty members to the system",
      icon: <FaUserPlus className="text-4xl" />,
      link: "/add-faculty",
      color: "from-primary to-secondary",
    },
    {
      title: "Manage Faculties",
      description: "View and manage existing faculty members",
      icon: <FaUsers className="text-4xl" />,
      link: "/manage-faculty",
      color: "from-secondary to-primary",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("facultyToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-400 text-white rounded-lg hover:from-red-600 hover:to-red-500 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-102 hover:shadow-xl"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6">
                <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center text-white mb-4">
                  {card.icon}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {card.title}
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600">{card.description}</p>
                <div className="mt-4 flex justify-end">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-sm">
                    Access →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
