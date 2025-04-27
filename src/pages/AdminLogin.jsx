import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaShieldAlt, FaDoorOpen } from "react-icons/fa";
import Loader from "../utils/Loader";
import { useUser } from "../utils/UserContext";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const decodeToken = (token) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) throw new Error("Invalid token structure");

      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URI}/api/users/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok && data.token) {
        const decodedToken = decodeToken(data.token);

        if (!decodedToken) {
          setError("Invalid token received");
          return;
        }

        if (decodedToken.role === "admin") {
          login(data.token, decodedToken);
          navigate("/admin-dashboard");
        } else {
          setError("You are not authorized as an admin");
        }
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Invalid credentials. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center max-w-6xl">
        {/* Left side content */}
        <div className="hidden md:block md:w-1/2 pr-10">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">
              Admin Portal
            </h1>
            <p className="text-lg text-blue-800 mb-6">
              Securely manage your institution's academic systems
            </p>
            <div className="flex justify-center md:justify-start space-x-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <FaShieldAlt className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm font-medium">System Security</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <p className="text-sm font-medium">Control Panel</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm font-medium">Manage Faculties</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Card - Right Side */}
        <div className="w-full md:w-1/2 md:max-w-md z-10">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-800 to-blue-600 text-white">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="bg-white p-3 rounded-md">
                  <img
                    src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
                    alt="Lords Institute Logo"
                    className="h-12"
                  />
                </div>
                <h2 className="text-2xl font-bold">Admin Login</h2>
              </div>
            </div>

            <div className="p-8">
              {loading && <Loader />}

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                    <p className="text-red-700 font-medium text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Admin Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50"
                      placeholder="admin@gmail.com"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Admin Password
                    </label>
                    <a
                      href="#"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Forgot credentials?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50"
                      placeholder="••••••••••"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Secure Login
                  </button>
                </div>

                <div className="text-center pt-3">
                  <p className="text-sm text-gray-600">
                    <a
                      onClick={() => navigate("/")}
                      className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors duration-300 cursor-pointer"
                    >
                      <FaDoorOpen className="mr-1 h-4 w-4" />
                      Return to Faculty Login
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 right-0 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path
            fill="rgba(30, 64, 175, 0.05)"
            fillOpacity="1"
            d="M0,96L48,128C96,160,192,224,288,213.3C384,203,480,117,576,96C672,75,768,117,864,149.3C960,181,1056,203,1152,192C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default AdminLogin;
