import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../utils/Loader";
import { FaTrash, FaArrowLeft } from "react-icons/fa";
import { useUser } from "../utils/UserContext";

const ManageFaculty = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useUser();

  const fetchFaculties = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URI}/api/users/all`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter out admin users and current user
        const facultyMembers = data.filter(
          (faculty) =>
            faculty.role !== "admin" &&
            faculty._id !== localStorage.getItem("userId")
        );
        setFaculties(facultyMembers);
      } else {
        setError("Failed to fetch faculty members");
      }
    } catch (err) {
      setError("An error occurred while fetching faculty members");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this faculty member?")
    ) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URI}/api/users/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        if (response.ok) {
          setFaculties((prevFaculties) =>
            prevFaculties.filter((faculty) => faculty._id !== id)
          );
        } else {
          setError("Failed to delete faculty member");
        }
      } catch (err) {
        setError("An error occurred while deleting faculty member");
        console.error("Error:", err);
      }
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") {
      navigate("/admin-login");
    } else {
      fetchFaculties();
    }
  }, [navigate, user?.token]); // Add token to dependencies to refetch when token changes

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="mb-6 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Admin Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Manage Faculties</h1>
          </div>

          <div className="p-8">
            {loading && <Loader />}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {faculties.map((faculty) => (
                <div
                  key={faculty._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:scale-102"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-4 py-3">
                    <h2 className="text-lg font-semibold text-white">
                      {faculty.firstName} {faculty.lastName}
                    </h2>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600">{faculty.email}</p>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleDelete(faculty._id)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-red-500 to-red-400 text-white shadow-sm hover:from-red-600 hover:to-red-500 transition-all duration-300"
                      >
                        <FaTrash className="mr-1" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!loading && faculties.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No faculty members found. Add some from the dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFaculty;
