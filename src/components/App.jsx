import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "../utils/UserContext";

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
import CreateSubject from "../pages/CreateSubject";
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

// Admin Route Protection
const AdminRoute = ({ element }) => {
  const { user, isAdmin } = useUser();
  
  if (!user || !isAdmin()) {
    return <Navigate to="/admin-login" replace />;
  }
  return element;
};

// Protected Route for Faculty/Admin
const ProtectedRoute = ({ element }) => {
  const { user } = useUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return element;
};

const AppContent = () => {
  const { user } = useUser();
  const isLoggedIn = Boolean(user) || localStorage.getItem('isLoggedIn') === 'true';
  const selectedBranch = localStorage.getItem('selectedBranch');

  // Root path handler component
  const RootPathHandler = () => {
    if (selectedBranch) {
      // If branch is selected, redirect based on login status
      return isLoggedIn ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
    } else {
      // If no branch selected, show branch selection
      return <BranchSelection />;
    }
  };
  
  return (
    <Router>
      <ScrollToTop />
      <Header />
      <Routes>
        {/* Root path now uses the handler component */}
        <Route path="/" element={<RootPathHandler />} />
        
        <Route path="/branch-selection" element={<BranchSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<AboutUs />} />

        {/* Initial route handling */}
        <Route path="/index.html" element={<RootPathHandler />} />
        
        {/* Protected Routes */}
        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />

        {/* Admin Management Routes */}
        <Route path="/admin-dashboard" element={<AdminRoute element={<AdminDashboard />} />} />
        <Route path="/add-faculty" element={<AdminRoute element={<AddFaculty />} />} />
        <Route path="/manage-faculty" element={<AdminRoute element={<ManageFaculty />} />} />
        <Route path="/post-student" element={<AdminRoute element={<PostStudent />} />} />
        <Route path="/create-student" element={<AdminRoute element={<CreateStudent />} />} />
        <Route path="/post-subject" element={<AdminRoute element={<PostSubjects />} />} />
        <Route path="/create-subject" element={<AdminRoute element={<CreateSubject />} />} />
        
        {/* Faculty Routes */}
        <Route path="/attendance" element={<ProtectedRoute element={<Attendance />} />} />
        <Route path="/marks" element={<ProtectedRoute element={<Marks />} />} />
        <Route path="/reports" element={<ProtectedRoute element={<ReportsPage />} />} />
        <Route path="/reports/marks" element={<ProtectedRoute element={<MarksReport />} />} />
        <Route path="/reports/attendance" element={<ProtectedRoute element={<AttendanceReport />} />} />
        <Route path="/progressreport" element={<ProtectedRoute element={<ProgressReport />} />} />
        <Route path="/verify" element={<ProtectedRoute element={<VerifyStudent />} />} />
        <Route path="/internalmarks" element={<ProtectedRoute element={<InternalMarks />} />} />
        <Route path="/course-outcome" element={<ProtectedRoute element={<CourseOutcomeForm />} />} />
        <Route path="/attainment" element={<ProtectedRoute element={<AttainmentReport />} />} />
        <Route path="/attainment/see" element={<ProtectedRoute element={<SEEAttainmentReport />} />} />
        <Route path="/attainment/direct" element={<ProtectedRoute element={<DirectCOAttainmentReport />} />} />
        <Route path="/attainment/indirect" element={<ProtectedRoute element={<IndirectCOAttainmentReport />} />} />
        <Route path="/attainment/overall" element={<ProtectedRoute element={<OverallCOAttainmentReport />} />} />
        <Route path="/attainment/po" element={<ProtectedRoute element={<POAttainmentReport />} />} />
        <Route path="/attainment/entry" element={<ProtectedRoute element={<IndirectAttainment />} />} />

        {/* Catch-all route - redirect to appropriate place based on auth status */}
        <Route path="*" element={isLoggedIn ? <Navigate to="/home" /> : <Navigate to="/login" />} />
      </Routes>
      <Footer />
    </Router>
  );
};

const App = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;
