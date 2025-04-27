import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  BarChart3,
  PieChart,
  CheckCircle,
  AlertTriangle,
  Loader
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportData {
  vaccinationRateByGrade: {
    grade: string;
    rate: number;
  }[];
  vaccinationStatusDistribution: {
    status: string;
    count: number;
  }[];
  recentVaccinations: {
    date: string;
    count: number;
  }[];
  vaccineTypeDistribution: {
    type: string;
    count: number;
  }[];
  vaccinationRateByMonth: {
    month: string;
    rate: number;
  }[];
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [vaccineType, setVaccineType] = useState('all');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [activeReport, setActiveReport] = useState('vaccination_status');

  useEffect(() => {
    // Simulating data fetching
    const fetchReportData = async () => {
      try {
        // In a real application, this would be an API call
        // const response = await axios.get('/api/reports/data');
        // setReportData(response.data);
        
        // Mock data for demonstration
        setTimeout(() => {
          const mockData: ReportData = {
            vaccinationRateByGrade: [
              { grade: '9th', rate: 78 },
              { grade: '10th', rate: 85 },
              { grade: '11th', rate: 72 },
              { grade: '12th', rate: 80 }
            ],
            vaccinationStatusDistribution: [
              { status: 'Fully Vaccinated', count: 876 },
              { status: 'Partially Vaccinated', count: 245 },
              { status: 'Not Vaccinated', count: 124 }
            ],
            recentVaccinations: [
              { date: '2025-01-01', count: 25 },
              { date: '2025-01-02', count: 18 },
              { date: '2025-01-03', count: 32 },
              { date: '2025-01-04', count: 15 },
              { date: '2025-01-05', count: 28 },
              { date: '2025-01-06', count: 22 },
              { date: '2025-01-07', count: 30 }
            ],
            vaccineTypeDistribution: [
              { type: 'COVID-19', count: 450 },
              { type: 'Influenza', count: 350 },
              { type: 'MMR', count: 250 },
              { type: 'HPV', count: 195 }
            ],
            vaccinationRateByMonth: [
              { month: 'Jan', rate: 65 },
              { month: 'Feb', rate: 72 },
              { month: 'Mar', rate: 78 },
              { month: 'Apr', rate: 80 },
              { month: 'May', rate: 83 },
              { month: 'Jun', rate: 76 }
            ]
          };
          setReportData(mockData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const generatePdf = () => {
    // In a real application, this would generate a report based on the filtered data
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('School Vaccination Report', 105, 15, { align: 'center' });
    
    // Add date information
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
    
    // Add filters if applied
    let yPos = 35;
    doc.setFontSize(12);
    doc.text('Applied Filters:', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    
    if (dateRange[0] && dateRange[1]) {
      doc.text(`Date Range: ${dateRange[0]} to ${dateRange[1]}`, 25, yPos);
      yPos += 5;
    }
    
    if (vaccineType !== 'all') {
      doc.text(`Vaccine Type: ${vaccineType}`, 25, yPos);
      yPos += 5;
    }
    
    if (selectedGrades.length > 0) {
      doc.text(`Grades: ${selectedGrades.join(', ')}`, 25, yPos);
      yPos += 5;
    }
    
    yPos += 10;
    
    // Create table for vaccination status
    doc.text('Vaccination Status Distribution', 20, yPos);
    yPos += 5;
    
    const statusData = reportData?.vaccinationStatusDistribution.map(item => [
      item.status, item.count.toString(), `${Math.round((item.count / 1245) * 100)}%`
    ]) || [];
    
    (doc as any).autoTable({
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      startY: yPos,
      theme: 'grid'
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Create table for vaccine type distribution
    doc.text('Vaccine Type Distribution', 20, yPos);
    yPos += 5;
    
    const typeData = reportData?.vaccineTypeDistribution.map(item => [
      item.type, item.count.toString()
    ]) || [];
    
    (doc as any).autoTable({
      head: [['Vaccine Type', 'Count']],
      body: typeData,
      startY: yPos,
      theme: 'grid'
    });
    
    // Save the document
    doc.save('vaccination_report.pdf');
  };

  // Report card component
  const ReportCard = ({ 
    title, 
    icon, 
    reportId,
    children 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    reportId: string;
    children: React.ReactNode; 
  }) => (
    <div 
      className={`bg-white rounded-lg shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer
        ${activeReport === reportId ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => setActiveReport(reportId)}
    >
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 slide-in">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Reports</h1>
        <button 
          className="btn btn-primary"
          onClick={generatePdf}
        >
          <Download className="h-4 w-4 mr-2" />
          Export as PDF
        </button>
      </div>

      {/* Filters section */}
      <div className="bg-white p-5 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Report Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="input"
              value={dateRange[0]}
              onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="input"
              value={dateRange[1]}
              onChange={(e) => setDateRange([dateRange[0], e.target.value])}
            />
          </div>
          
          <div>
            <label htmlFor="vaccineType" className="block text-sm font-medium text-gray-700 mb-1">
              Vaccine Type
            </label>
            <select
              id="vaccineType"
              className="input"
              value={vaccineType}
              onChange={(e) => setVaccineType(e.target.value)}
            >
              <option value="all">All Vaccines</option>
              <option value="COVID-19">COVID-19</option>
              <option value="Influenza">Influenza</option>
              <option value="MMR">MMR</option>
              <option value="HPV">HPV</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grades
            </label>
            <div className="flex space-x-2">
              {['9th', '10th', '11th', '12th'].map((grade) => (
                <label key={grade} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    checked={selectedGrades.includes(grade)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGrades([...selectedGrades, grade]);
                      } else {
                        setSelectedGrades(selectedGrades.filter(g => g !== grade));
                      }
                    }}
                  />
                  <span className="ml-1 mr-2 text-sm">{grade}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button className="btn btn-outline mr-2">
            Reset
          </button>
          <button className="btn btn-primary">
            Apply Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Report cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard title="Vaccination Status" icon={<CheckCircle className="h-5 w-5 text-blue-600" />} reportId="vaccination_status">
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round((reportData?.vaccinationStatusDistribution.find(item => item.status === 'Fully Vaccinated')?.count || 0) / 1245 * 100)}%
                </div>
                <div className="text-sm text-gray-500">
                  Overall Vaccination Rate
                </div>
                <div className="mt-4 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700">Fully Vaccinated</span>
                    <span className="text-green-600 font-medium">
                      {reportData?.vaccinationStatusDistribution.find(item => item.status === 'Fully Vaccinated')?.count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700">Partially Vaccinated</span>
                    <span className="text-amber-600 font-medium">
                      {reportData?.vaccinationStatusDistribution.find(item => item.status === 'Partially Vaccinated')?.count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Not Vaccinated</span>
                    <span className="text-red-600 font-medium">
                      {reportData?.vaccinationStatusDistribution.find(item => item.status === 'Not Vaccinated')?.count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </ReportCard>
            
            <ReportCard title="Vaccination by Grade" icon={<BarChart3 className="h-5 w-5 text-blue-600" />} reportId="vaccination_by_grade">
              <div className="p-4">
                {reportData?.vaccinationRateByGrade.map((item) => (
                  <div key={item.grade} className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">Grade {item.grade}</span>
                      <span className="text-sm font-medium text-gray-900">{item.rate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.rate > 80 
                            ? 'bg-green-500' 
                            : item.rate > 60 
                              ? 'bg-blue-500' 
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>
            
            <ReportCard title="Vaccine Type Distribution" icon={<PieChart className="h-5 w-5 text-blue-600" />} reportId="vaccine_type">
              <div className="p-4">
                {reportData?.vaccineTypeDistribution.map((item) => (
                  <div key={item.type} className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        item.type === 'COVID-19' 
                          ? 'bg-blue-500' 
                          : item.type === 'Influenza' 
                            ? 'bg-green-500' 
                            : item.type === 'MMR' 
                              ? 'bg-amber-500' 
                              : 'bg-purple-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">{item.type}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </ReportCard>
            
            <ReportCard title="Monthly Progress" icon={<Calendar className="h-5 w-5 text-blue-600" />} reportId="monthly_progress">
              <div className="p-4">
                {reportData?.vaccinationRateByMonth.map((item) => (
                  <div key={item.month} className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{item.month} 2025</span>
                      <span className="text-sm font-medium text-gray-900">{item.rate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${item.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>
          </div>
          
          {/* More detailed report view */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {activeReport === 'vaccination_status' && 'Vaccination Status Breakdown'}
              {activeReport === 'vaccination_by_grade' && 'Vaccination Rates by Grade'}
              {activeReport === 'vaccine_type' && 'Vaccine Type Distribution'}
              {activeReport === 'monthly_progress' && 'Monthly Vaccination Progress'}
            </h2>

            <div className="pt-4">
              <div className="flex justify-center items-center text-gray-500">
                <Loader className="h-5 w-5 mr-2" />
                <span>Detailed reports with charts would be displayed here based on the selected report.</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;