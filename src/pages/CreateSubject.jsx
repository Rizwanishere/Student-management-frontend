import { useState } from "react";
import axios from "axios";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function CreateSubject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    branch: "",
    year: "",
    semester: "",
    regulation: "",
    courseCode: "",
  });
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [customBranch, setCustomBranch] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBranchChange = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setFormData({ ...formData, branch: "custom" });
    } else {
      setFormData({ ...formData, branch: value });
      setCustomBranch("");
    }
  };

  const handleCustomBranchChange = (e) => {
    setCustomBranch(e.target.value.toUpperCase());
  };

  const validateFormData = (data) => {
    const errors = [];
    const requiredFields = [
      "name",
      "branch",
      "year",
      "semester",
      "regulation",
      "courseCode",
    ];

    requiredFields.forEach((field) => {
      if (!data[field]) {
        errors.push(`Please fill in the ${field} field`);
      }
    });

    // Validate year and semester as positive integers
    if (data.year && (isNaN(data.year) || Number(data.year) <= 0)) {
      errors.push("Year must be a positive integer");
    }
    if (data.semester && (isNaN(data.semester) || Number(data.semester) <= 0)) {
      errors.push("Semester must be a positive integer");
    }

    // Check for duplicate course code in temporary subjects list
    if (
      data.courseCode &&
      subjects.some(
        (subject) =>
          subject.courseCode.toLowerCase() === data.courseCode.toLowerCase()
      )
    ) {
      errors.push(`Course Code "${data.courseCode}" is already added`);
    }

    return errors;
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    const branchToUse =
      formData.branch === "custom" ? customBranch.trim() : formData.branch;

    const dataToValidate = {
      ...formData,
      branch: branchToUse,
    };

    const errors = validateFormData(dataToValidate);
    if (errors.length > 0) {
      setFormError(errors[0]);
      return;
    }

    setSubjects((prevSubjects) => [
      ...prevSubjects,
      {
        name: formData.name,
        branch: branchToUse.toUpperCase(),
        year: Number(formData.year),
        semester: Number(formData.semester),
        regulation: formData.regulation.toUpperCase(),
        courseCode: formData.courseCode.toUpperCase(),
      },
    ]);

    // Reset form
    setFormData({
      name: "",
      branch: "",
      year: "",
      semester: "",
      regulation: "",
      courseCode: "",
    });
    setCustomBranch("");
    setSuccess("Subject added to table! Click 'Save Subjects' to submit.");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    const errors = [];

    try {
      if (!subjects.length) {
        setError("No subjects to save.");
        return;
      }

      for (const record of subjects) {
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects`,
            record
          );
          if (response.status === 201) {
            // Assuming 201 Created status
            setSuccess((prev) =>
              prev
                ? `${prev} Subject ${record.courseCode} saved successfully!`
                : `Subject ${record.courseCode} saved successfully!`
            );
          }
        } catch (err) {
          const errorMessage =
            err.response?.data?.message ||
            `Failed to save subject ${record.courseCode}`;
          errors.push(errorMessage);
        }
      }

      if (errors.length > 0) {
        setError(errors.join(", "));
        setSuccess("Some subjects were saved successfully!");
      } else {
        setSuccess("All subjects saved successfully!");
        setSubjects([]);
      }
    } catch (err) {
      setError("Unexpected error occurred while saving subjects");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="mb-6 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Admin Dashboard
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subjects Record Input
          </h1>
          <p className="text-gray-600">
            Enter and manage subject records efficiently
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleAddSubject} className="space-y-6">
              {formError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="branch"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Branch *
                  </label>
                  <select
                    name="branch"
                    id="branch"
                    value={formData.branch}
                    onChange={handleBranchChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    required
                  >
                    <option value="">Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {formData.branch === "custom" && (
                  <div className="space-y-2">
                    <label
                      htmlFor="customBranch"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Custom Branch *
                    </label>
                    <input
                      type="text"
                      name="customBranch"
                      id="customBranch"
                      value={customBranch}
                      onChange={handleCustomBranchChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Year *
                  </label>
                  <select
                    name="year"
                    id="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="semester"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Semester *
                  </label>
                  <select
                    name="semester"
                    id="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="regulation"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Regulation *
                  </label>
                  <input
                    type="text"
                    name="regulation"
                    id="regulation"
                    value={formData.regulation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        regulation: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    placeholder="e.g. LR21"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="courseCode"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Course Code *
                  </label>
                  <input
                    type="text"
                    name="courseCode"
                    id="courseCode"
                    value={formData.courseCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        courseCode: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    placeholder="e.g. U21CS101"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
                >
                  <FaSave />
                  <span>Add Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mt-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mt-4">
            {error}
          </div>
        )}

        {subjects.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                  Subject Records
                </h2>
                <button
                  onClick={handleSave}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <FaSave />
                  <span>Save Subjects</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Regulation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map((subject, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.branch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.regulation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.courseCode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
