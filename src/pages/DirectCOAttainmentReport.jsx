import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from "../utils/Loader";
import COAttainmentDisplay from '../components/COAttainmentDisplay';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaFilePdf } from 'react-icons/fa';

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

    const postAttainmentData = async () => {
        // Only proceed with POST request if we have the data
        if (showTable && allCOs.length > 0) {
            try {
                setLoading(true);

                // Map the attainment data
                const mappedAttainmentData = allCOs.map(coNo => ({
                    coNo,
                    attainmentLevel: parseFloat(calculateDirectCoAttainment(
                        calculateAverageAttainment(coNo),
                        seeData?.attainmentData.find(item => item.coNo === coNo)?.attainmentLevel || '-'
                    ))
                })).filter(item => !isNaN(item.attainmentLevel));

                // Prepare the request body
                const requestBody = {
                    subject: selectedSubject,
                    attainmentData: mappedAttainmentData,
                    attainmentType: "computedDirect",
                    examType: "COMPUTED"
                };

                // Make the POST request
                await axios.post(
                    `${process.env.REACT_APP_BACKEND_URI}/api/attainment`,
                    requestBody
                );

            } catch (error) {
                console.error('Error posting computed direct attainment:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
    }

    // Export data to PDF
    const exportToPDF = async () => {
        if (!showTable) return;

        // Create a wrapper div for the table content
        const tableWrapper = document.createElement("div");
        tableWrapper.id = "table-pdf-wrapper";
        tableWrapper.style.backgroundColor = "#ffffff";
        tableWrapper.style.padding = "20px";
        tableWrapper.style.width = "297mm"; // A4 width
        tableWrapper.style.maxWidth = "297mm";
        tableWrapper.style.overflow = "visible";

        // Create a wrapper div for the graph content
        const graphWrapper = document.createElement("div");
        graphWrapper.id = "graph-pdf-wrapper";
        graphWrapper.style.backgroundColor = "#ffffff";
        graphWrapper.style.padding = "20px";
        graphWrapper.style.width = "297mm"; // A4 width
        graphWrapper.style.maxWidth = "297mm";
        graphWrapper.style.overflow = "visible";

        // Clone the content to avoid modifying the original
        const contentOriginal = document.querySelector(".flex.flex-col.gap-6.w-full.max-w-5xl");
        const contentClone = contentOriginal.cloneNode(true);

        // Split the content into table and graph sections
        const tableSection = contentClone.cloneNode(true);
        const graphSection = contentClone.cloneNode(true);

        // Remove graph from table section
        const graphElement = tableSection.querySelector(".flex.justify-center");
        if (graphElement) {
            graphElement.remove();
        }

        // For graph section, keep only the graph container and its parent
        const graphContainer = graphSection.querySelector(".flex.justify-center");
        if (graphContainer) {
            // Clear the graph section
            while (graphSection.firstChild) {
                graphSection.removeChild(graphSection.firstChild);
            }
            // Add only the graph container
            graphSection.appendChild(graphContainer);
        }

        // Add the sections to their respective wrappers
        tableWrapper.appendChild(tableSection);
        graphWrapper.appendChild(graphSection);

        // Ensure all table cells have explicit width settings
        tableWrapper.querySelectorAll("th, td").forEach((cell) => {
            cell.style.width = "auto";
            cell.style.minWidth = "auto";
            cell.style.whiteSpace = "normal";
            cell.style.overflow = "visible";
        });

        // Fix for table layout and column visibility
        Array.from(tableWrapper.querySelectorAll("table")).forEach((table) => {
            table.style.width = "100%";
            table.style.tableLayout = "fixed";

            // Ensure all table headers are visible
            const headers = table.querySelectorAll("th");
            headers.forEach((header) => {
                header.style.backgroundColor = "#e0e0e0";
                header.style.fontWeight = "bold";
                header.style.overflow = "visible";
                header.style.whiteSpace = "normal";
                header.style.height = "auto";
                header.style.minHeight = "40px";
                header.style.position = "relative";
                header.style.zIndex = "1";
            });
        });

        // Ensure the graph container has proper dimensions
        const graphContainerElement = graphWrapper.querySelector(".flex.justify-center");
        if (graphContainerElement) {
            graphContainerElement.style.width = "100%";
            graphContainerElement.style.height = "400px"; // Fixed height for the graph
            graphContainerElement.style.display = "flex";
            graphContainerElement.style.justifyContent = "center";
            graphContainerElement.style.alignItems = "center";
        }

        // Temporarily add the wrappers to the document body for rendering
        document.body.appendChild(tableWrapper);
        document.body.appendChild(graphWrapper);

        try {
            // Create PDF
            const pdf = new jsPDF({
                orientation: "l",
                unit: "mm",
                format: "a4",
                compress: true,
            });

            // Generate first page (table)
            const tableCanvas = await html2canvas(tableWrapper, {
                scale: 2,
                scrollX: 0,
                scrollY: 0,
                ignoreElements: (element) => element.tagName === "IFRAME",
                onclone: (clonedDoc) => {
                    clonedDoc.querySelectorAll("th").forEach((header) => {
                        header.style.display = "table-cell";
                        header.style.visibility = "visible";
                        header.style.position = "relative";
                        header.style.zIndex = "1";
                    });
                    clonedDoc.querySelectorAll("table").forEach((table) => {
                        table.style.transform = "none";
                    });
                },
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                width: tableWrapper.offsetWidth,
                height: tableWrapper.offsetHeight,
                letterRendering: true,
                allowTaint: true,
                windowWidth: tableWrapper.scrollWidth,
                windowHeight: tableWrapper.scrollHeight,
            });

            const pdfWidth = 297; // Landscape A4 width
            // const pdfHeight = 210; // Landscape A4 height
            const margin = 10;
            const imgWidth = pdfWidth - margin * 2;
            const imgHeight = (tableCanvas.height * imgWidth) / tableCanvas.width;

            const tableImgData = tableCanvas.toDataURL("image/jpeg", 1.0);
            pdf.addImage(tableImgData, "JPEG", margin, margin, imgWidth, imgHeight);

            // Generate second page (graph)
            pdf.addPage();
            const graphCanvas = await html2canvas(graphWrapper, {
                scale: 2,
                scrollX: 0,
                scrollY: 0,
                ignoreElements: (element) => element.tagName === "IFRAME",
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                width: graphWrapper.offsetWidth,
                height: graphWrapper.offsetHeight,
                letterRendering: true,
                allowTaint: true,
                windowWidth: graphWrapper.scrollWidth,
                windowHeight: graphWrapper.scrollHeight,
            });

            const graphImgData = graphCanvas.toDataURL("image/jpeg", 1.0);
            pdf.addImage(graphImgData, "JPEG", margin, margin, imgWidth, imgHeight);

            pdf.save("Direct_CO_Attainment_Report.pdf");
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("There was an error generating the PDF. Please try again.");
        } finally {
            document.body.removeChild(tableWrapper);
            document.body.removeChild(graphWrapper);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 mb-36 mt-10">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-blue-600 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Direct CO Attainment Report</h2>
                    {showTable && !loading && (
                        <button
                            onClick={exportToPDF}
                            className="inline-flex items-center px-6 py-3 bg-white text-primary rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                        >
                            <FaFilePdf className="mr-2 text-xl" />
                            Export to PDF
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Year Dropdown */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                                    value={selectedYear}
                                    onChange={handleYearChange}
                                >
                                    <option value="">Select Year</option>
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            Year {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Semester Dropdown */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Semester</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
                                    value={selectedSemester}
                                    onChange={handleSemesterChange}
                                    disabled={!selectedYear}
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map((sem) => (
                                        <option key={sem} value={sem}>
                                            Semester {sem}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Dropdown */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-gray-50"
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

                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={!selectedSubject}
                                className={`px-8 py-3 mb-10 text-white rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${
                                    !selectedSubject
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary hover:bg-blue-600'
                                }`}
                            >
                                Generate Report
                            </button>
                        </div>
                    </form>

                    {loading && (
                        <div className="flex justify-center my-8">
                            <Loader />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
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

                    {showTable && !loading && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={postAttainmentData}
                                disabled={!selectedSubject}
                                className={`px-8 py-3 text-white rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${
                                    !selectedSubject
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary hover:bg-blue-600'
                                }`}
                            >
                                Save Attainments
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DirectCOAttainmentReport;
