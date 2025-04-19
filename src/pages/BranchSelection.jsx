import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BranchSelection = () => {
  const [branch, setBranch] = useState("");
  const navigate = useNavigate();

  const handleBranchSelection = () => {
    if (branch) {
      localStorage.setItem("selectedBranch", branch); // Store the selected branch
      navigate("/login"); // Navigate to Home page
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold mb-4">Select Branch</h2>
      <select
        className="border border-black rounded-xl w-1/4 p-2 rounded"
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
      >
        <option value="">Select Branch</option>
        <option value="CSE">CSE</option>
        <option value="IT">IT</option>
        <option value="ECE">ECE</option>
        {/* Add more branches as needed */}
      </select>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleBranchSelection}
      >
        Continue
      </button>
    </div>
  );
};

export default BranchSelection;
