import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from "../utils/Loader";
import COAttainmentDisplay from '../components/COAttainmentDisplay';

const DirectCOAttainmentReport = () => {
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("");
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [cie1Data, setCie1Data] = useState(null);
    const [cie2Data, setCie2Data] = useState(null);
    const [seeData, setSeeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const [error, setError] = useState(null);

    const selectedBranch = localStorage.getItem("selectedBranch");

    // Years and semesters for dropdowns
    const years = ["1", "2", "3", "4"];
    const semesters = ["1", "2"];

    // Fetch subjects when year and semester are selected
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedYear || !selectedSemester || !selectedBranch) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
                );
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setSubjectOptions(response.data);
                } else {
                    setSubjectOptions([]);
                }
            } catch (error) {
                console.error("Error fetching subjects:", error);
                setError(error.message);
                setSubjectOptions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, [selectedYear, selectedSemester, selectedBranch]);

    // Handle year change
    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        setSelectedSemester("");
        setSelectedSubject("");
        setShowTable(false);
        setSubjectOptions([]);
    };

    // Handle semester change
    const handleSemesterChange = (e) => {
        setSelectedSemester(e.target.value);
        setSelectedSubject("");
        setShowTable(false);
    };

    // Fetch attainment data when subject is selected
    const fetchAttainmentData = async () => {
        if (!selectedSubject) return;

        setLoading(true);
        setError(null);
        try {
            const [cie1Res, cie2Res, seeRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/examType/CIE-1`),
                axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/examType/CIE-2`),
                axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/examType/SEE`)
            ]);

            setCie1Data(cie1Res.data[0]);
            setCie2Data(cie2Res.data[0]);
            setSeeData(seeRes.data[0]);
            setShowTable(true);
        } catch (error) {
            console.error('Error fetching attainment data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        fetchAttainmentData();
    };

    // Calculation functions
    const calculateAverageAttainment = (coNo) => {
        let sum = 0;
        let count = 0;

        if (cie1Data?.attainmentData) {
            const cie1Entry = cie1Data.attainmentData.find(item => item.coNo === coNo);
            if (cie1Entry) {
                sum += cie1Entry.attainmentLevel;
                count++;
            }
        }

        if (cie2Data?.attainmentData) {
            const cie2Entry = cie2Data.attainmentData.find(item => item.coNo === coNo);
            if (cie2Entry) {
                sum += cie2Entry.attainmentLevel;
                count++;
            }
        }

        return count > 0 ? (sum / count).toFixed(2) : '-';
    };

    const calculateDirectCoAttainment = (ieLevel, eeLevel) => {
        if (ieLevel === '-' || eeLevel === '-') return '-';
        return ((0.3 * parseFloat(ieLevel)) + (0.7 * parseFloat(eeLevel))).toFixed(2);
    };

    const getExamTypes = (coNo) => {
        const exams = [];
        if (cie1Data?.attainmentData.some(item => item.coNo === coNo)) exams.push('CIE-1');
        if (cie2Data?.attainmentData.some(item => item.coNo === coNo)) exams.push('CIE-2');
        return exams.join(', ');
    };

    const allCOs = showTable ? [...new Set([
        ...(cie1Data?.attainmentData || []).map(item => item.coNo),
        ...(cie2Data?.attainmentData || []).map(item => item.coNo),
        ...(seeData?.attainmentData || []).map(item => item.coNo)
    ])].sort() : [];

    return (
        <div className="w-full max-w-6xl mx-auto p-4 mb-36 mt-10">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-slate-50 p-4 border-b">
                    <h2 className="text-xl font-bold text-center">Direct CO Attainment Report</h2>
                </div>

                {/* Filters */}
                <div className="p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-wrap justify-center gap-4 mb-6">
                            {/* Year Dropdown */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Year</label>
                                <select
                                    className="w-32 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedYear}
                                    onChange={handleYearChange}
                                >
                                    <option value="">Select Year</option>
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Semester Dropdown */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Semester</label>
                                <select
                                    className="w-32 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedSemester}
                                    onChange={handleSemesterChange}
                                    disabled={!selectedYear}
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map((sem) => (
                                        <option key={sem} value={sem}>
                                            {sem}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Dropdown */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Subject</label>
                                <select
                                    className="w-64 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedSubject}
                                    onChange={(e) => {
                                        setSelectedSubject(e.target.value);
                                        setShowTable(false);
                                    }}
                                    disabled={subjectOptions.length === 0}
                                >
                                    <option value="">Select Subject</option>
                                    {subjectOptions.map((subject) => (
                                        <option key={subject._id} value={subject._id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-center mb-8">
                            <button
                                type="submit"
                                disabled={!selectedSubject}
                                className={`px-6 py-2 text-white rounded ${!selectedSubject ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                Generate Report
                            </button>
                        </div>
                    </form>

                    {loading && <Loader loading={loading} />}

                    {error && (
                        <div className="text-center text-red-500 py-4">{error}</div>
                    )}

                    {showTable && !loading && (
                        <COAttainmentDisplay
                            showTable={showTable}
                            loading={loading}
                            allCOs={allCOs}
                            seeData={seeData}
                            getExamTypes={getExamTypes}
                            calculateAverageAttainment={calculateAverageAttainment}
                            calculateDirectCoAttainment={calculateDirectCoAttainment}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DirectCOAttainmentReport;
