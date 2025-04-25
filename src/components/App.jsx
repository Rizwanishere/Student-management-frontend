import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/* Import Components */
import Home from "./Home";
import Header from "./Header";
import Footer from "./Footer";
import Contact from "./Contact";
import BranchSelection from '../pages/BranchSelection';
import Login from '../pages/Login';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import AddFaculty from '../pages/AddFaculty';
import ManageFaculty from '../pages/ManageFaculty';
import ScrollToTop from "../utils/ScrollToTop";
import Attendance from "../pages/Attendance";
import Marks from "../pages/Marks";
import PostStudent from "../pages/PostStudent";
import PostSubjects from "../pages/PostSubjects";
import ReportsPage from "../pages/ReportsPage";
import MarksReport from "../pages/MarksReport"
import AttendanceReport from "../pages/AttendanceReport";
import ProgressReport from "../pages/ProgressReport";
import VerifyStudent from "../pages/VerifyStudent"
import InternalMarks from "../pages/InternalMarks";
import CourseOutcomeForm from "../pages/CourseOutcomeForm";
import AttainmentReport from "../pages/AttainmentReport";
import SEEAttainmentReport from "../pages/SEEAttainmentReport";
import DirectCOAttainmentReport from "../pages/DirectCOAttainmentReport";
import IndirectAttainment from "../pages/IndirectAttainment";
import IndirectCOAttainmentReport from "../pages/IndirectCOAttainmentReport";
import OverallCOAttainmentReport from "../pages/OverallCOAttainmentReport";
import POAttainmentReport from "../pages/POAttainmentReport";
import AboutUs from "./AboutUs";
import CreateStudent from "../pages/CreateStudent";

const App = () => {
  const selectedBranch = localStorage.getItem('selectedBranch');
  
  // Auth guard for admin routes
  const AdminRoute = ({ element }) => {
    const userRole = localStorage.getItem('userRole');
    return userRole === 'admin' ? element : <Navigate to="/admin-login" />;
  };

  return (
    <Router>
      <Header />
      <Routes>
        {/* Admin Management Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminRoute element={<AdminDashboard />} />} />
        <Route path="/add-faculty" element={<AdminRoute element={<AddFaculty />} />} />
        <Route path="/manage-faculty" element={<AdminRoute element={<ManageFaculty />} />} />

        {/* If no branch selected, show BranchSelection as the default route */}
        <Route path="/" element={selectedBranch ? <Navigate to="/login" /> : <BranchSelection />} />

        {/* Route to Login after branch selection */}
        <Route path="/login" element={<Login />} />

        {/* Route to home after login */}
        <Route path="/home" element={<Home />} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<AboutUs />} />

        {/* Routes for Attendance and Marks are now accessible without login */}
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/marks" element={<Marks />} />
        <Route path="/reports" element={<ReportsPage />} />

        <Route path="/reports/marks" element={<MarksReport />} />
        <Route path="/reports/attendance" element={<AttendanceReport />} />

        <Route path="/progressreport" element={<ProgressReport />} />

        <Route path="/poststudent" element={<PostStudent />} />
        {/* Route for single student  */}
        <Route path="/createStudent" element={<CreateStudent />} />

        <Route path="/postsubjects" element={<PostSubjects />} />
        <Route path="/verify" element={<VerifyStudent />} />

        <Route path="/internalmarks" element={<InternalMarks />} />

        <Route path="/course-outcome" element={<CourseOutcomeForm />} />

        <Route path="/attainment" element={<AttainmentReport />} />
        <Route path="/attainment/see" element={<SEEAttainmentReport />} />

        <Route path="/attainment/direct" element={<DirectCOAttainmentReport />} />
        <Route path="/attainment/indirect" element={<IndirectCOAttainmentReport />} />
        <Route path="/attainment/overall" element={<OverallCOAttainmentReport />} />
        <Route path="/attainment/po" element={<POAttainmentReport />} />

        <Route path="/attainment/entry" element={<IndirectAttainment />} />
        

        {/* Redirect any unknown path to the root (Branch Selection) */}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
      <ScrollToTop />
    </Router>
  );
};

export default App;
