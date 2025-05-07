import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus, FaUsers } from "react-icons/fa";
import { useUser } from "../utils/UserContext";
import { FaGraduationCap } from "react-icons/fa";
import { AiOutlinePlus } from "react-icons/ai";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUser();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/admin-login");
    }
  }, [navigate, isAdmin]);

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
    {
      title: "Add Students",
      description: "Add new students to the system",
      icon: (
        <div className="relative">
          <FaGraduationCap className="text-4xl" />
          <AiOutlinePlus className="text-xl absolute -right-1 -top-1 bg-white/20 rounded-full" />
        </div>
      ),
      link: "/poststudent",
      color: "from-primary to-secondary",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500 mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  {card.description}
                </p>
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
