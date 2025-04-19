import React, { useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle, FaCommentAlt, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";
import { useLocation } from "react-router-dom";

function Contact() {
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFeedback, setIsFeedback] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if the user came from the profile page
    if (location.state && location.state.from === "profile") {
      setIsFeedback(true);
    }
  }, [location]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult("Sending....");
    const formData = new FormData(event.target);

    formData.append("access_key", "3d3a52d5-312e-4087-9e11-0b88cacdec94");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setIsSubmitting(false);

    if (data.success) {
      setIsSubmitted(true);
      setResult("Form Submitted Successfully");
      event.target.reset();
    } else {
      setIsSubmitted(false);
      console.log("Error", data);
      setResult(data.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            {isFeedback ? "Share Your Feedback" : "Contact Us"}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {isFeedback 
              ? "We value your opinion! Help us improve your learning experience by sharing your feedback about the quiz platform."
              : "Got a technical issue? Want to send feedback about a beta feature? Or want us to call you back? Let us know."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <FaEnvelope className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Email Us</h3>
              </div>
              <p className="text-gray-600">principal@lords.ac.in</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <FaPhone className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Call Us</h3>
              </div>
              <p className="text-gray-600">+91-6309012442/43</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <FaMapMarkerAlt className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Visit Us</h3>
              </div>
              <p className="text-gray-600">Himayathsagar Road, Hyderabad, Telangana - 500091</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            {isFeedback && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <FaCommentAlt className="text-blue-600 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-800">Your Feedback Matters</h3>
                </div>
                <p className="text-gray-700">
                  Your insights help us create better quizzes and enhance the platform for all students. 
                  Please let us know what you liked, what could be improved, and any suggestions you have.
                </p>
              </div>
            )}

            {isSubmitting && (
              <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center">
                <FaSpinner className="animate-spin text-6xl text-primary mb-4" />
                <p className="text-xl text-gray-700">Submitting your message...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
              </div>
            )}

            {isSubmitted && (
              <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <FaCheckCircle className="text-5xl text-green-500" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Thank You!</h3>
                <p className="text-xl text-gray-600">{result}</p>
                <p className="text-sm text-gray-500 mt-4">We'll get back to you as soon as possible</p>
              </div>
            )}

            {!isSubmitting && !isSubmitted && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <form onSubmit={onSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-gray-700 text-lg font-medium"
                    >
                      Your email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className="pl-10 focus:ring-primary focus:border-primary block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm transition-all duration-300"
                        placeholder="name@gmail.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-2 block text-gray-700 text-lg font-medium"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      className="focus:ring-primary focus:border-primary block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm transition-all duration-300"
                      placeholder={isFeedback ? "Feedback about the quiz platform" : "Let us know how we can help you"}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-gray-700 text-lg font-medium"
                    >
                      Your message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="6"
                      required
                      className="focus:ring-primary focus:border-primary block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm transition-all duration-300"
                      placeholder={isFeedback ? "Share your feedback about the quiz platform..." : "Leave a comment..."}
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {isFeedback ? "Submit Feedback" : "Send Message"}
                      <FaPaperPlane className="ml-2" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;