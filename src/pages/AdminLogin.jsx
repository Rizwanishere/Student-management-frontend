import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock, FaShieldAlt } from "react-icons/fa";
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

  // Use this to check for branch selection like in the faculty login
  useEffect(() => {
    const selectedBranch = localStorage.getItem("selectedBranch");
    if (!selectedBranch) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="container mx-auto flex justify-center">
        {/* Mobile Layout */}
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col w-full max-w-md">
          {/* Blue section now at the top */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 rounded-t-lg">
            <div className="mb-6">
              <div className="bg-white p-3 inline-block rounded-lg mb-4">
                <img
                  src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
                  alt="Lords Institute Logo"
                  className="h-10"
                />
              </div>

              <h1 className="text-3xl font-bold mb-4">
                Welcome to Lords Admin Portal
              </h1>
              <p className="text-lg mb-6">
                Securely manage your institution's academic systems
              </p>
            </div>

            <div className="space-y-4 mt-10">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-800 p-2 rounded-full">
                  <FaShieldAlt className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">System Security</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-800 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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
                </div>
                <div>
                  <p className="font-medium">Control Panel</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-800 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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
                </div>
                <div>
                  <p className="font-medium">Manage Faculties</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login form now at the bottom */}
          <div className="bg-white p-6 rounded-b-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                Admin Login
              </h2>
              <p className="text-gray-600">Sign in to manage the portal</p>
            </div>

            {loading && <Loader />}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Admin Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter your email"
                  onChange={handleInputChange}
                />
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
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot credentials?
                  </a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter your password"
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-800 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-blue-900 transition duration-200"
                >
                  <FaShieldAlt className="w-5 h-5" />
                  <span>Secure Login</span>
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or sign in to faculty account
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors duration-300"
              >
                Switch to Faculty Login
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex overflow-hidden rounded-lg shadow-xl max-w-5xl">
          {/* Left side - Login form */}
          <div className="bg-white p-8 w-96">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                Admin Login
              </h2>
              <p className="text-gray-600">Sign in to manage the portal</p>
            </div>

            {loading && <Loader />}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Admin Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter your email"
                  onChange={handleInputChange}
                />
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
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot credentials?
                  </a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter your password"
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-800 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-blue-900 transition duration-200"
                >
                  <FaShieldAlt className="w-5 h-5" />
                  <span>Secure Login</span>
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or sign in to faculty account
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors duration-300"
              >
                Switch to Faculty Login
              </Link>
            </div>
          </div>

          {/* Right side - Blue section */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-8 w-96">
            <div className="mb-6">
              <div className="bg-white p-3 inline-block rounded-lg mb-4">
                <img
                  src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
                  alt="Lords Institute Logo"
                  className="h-10"
                />
              </div>

              <h1 className="text-3xl font-bold mb-4">
                Welcome to Lords Admin Portal
              </h1>
              <p className="text-lg mb-6">
                Securely manage your institution's academic systems
              </p>
            </div>

            <div className="space-y-4 mt-10">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-800 p-2 rounded-full">
                  <FaShieldAlt className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">System Security</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-800 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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
                </div>
                <div>
                  <p className="font-medium">Control Panel</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-800 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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
                </div>
                <div>
                  <p className="font-medium">Manage Faculties</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
