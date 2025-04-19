import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  const onLogoutButton = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (!isLoggedIn && currentPath === "/") {
      navigate("/signin");
      toast.error("Please sign in to continue!");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="flex items-center shadow-lg">
      <div className="border-8 border-white h-20 flex items-center mx-4 sm:mx-0 w-1/2 sm:w-auto bg-white rounded-r-lg">
        <img
          src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
          alt="Lords Institute Logo"
          className="h-20 w-full ml-3 sm:w-56 object-contain transition-transform duration-300 hover:scale-105"
        />
      </div>
      <header className="bg-gradient-to-r from-secondary to-primary h-24 flex-grow ml-6 rounded-l-lg">
        <div className="flex items-center justify-end mt-6 px-4 sm:px-16 py-2">
          <nav>
            <ul className="flex space-x-4 sm:space-x-8 text-white font-bold">
              <li className="relative group hidden sm:block">
                <Link 
                  to="/about" 
                  className="hover:text-tertiary transition-colors duration-300 px-3 py-1 rounded-lg hover:bg-white/10"
                >
                  About Us
                </Link>
              </li>
              <li className="relative group hidden sm:block">
                <Link 
                  to="/contact" 
                  className="hover:text-tertiary transition-colors duration-300 px-3 py-1 rounded-lg hover:bg-white/10"
                >
                  Contact Us
                </Link>
              </li>
              {!isLoggedIn ? (
                <li className="relative group">
                  <Link 
                    to="/signin" 
                    className="border-2 border-white px-4 py-1 rounded-lg hover:bg-white hover:text-secondary transition-all duration-300 transform hover:scale-105"
                  >
                    Login
                  </Link>
                </li>
              ) : (
                <>
                  <li className="relative group">
                    <button
                      onClick={onLogoutButton}
                      className="border-2 border-white px-4 py-1 rounded-lg hover:bg-white hover:text-secondary transition-all duration-300 transform hover:scale-105"
                    >
                      Logout
                    </button>
                  </li>
                  <li className="text-2xl group">
                    <FaUserCircle className="transition-transform duration-300 hover:scale-110 hover:text-tertiary cursor-pointer" />
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
    </div>
  );
};

export default Header;
