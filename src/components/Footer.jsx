// src/components/Footer.jsx
import React from 'react';
import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gradient-to-b from-secondary to-primary text-white py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="hidden sm:block transform transition-transform duration-300 hover:scale-105">
          <div className="bg-white rounded-2xl p-3 w-36 h-36 flex items-center justify-center mx-auto">
            <img 
              src="https://www.lords.ac.in/wp-content/uploads/2023/04/Website-Logo.png"
              alt="Lords Institute Logo" 
              className="h-28 w-auto object-contain"
            />
          </div>
        </div>
        <div className="hidden sm:block">
          <h2 className="text-xl font-bold mb-6 text-white/90">About Lords</h2>
          <ul className="space-y-3">
            <li>
              <a 
                href="https://www.lords.ac.in/overview/" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-tertiary transition-colors duration-300 hover:underline"
              >
                Overview
              </a>
            </li>
            <li>
              <a 
                href="https://www.lords.ac.in/campus-life/events/" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-tertiary transition-colors duration-300 hover:underline"
              >
                Events
              </a>
            </li>
            <li>
              <a 
                href="https://www.lords.ac.in/infrastructure/world-class-facilities/" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-tertiary transition-colors duration-300 hover:underline"
              >
                Facilities
              </a>
            </li>
          </ul>
        </div>
        <div className="hidden sm:block">
          <h2 className="text-xl font-bold mb-6 text-white/90">Admissions</h2>
          <ul className="space-y-3">
            <li>
              <a 
                href="https://www.lords.ac.in/domestic/courses-offered/"  
                target="_blank" 
                rel="noreferrer"
                className="hover:text-tertiary transition-colors duration-300 hover:underline"
              >
                Courses Offered
              </a>
            </li>
            <li>
              <a 
                href="https://www.lords.ac.in/nri/courses-offered/" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-tertiary transition-colors duration-300 hover:underline"
              >
                NRI Admissions
              </a>
            </li>
            <li>
              <a 
                href="https://www.lords.ac.in/international/courses-offered/" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-tertiary transition-colors duration-300 hover:underline"
              >
                International Students
              </a>
            </li>
          </ul>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold mb-6 text-white/90">Contact</h2>
          <p className="mb-6 text-white/80">
            +91-6309012442/43<br />
            <a 
              href="mailto:principal@lords.ac.in" 
              className="hover:text-tertiary transition-colors duration-300 hover:underline"
            >
              principal@lords.ac.in
            </a>
          </p>
          <div className="flex justify-center sm:justify-start space-x-6">
            <a 
              href="https://www.facebook.com/lordsinstitute/" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-tertiary transition-all duration-300 transform hover:scale-125"
            >
              <FaFacebook size={24} />
            </a>
            <a 
              href="https://x.com/lords_institute/" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-tertiary transition-all duration-300 transform hover:scale-125"
            >
              <FaTwitter size={24} />
            </a>
            <a 
              href="https://www.linkedin.com/school/lords-institute-of-engineering-&-technology/" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-tertiary transition-all duration-300 transform hover:scale-125"
            >
              <FaLinkedin size={24} />
            </a>
          </div>
        </div>
      </div>
      <div className="mt-12 pt-6 border-t border-white/20 text-center">
        <p className="text-white/80">&copy; {currentYear} Lords Institute of Engineering and Technology. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;