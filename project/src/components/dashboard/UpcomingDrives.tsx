import React from 'react';
import { Calendar, MapPin, Users, Syringe } from 'lucide-react';

interface Drive {
  _id: string;
  name: string;
  date: string;
  location: string;
  vaccineType: string;
  targetCount: number;
}

interface UpcomingDrivesProps {
  drives: Drive[];
}

const UpcomingDrives: React.FC<UpcomingDrivesProps> = ({ drives }) => {
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (drives.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No upcoming vaccination drives scheduled.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {drives.map((drive) => (
        <li key={drive._id} className="py-4 hover:bg-gray-50 transition-colors duration-150 rounded-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <h3 className="text-lg font-medium text-gray-900">{drive.name}</h3>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{formatDate(drive.date)} at {formatTime(drive.date)}</span>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{drive.location}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center mt-2 md:mt-0 space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <Syringe className="flex-shrink-0 mr-1.5 h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-700">{drive.vaccineType}</span>
              </div>
              <div className="flex items-center">
                <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-700">Target: {drive.targetCount} students</span>
              </div>
              <button className="btn btn-outline text-sm">View Details</button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default UpcomingDrives;