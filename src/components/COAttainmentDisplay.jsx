import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function COAttainmentDisplay({ showTable, loading, allCOs, seeData, getExamTypes, calculateAverageAttainment, calculateDirectCoAttainment }) {
    const [chartData, setChartData] = useState([]);

    // Prepare chart data when CO data changes
    useEffect(() => {
        if (showTable && !loading && allCOs.length > 0) {
            const data = allCOs.map((coNo) => {
                const seeLevel = seeData?.attainmentData.find(item => item.coNo === coNo)?.attainmentLevel || '-';
                const ieLevel = calculateAverageAttainment(coNo);
                const directCoAttainment = calculateDirectCoAttainment(ieLevel, seeLevel);

                return {
                    name: coNo,
                    attainment: parseFloat(directCoAttainment) || 0
                };
            });
            setChartData(data);
        }
    }, [showTable, loading, allCOs, seeData]);

    if (!showTable || loading) return null;

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl">
            {/* Title with full border */}
            <div className="text-center border-2 border-black py-2">
                <h2 className="text-xl font-semibold">CO ATTAINMENT (Direct Method)</h2>
            </div>

            {/* Subtitle with full border */}
            <div className="text-center border-2 border-black py-2">
                <h3 className="font-medium">Computation of CO Direct Attainment in the course:</h3>
            </div>

            {/* Formula with full border */}
            <div className="text-center border-2 border-black py-2">
                <p className="font-medium">Attainment of CO in a course = 30% of CIE Attainment Level + 70% of SEE Attainment Level</p>
            </div>

            {/* Table section with full border */}
            <div className="overflow-x-auto border border-black">
                <div className="bg-gray-100 border border-black p-2 text-center font-bold">
                    Direct Attainment
                </div>
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="border border-black p-2 text-center">COs</th>
                            <th className="border border-black p-2 text-center">
                                Assessment Tool (Internal<br />Examination / External<br />Examination)
                            </th>
                            <th className="border border-black p-2 text-center">
                                <div>Internal Examination</div>
                                <div>(IE)</div>
                                <div className="border-t border-black pt-1 mt-1">Average Attainment</div>
                                <div>Level</div>
                            </th>
                            <th className="border border-black p-2 text-center">
                                <div>External Examination</div>
                                <div>(EE)</div>
                                <div className="border-t border-black pt-1 mt-1">Attainment Level</div>
                            </th>
                            <th className="border border-black p-2 text-center">
                                <div>Direct Co</div>
                                <div>Attainment= ((0.3*IE</div>
                                <div>Attainment</div>
                                <div>Level)+(0.7*EE</div>
                                <div>Attainment Level))</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {allCOs.map((coNo) => {
                            const seeLevel = seeData?.attainmentData.find(item => item.coNo === coNo)?.attainmentLevel || '-';
                            const ieLevel = calculateAverageAttainment(coNo);
                            const directCoAttainment = calculateDirectCoAttainment(ieLevel, seeLevel);

                            return (
                                <tr key={coNo}>
                                    <td className="border border-black p-2 text-center">{coNo}</td>
                                    <td className="border border-black p-2 text-center">{getExamTypes(coNo)}</td>
                                    <td className="border border-black p-2 text-center">{ieLevel}</td>
                                    <td className="border border-black p-2 text-center">{seeLevel}</td>
                                    <td className="border border-black p-2 text-center font-bold">{directCoAttainment}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Bar Chart with full border and centered in page */}
            <div className="flex justify-center">
                <div className="border-2 border-black rounded-lg p-4 mt-4 w-3/5">
                    <h3 className="text-xl font-bold text-center mb-4">CO Direct Attainment</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="90%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 5, right: 50, left: 40, bottom: 5 }}
                                barCategoryGap="30%"
                                barGap={30}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[1, 3]} ticks={[1, 1.5, 2, 2.5, 3]} />
                                <Tooltip />
                                <Bar dataKey="attainment" fill="#5470c6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}