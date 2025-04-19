import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../utils/Loader";
import { FaUser, FaLock } from "react-icons/fa";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const { username, password } = formData;
    const branchName = localStorage.getItem("selectedBranch");

    setTimeout(() => {
      if (username === branchName && password === branchName) {
        localStorage.setItem("isLoggedIn", "true");
        navigate("/home");
      } else {
        setError(true);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-[1.02] border border-gray-100">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
                alt="Lords Institute Logo"
                className="h-20 mx-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {loading && <Loader />}
          
          <form className="space-y-6" onSubmit={onLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-red-700 font-medium">Invalid Username or Password</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  placeholder="Username"
                  onChange={onInputChange}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                  placeholder="Password"
                  onChange={onInputChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign in
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <a className="text-primary font-semibold hover:text-secondary transition-colors duration-300">
                  Sign Up
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
