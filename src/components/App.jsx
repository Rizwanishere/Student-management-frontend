import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/* Import Components */
import Home from "./Home";
import Header from "./Header";
import Footer from "./Footer";
import BranchSelection from '../pages/BranchSelection';
import Login from '../pages/Login';
import ScrollToTop from "../utils/ScrollToTop";
import Attendance from "../pages/Attendance";
import Marks from "../pages/Marks";
import PostStudent from "../pages/PostStudent";
import ReportsPage from "../pages/ReportsPage";
import MarksReport from "../pages/MarksReport"
import AttendanceReport from "../pages/AttendanceReport";
import ProgressReport from "../pages/ProgressReport";
import VerifyStudent from "../pages/VerifyStudent"
import InternalMarks from "../pages/InternalMarks";

const App = () => {
  const selectedBranch = localStorage.getItem('selectedBranch'); // Check if branch is selected
  return (
    <Router>
      <Header />
      <Routes>
        {/* If no branch selected, show BranchSelection as the default route */}
        <Route path="/" element={selectedBranch ? <Navigate to="/login" /> : <BranchSelection />} />

        {/* Route to Login after branch selection */}
        <Route path="/login" element={<Login />} />

        {/* Route to home after login */}
        <Route path="/home" element={<Home />} />

        {/* Routes for Attendance and Marks are now accessible without login */}
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/marks" element={<Marks />} />
        <Route path="/reports" element={<ReportsPage />} />

        <Route path="/reports/marks" element={<MarksReport />} />
        <Route path="/reports/attendance" element={<AttendanceReport />} />

        <Route path="/progressreport" element={<ProgressReport />} />

        <Route path="/poststudent" element={<PostStudent />} />
        <Route path="/verify" element={<VerifyStudent />} />

        <Route path="/internalmarks" element={<InternalMarks />} />

        {/* Redirect any unknown path to the root (Branch Selection) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
      <ScrollToTop />
    </Router>
  );
};

export default App;
