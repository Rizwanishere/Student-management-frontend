// import { useState } from 'react';
// import axios from 'axios';
// import { FaSave } from 'react-icons/fa';

// export default function CreateStudent() {
//   const [formData, setFormData] = useState({
//     rollNo: '',
//     name: '',
//     fatherName: '',
//     branch: '',
//     currentYear: '',
//     currentSemester: '',
//     section: ''
//   });
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');

//     // Basic validation
//     const requiredFields = ['rollNo', 'name', 'branch', 'currentYear', 'currentSemester', 'section'];
//     for (const field of requiredFields) {
//       if (!formData[field]) {
//         setError(`Please fill in the ${field} field`);
//         return;
//       }
//     }

//     try {
//       const response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/students`, formData);
//       setSuccess('Student created successfully!');
//       // Reset form
//       setFormData({
//         rollNo: '',
//         name: '',
//         fatherName: '',
//         branch: '',
//         currentYear: '',
//         currentSemester: '',
//         section: ''
//       });
//       if(response.ok){
//         setSuccess("Student created successfully!");
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to create student');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Students Record Input
//           </h1>
//           <p className="text-gray-600">
//             Enter and manage student records efficiently
//           </p>
//         </div>

//         <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
//           <div className="p-6 sm:p-8">
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {error && (
//                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
//                   {error}
//                 </div>
//               )}
//               {success && (
//                 <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
//                   {success}
//                 </div>
//               )}

//               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//                 <div className="space-y-2">
//                   <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700">
//                     Roll Number *
//                   </label>
//                   <input
//                     type="text"
//                     name="rollNo"
//                     id="rollNo"
//                     value={formData.rollNo}
//                     onChange={handleChange}
//                     className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//                     Name *
//                   </label>
//                   <input
//                     type="text"
//                     name="name"
//                     id="name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700">
//                     Father's Name
//                   </label>
//                   <input
//                     type="text"
//                     name="fatherName"
//                     id="fatherName"
//                     value={formData.fatherName}
//                     onChange={handleChange}
//                     className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
//                     Branch *
//                   </label>
//                   <input
//                     type="text"
//                     name="branch"
//                     id="branch"
//                     value={formData.branch}
//                     onChange={handleChange}
//                     className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="currentYear" className="block text-sm font-medium text-gray-700">
//                     Current Year *
//                   </label>
//                   <select
//                     name="currentYear"
//                     id="currentYear"
//                     value={formData.currentYear}
//                     onChange={handleChange}
//                     className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
//                     required
//                   >
//                     <option value="">Select Year</option>
//                     <option value="1">1st Year</option>
//                     <option value="2">2nd Year</option>
//                     <option value="3">3rd Year</option>
//                     <option value="4">4th Year</option>
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="currentSemester" className="block text-sm font-medium text-gray-700">
//                     Current Semester *
//                   </label>
//                   <select
//                     name="currentSemester"
//                     id="currentSemester"
//                     value={formData.currentSemester}
//                     onChange={handleChange}
//                     className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
//                     required
//                   >
//                     <option value="">Select Semester</option>
//                     <option value="1">1st Semester</option>
//                     <option value="2">2nd Semester</option>
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="section" className="block text-sm font-medium text-gray-700">
//                     Section *
//                   </label>
//                   <select
//                     name="section"
//                     id="section"
//                     value={formData.section}
//                     onChange={handleChange}
//                     className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
//                     required
//                   >
//                     <option value="">Select Section</option>
//                     <option value="A">A</option>
//                     <option value="B">B</option>
//                     <option value="C">C</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex justify-between items-center mt-6">
//                 <button
//                   type="submit"
//                   className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
//                 >
//                   <FaSave />
//                   <span>Create Student</span>
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import axios from "axios";
import { FaSave } from "react-icons/fa";

export default function CreateStudent() {
  const [formData, setFormData] = useState({
    rollNo: "",
    name: "",
    fatherName: "",
    branch: "",
    currentYear: "",
    currentSemester: "",
    section: "",
  });
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateFormData = (data) => {
    const errors = [];
    const requiredFields = [
      "rollNo",
      "name",
      "branch",
      "currentYear",
      "currentSemester",
      "section",
    ];

    requiredFields.forEach((field) => {
      if (!data[field]) {
        errors.push(`Please fill in the ${field} field`);
      }
    });

    // Validate currentYear and currentSemester as positive integers
    if (
      data.currentYear &&
      (isNaN(data.currentYear) || Number(data.currentYear) <= 0)
    ) {
      errors.push("Current Year must be a positive integer");
    }
    if (
      data.currentSemester &&
      (isNaN(data.currentSemester) || Number(data.currentSemester) <= 0)
    ) {
      errors.push("Current Semester must be a positive integer");
    }

    // Check for duplicate roll number in temporary students list
    if (
      data.rollNo &&
      students.some(
        (student) => student.rollNo.toLowerCase() === data.rollNo.toLowerCase()
      )
    ) {
      errors.push(`Roll Number "${data.rollNo}" is already added`);
    }

    return errors;
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    // Validate form data
    const errors = validateFormData(formData);
    if (errors.length > 0) {
      setFormError(errors[0]); // Show first error for simplicity
      return;
    }

    // Add student to temporary list
    setStudents((prevStudents) => [
      ...prevStudents,
      {
        rollNo: formData.rollNo,
        name: formData.name,
        fatherName: formData.fatherName,
        branch: formData.branch,
        currentYear: Number(formData.currentYear),
        currentSemester: Number(formData.currentSemester),
        section: formData.section,
      },
    ]);

    // Reset form
    setFormData({
      rollNo: "",
      name: "",
      fatherName: "",
      branch: "",
      currentYear: "",
      currentSemester: "",
      section: "",
    });
    setSuccess("Student added to table! Click 'Save Students' to submit.");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    const errors = [];

    try {
      if (!students.length) {
        setError("No students to save.");
        return;
      }

      for (const record of students) {
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URI}/api/students`,
            record
          );
          if (response.status === 201) {
            // Assuming 201 Created status
            setSuccess((prev) =>
              prev
                ? `${prev} Student ${record.rollNo} saved successfully!`
                : `Student ${record.rollNo} saved successfully!`
            );
          }
        } catch (err) {
          const errorMessage =
            err.response?.data?.message ||
            `Failed to save student ${record.rollNo}`;
          errors.push(errorMessage);
        }
      }

      if (errors.length > 0) {
        setError(errors.join(", "));
        setSuccess("Some students were saved successfully!");
      } else {
        setSuccess("All students saved successfully!");
        // Do not clear the students array to keep the table populated
      }
    } catch (err) {
      setError("Unexpected error occurred while saving students");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Students Record Input
          </h1>
          <p className="text-gray-600">
            Enter and manage student records efficiently
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleAddStudent} className="space-y-6">
              {formError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label
                    htmlFor="rollNo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    name="rollNo"
                    id="rollNo"
                    value={formData.rollNo}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name *
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
                    htmlFor="fatherName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Father's Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    id="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="branch"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Branch *
                  </label>
                  <input
                    type="text"
                    name="branch"
                    id="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="currentYear"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Current Year *
                  </label>
                  <select
                    name="currentYear"
                    id="currentYear"
                    value={formData.currentYear}
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
                    htmlFor="currentSemester"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Current Semester *
                  </label>
                  <select
                    name="currentSemester"
                    id="currentSemester"
                    value={formData.currentSemester}
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
                    htmlFor="section"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Section *
                  </label>
                  <select
                    name="section"
                    id="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                    required
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
                >
                  <FaSave />
                  <span>Add Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {students.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                  Student Records
                </h2>
                <button
                  onClick={handleSave}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <FaSave />
                  <span>Save Students</span>
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
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Father Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.rollNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.fatherName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.branch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.currentYear}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.currentSemester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.section}
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
