import React from 'react';
import { FaGraduationCap, FaAward, FaUsers, FaBook, FaBuilding, FaCheckCircle } from 'react-icons/fa';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">About Lords Institute</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Lords Institute of Engineering & Technology is committed to academic excellence and preparing students for successful careers in technology and innovation.
          </p>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full z-0"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/10 rounded-full z-0"></div>
            <img
              src="https://www.lords.ac.in/wp-content/uploads/2024/03/Main-SliderBuilding.jpg"
              alt="Lords Institute"
              className="w-full h-auto rounded-xl shadow-xl relative z-10 transform transition-all duration-500 hover:scale-[1.02]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-6 text-primary">Our Legacy</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Lords Institute of Engineering & Technology (LRDS) was established in the year 2003 under the aegis of Lords Educational Society spearheaded by Chairman, Sri T. Muralidhar Goud, and Secretary, Smt. K. Ratna Devi.
              </p>
              <p className="text-gray-700 leading-relaxed">
                The Institution is accredited by NAAC with 'A' Grade, NBA for CSE, ECE, and Mechanical, approved by AICTE, and permanently affiliated to Osmania University, Hyderabad. Recognized under Section 2(f) & 12(B) of UGC Act, 1956.
              </p>
              <div className="flex items-center mt-4">
                <FaCheckCircle className="text-primary mr-2" />
                <span className="text-gray-700 font-medium">Established in 2003</span>
              </div>
              <div className="flex items-center">
                <FaCheckCircle className="text-primary mr-2" />
                <span className="text-gray-700 font-medium">NAAC Accredited with 'A' Grade</span>
              </div>
              <div className="flex items-center">
                <FaCheckCircle className="text-primary mr-2" />
                <span className="text-gray-700 font-medium">NBA Accredited for CSE, ECE, and Mechanical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">Why Choose Lords Institute?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaGraduationCap className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Quality Education</h3>
              <p className="text-gray-600">
                The college offers UG & PG programs in Engineering and Management, providing an excellent academic environment, and has a dynamic and dedicated team of faculty.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaAward className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Academic Excellence</h3>
              <p className="text-gray-600">
                Lords Institute is one of the top-rated engineering institutions in Hyderabad known for its quality education, and student-centric initiatives, aiming at overall development of students.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaUsers className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Student Development</h3>
              <p className="text-gray-600">
                With state-of-the-art infrastructure, modern laboratories, digital library, and various other amenities, the institute provides an exceptional learning environment.
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <FaBook className="text-primary text-xl" />
                </div>
                <h3 className="text-2xl font-semibold text-primary">Our Mission</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                To provide quality education and training in engineering and technology, preparing students for successful careers and contributing to the development of society through research and innovation.
              </p>
            </div>
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <FaBuilding className="text-primary text-xl" />
                </div>
                <h3 className="text-2xl font-semibold text-primary">Our Vision</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                To be a globally recognized institution of excellence in engineering education, research, and innovation, producing competent professionals who contribute to the advancement of technology and society.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;