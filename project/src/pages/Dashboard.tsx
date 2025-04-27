import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  CheckSquare, 
  AlertCircle, 
  Calendar, 
  ArrowUp, 
  ArrowDown,
  TrendingUp 
} from 'lucide-react';

// Components
import DashboardCard from '../components/dashboard/DashboardCard';
import VaccinationProgress from '../components/dashboard/VaccinationProgress';
import UpcomingDrives from '../components/dashboard/UpcomingDrives';
import VaccinationChart from '../components/dashboard/VaccinationChart';

interface DashboardStats {
  totalStudents: number;
  vaccinatedStudents: number;
  pendingVaccinations: number;
  upcomingDrives: number;
  vaccinationRate: number;
  recentVaccinationData: {
    date: string;
    count: number;
  }[];
  upcomingDrivesList: {
    _id: string;
    name: string;
    date: string;
    location: string;
    vaccineType: string;
    targetCount: number;
  }[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    vaccinatedStudents: 0,
    pendingVaccinations: 0,
    upcomingDrives: 0,
    vaccinationRate: 0,
    recentVaccinationData: [],
    upcomingDrivesList: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulating data fetching from API
    const fetchDashboardData = async () => {
      try {
        // In a real application, this would be an API call
        // const response = await axios.get('/api/dashboard/stats');
        // setStats(response.data);
        
        // Mock data for demonstration
        setTimeout(() => {
          setStats({
            totalStudents: 1245,
            vaccinatedStudents: 876,
            pendingVaccinations: 369,
            upcomingDrives: 3,
            vaccinationRate: 70.4,
            recentVaccinationData: [
              { date: '2025-01-01', count: 25 },
              { date: '2025-01-02', count: 18 },
              { date: '2025-01-03', count: 32 },
              { date: '2025-01-04', count: 15 },
              { date: '2025-01-05', count: 28 },
              { date: '2025-01-06', count: 22 },
              { date: '2025-01-07', count: 30 }
            ],
            upcomingDrivesList: [
              {
                _id: '1',
                name: 'Annual Flu Vaccination',
                date: '2025-02-15T09:00:00.000Z',
                location: 'School Gymnasium',
                vaccineType: 'Influenza',
                targetCount: 300
              },
              {
                _id: '2',
                name: 'COVID-19 Booster',
                date: '2025-02-20T10:00:00.000Z',
                location: 'Auditorium',
                vaccineType: 'COVID-19 Booster',
                targetCount: 250
              },
              {
                _id: '3',
                name: 'MMR Vaccination',
                date: '2025-03-05T08:30:00.000Z',
                location: 'Health Center',
                vaccineType: 'MMR',
                targetCount: 180
              }
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const vaccinationChange = +2.5; // Example: 2.5% increase from last month

  return (
    <div className="space-y-6 slide-in">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Students"
          value={stats.totalStudents.toString()}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <DashboardCard
          title="Vaccinated Students"
          value={stats.vaccinatedStudents.toString()}
          icon={<CheckSquare className="h-6 w-6 text-green-600" />}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
        <DashboardCard
          title="Pending Vaccinations"
          value={stats.pendingVaccinations.toString()}
          icon={<AlertCircle className="h-6 w-6 text-amber-600" />}
          bgColor="bg-amber-50"
          textColor="text-amber-600"
        />
        <DashboardCard
          title="Upcoming Drives"
          value={stats.upcomingDrives.toString()}
          icon={<Calendar className="h-6 w-6 text-purple-600" />}
          bgColor="bg-purple-50"
          textColor="text-purple-600"
        />
      </div>

      {/* Vaccination rate and chart */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Vaccinations</h2>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                vaccinationChange >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {vaccinationChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(vaccinationChange)}% from last month
              </span>
            </div>
          </div>
          <VaccinationChart data={stats.recentVaccinationData} />
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Vaccination Progress
          </h2>
          <VaccinationProgress 
            percentage={stats.vaccinationRate} 
            target={90} // Target percentage
          />
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-gray-700">
                  Target Completion Rate
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">90%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckSquare className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-700">
                  Current Completion Rate
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {stats.vaccinationRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming drives */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Vaccination Drives
        </h2>
        <UpcomingDrives drives={stats.upcomingDrivesList} />
      </div>
    </div>
  );
};

export default Dashboard;