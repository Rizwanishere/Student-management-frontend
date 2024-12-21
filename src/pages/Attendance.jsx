import React, { useState, useEffect } from "react";
import axios from "axios";

const Attendance = () => {
  const [submitted, setSubmitted] = useState(false);
  const [totalClasses, setTotalClasses] = useState("");
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]); // State to store subjects
  const [filters, setFilters] = useState({
    year: "",
    semester: "",
    section: "",
    subject: "",
    month: "", 
    period: "",
  });
  const selectedBranch = localStorage.getItem("selectedBranch");
  const [attendanceData, setAttendanceData] = useState([]);

  // Fetch attendance from the backend
  const fetchAttendance = async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    if (filters.period) {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/students/attendance/month/${filters.month}/year/${year}/period/${filters.period}`
        );
        console.log("Attendance Data:", response.data);
        setAttendanceData(response.data); // Assuming `attendanceData` is a state variable to hold the attendance data
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    }
  };

  // Fetch subjects from backend
  const fetchSubjects = async () => {
    if (filters.year && filters.semester) {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/subjects/branch/${selectedBranch}/year/${filters.year}/semester/${filters.semester}`
        );
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    }
  };

  const fetchStudents = async () => {
    if (filters.year && filters.semester && filters.section) {
      if (selectedBranch) {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/students/filtered?branch=${selectedBranch}&year=${filters.year}&semester=${filters.semester}&section=${filters.section}&subjectId=${filters.subject}&period=${filters.period}`
          );
          setStudents(response.data);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      }
    }
  };

  useEffect(() => {
    // Fetch subjects when year and semester change
    fetchSubjects();
    fetchAttendance();
  }, [filters.year, filters.semester, filters.month, filters.period]); // Triggers when either year, semester, or period is updated

  useEffect(() => {
    if (submitted) fetchStudents();
  }, [submitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(false);
    await fetchStudents();
    setSubmitted(true);
  };

  // Handle attendance change for each student by updating attendanceData
  const handleAttendanceChange = (studentId, value) => {
    const updatedAttendanceData = attendanceData.map((record) => {
      if (record.student === studentId && record.subject === filters.subject) {
        // Update classesAttended for the matching record
        return {
          ...record,
          classesAttended: value ? Number(value) : "",
        };
      }
      return record;
    });

    // Check if the student has an attendance record for the current subject
    const studentHasAttendance = updatedAttendanceData.some(
      (record) =>
        record.student === studentId && record.subject === filters.subject
    );

    // If no record exists, create a new entry
    if (!studentHasAttendance && value !== "") {
      updatedAttendanceData.push({
        student: studentId,
        subject: filters.subject,
        classesAttended: value ? Number(value) : "",
      });
    }

    setAttendanceData(updatedAttendanceData);
  };

  const handleSave = async () => {
    console.log("Attendance Data before processing:", attendanceData);
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    try {
      for (let record of attendanceData) {
        const { student, _id, classesAttended, subject } = record;
        console.log("Processing record:", record); // Check the individual record

        // Check if subject and student match the filter
        if (subject === filters.subject) {
          if (_id) {
            // If _id exists, do PUT (update)
            console.log("Attempting to update attendance:", record); // Check PUT request
            const response = await axios.put(
              `http://localhost:3000/api/students/attendance/${_id}`,
              {
                student,
                subject,
                totalClasses, // Assuming this is a predefined variable
                classesAttended,
                period: filters.period,
                month: filters.month,
                year,
              }
            );
            console.log("PUT request response:", response); // Verify response
          } else {
            // If no _id, it means this is a new attendance record
            console.log(
              "Attempting to create new attendance for student:",
              student
            );
            await handleSaveEmptyAttendance(student, classesAttended, subject);
          }
        } else {
          console.log(
            "Skipping record, subject does not match filter:",
            record
          );
        }
      }
      alert("Attendance process completed successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance");
    }
  };

  // Ensure handleSaveEmptyAttendance only creates new records
  const handleSaveEmptyAttendance = async (
    studentId,
    classesAttended,
    subject
  ) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    try {
      console.log("Creating new attendance for student:", studentId); // Check if this is triggered
      const response = await axios.post(
        `http://localhost:3000/api/students/attendance`,
        {
          student: studentId,
          subject: subject,
          totalClasses: totalClasses, // Ensure totalClasses is set
          classesAttended: classesAttended,
          period: filters.period,
          month: filters.month,
          year: year,
        }
      );
      console.log("POST request response:", response); // Check POST response
      alert("Attendance created successfully");
    } catch (error) {
      console.error("Error creating attendance:", error);
      alert("Failed to create attendance");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <form
        className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold mb-4">Attendance Entry</h2>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select
            className="border p-2 rounded"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            className="border p-2 rounded"
            value={filters.semester}
            onChange={(e) =>
              setFilters({ ...filters, semester: e.target.value })
            }
          >
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>

          <select
            className="border p-2 rounded"
            value={filters.section}
            onChange={(e) =>
              setFilters({ ...filters, section: e.target.value })
            }
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          <select
            className="border p-2 rounded"
            value={filters.subject}
            onChange={(e) =>
              setFilters({ ...filters, subject: e.target.value })
            }
          >
            <option value="">Select Subject</option>
            {/* Dynamically render subjects */}
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>

           {/* New Month Dropdown */}
           <select
            className="border p-2 rounded"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            <option value="">Select Month</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          <select
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">Select Attendance Period</option>
            <option value="15th">Up to 15th</option>
            <option value="30th">Up to 30th</option>
          </select>
        </div>

        {/* Total classes taken */}
        <input
          type="number"
          placeholder="Total No. of Classes Taken"
          className="border p-2 rounded w-full mt-4"
          value={totalClasses}
          onChange={(e) => setTotalClasses(e.target.value)}
          required
        />

        {/* Submit button */}
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enter
        </button>
      </form>

      {/* Conditionally render the table after form submission */}
      {submitted && students.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-6xl">
          <h3 className="text-xl font-semibold mb-4">Attendance Table</h3>

          <table className="table-auto w-full border border-2">
            <thead>
              <tr>
                <th className="border px-4 py-2">S No</th>
                <th className="border px-4 py-2">Roll No</th>
                <th className="border px-4 py-2">Student Name</th>
                <th className="border px-4 py-2">Classes Attended</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                // Get the matching attendance record for the student and subject
                const attendanceRecord = attendanceData.find(
                  (record) =>
                    record.student === student._id &&
                    record.subject === filters.subject
                );
                return (
                  <tr key={student._id}>
                    <td className="border px-4 py-2">{1}</td>
                    <td className="border px-4 py-2">{student.rollNo}</td>
                    <td className="border px-4 py-2">{student.name}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        className="border p-2 rounded w-full text-center"
                        placeholder="Enter classes attended"
                        value={
                          attendanceRecord?.classesAttended || "" // Show existing value if available, else empty
                        }
                        onChange={(e) =>
                          handleAttendanceChange(student._id, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="mt-4 px-4 py-2 bg-secondary hover:bg-primary text-white rounded"
          >
            Save Attendance
          </button>
        </div>
      )}
    </div>
  );
};

export default Attendance;
