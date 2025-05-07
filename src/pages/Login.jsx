import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../utils/Loader";
import { FaUser, FaLock, FaChalkboardTeacher } from "react-icons/fa";
import { useUser } from "../utils/UserContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();

  const onInputChange = (e) => {
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

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

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
          setError(true);
          return;
        }

        if (decodedToken.role === "faculty" || decodedToken.role === "admin") {
          login(data.token, decodedToken);
          localStorage.setItem("isLoggedIn", "true");
          navigate("/home");
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSwitch = () => {
    navigate("/admin-login");
  };

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
        <div className="md:hidden flex flex-col w-full max-w-md">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6 rounded-t-lg">
            <div className="mb-6">
              <div className="bg-white p-3 inline-block rounded-lg mb-4">
                <img
                  src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
                  alt="Lords Institute Logo"
                  className="h-10"
                />
              </div>

              <h1 className="text-3xl font-bold mb-4">
                Welcome to Lords Faculty Portal
              </h1>
              <p className="text-lg mb-6">
                Access your data entry, student reports, and attainments
              </p>
            </div>

            <div className="space-y-4 mt-10">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-700 p-2 rounded-full">
                  <FaChalkboardTeacher className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Student data</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-700 p-2 rounded-full">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Attainments</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-700 p-2 rounded-full">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Progress Reports</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-b-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                Faculty Login
              </h2>
              <p className="text-gray-600">Sign in to get started</p>
            </div>

            {loading && <Loader />}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
                <p className="text-red-700 font-medium text-sm">
                  Invalid email or password. Please try again.
                </p>
              </div>
            )}

            <form className="space-y-4" onSubmit={onLogin}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter your email"
                  onChange={onInputChange}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot your password?
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
                  onChange={onInputChange}
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
                  <FaUser className="w-5 h-5" />
                  <span>Sign in</span>
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
                    Or sign in to admin account
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={handleAdminSwitch}
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors duration-300"
              >
                Switch to Administrator Login
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex overflow-hidden rounded-lg shadow-xl max-w-5xl">
          {/* Left side - Blue section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-8 w-96">
            <div className="mb-6">
              <div className="bg-white p-3 inline-block rounded-lg mb-4">
                <img
                  src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
                  alt="Lords Institute Logo"
                  className="h-10"
                />
              </div>

              <h1 className="text-3xl font-bold mb-4">
                Welcome to Lords Faculty Portal
              </h1>
              <p className="text-lg mb-6">
                Access your data entry, student reports, and attainments
              </p>
            </div>

            <div className="space-y-4 mt-10">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-700 p-2 rounded-full">
                  <FaChalkboardTeacher className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Student data</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-700 p-2 rounded-full">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Attainments</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-700 p-2 rounded-full">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Progress Reports</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="bg-white p-8 w-96">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                Faculty Login
              </h2>
              <p className="text-gray-600">Sign in to get started</p>
            </div>

            {loading && <Loader />}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
                <p className="text-red-700 font-medium text-sm">
                  Invalid email or password. Please try again.
                </p>
              </div>
            )}

            <form className="space-y-4" onSubmit={onLogin}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter your email"
                  onChange={onInputChange}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot your password?
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
                  onChange={onInputChange}
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
                  <FaUser className="w-5 h-5" />
                  <span>Sign in</span>
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
                    Or sign in to admin account
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={handleAdminSwitch}
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors duration-300"
              >
                Switch to Administrator Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
