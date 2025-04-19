import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  const onLogoutButton = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn"); // Clear login state
    navigate("/login");
  };

  return (
    <div className="flex items-center shadow-lg">
      <div className="border-8 border-white h-20 flex items-center mx-4 sm:mx-0 w-1/2 sm:w-auto bg-white">
        <img
          src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
          alt="Lords Institute Logo"
          className="h-20 w-full ml-3 sm:w-56 object-contain transition-transform duration-300 hover:scale-105"
        />
      </div>
      <header className="bg-gradient-to-r from-secondary to-primary h-24 flex-grow ml-6 rounded-l-lg">
        <div className="h-full flex items-center justify-end px-4 sm:px-16">
          <nav>
            <ul className="flex items-center space-x-4 sm:space-x-8 text-white font-bold">
              <li className="relative group hidden sm:block">
                <Link 
                  to="/about" 
                  className="border-2 border-transparent hover:border-white px-4 py-1 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  About Us
                </Link>
              </li>
              <li className="relative group hidden sm:block">
                <Link 
                  to="/contact" 
                  className="border-2 border-transparent hover:border-white px-4 py-1 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  Contact Us
                </Link>
              </li>
              {!isLoggedIn ? (
                <li className="relative group">
                  <Link 
                    to="/login" 
                    className="border-2 border-white px-4 py-1 rounded-lg hover:bg-white hover:text-secondary transition-all duration-300"
                  >
                    Login
                  </Link>
                </li>
              ) : (
                <li className="relative group">
                  <button
                    onClick={onLogoutButton}
                    className="border-2 border-white px-4 py-1 rounded-lg hover:bg-white hover:text-secondary transition-all duration-300 flex items-center"
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
    </div>
  );
};

export default Header;
