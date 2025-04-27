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

        if (decodedToken.role === "faculty") {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center max-w-6xl">
        {/* Login Card - Left Side */}
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
                <h2 className="text-2xl font-bold">Faculty Login</h2>
              </div>
            </div>

            <div className="p-8">
              {loading && <Loader />}

              <form className="space-y-5" onSubmit={onLogin}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                    <p className="text-red-700 font-medium text-sm">
                      Invalid email or password. Please try again.
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50"
                      placeholder="yourname@gmail.com"
                      onChange={onInputChange}
                    />
                  </div>
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
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50"
                      placeholder="••••••••"
                      onChange={onInputChange}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Sign in
                  </button>
                </div>

                <div className="text-center pt-3">
                  <p className="text-sm text-gray-600">
                    <a
                      onClick={handleAdminSwitch}
                      className="text-blue-600 font-medium hover:text-blue-800 transition-colors duration-300 cursor-pointer"
                    >
                      Sign in as Administrator
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right side content */}
        <div className="hidden md:block md:w-1/2 pl-10">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">
              Welcome to Lords Faculty Portal
            </h1>
            <p className="text-lg text-blue-800 mb-6">
              Access your data entry, student reports, and attainments
            </p>
            <div className="flex justify-center md:justify-start space-x-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <FaChalkboardTeacher className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-sm font-medium">Student data</p>
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-sm font-medium">Attainments</p>
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-sm font-medium">Progress Reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path
            fill="rgba(30, 64, 175, 0.05)"
            fillOpacity="1"
            d="M0,224L48,197.3C96,171,192,117,288,96C384,75,480,85,576,112C672,139,768,181,864,181.3C960,181,1056,139,1152,133.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default Login;
