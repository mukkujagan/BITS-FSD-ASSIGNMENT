import React from 'react';

interface VaccinationProgressProps {
  percentage: number;
  target: number;
}

const VaccinationProgress: React.FC<VaccinationProgressProps> = ({ 
  percentage, 
  target 
}) => {
  // Determine color based on progress
  const getColor = () => {
    if (percentage < 30) return 'text-red-500';
    if (percentage < 70) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <div className="relative pt-1">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
            Progress
          </span>
        </div>
        <div className={`text-right ${getColor()}`}>
          <span className="text-xl font-bold">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200">
        <div
          style={{ width: `${percentage}%` }}
          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-in-out 
            ${percentage < 30 ? 'bg-red-500' : percentage < 70 ? 'bg-amber-500' : 'bg-green-500'}`}
        ></div>
      </div>
      <div className="h-3 flex items-center">
        <div 
          className="w-px h-5 bg-gray-400"
          style={{ marginLeft: `${target}%` }}
        ></div>
      </div>
      <div 
        className="text-xs text-gray-500 font-medium"
        style={{ marginLeft: `${target - 3}%` }}
      >
        Target
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-full bg-green-500"></span>
            <span className="text-xs text-gray-500">Good (70-100%)</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-full bg-amber-500"></span>
            <span className="text-xs text-gray-500">Average (30-70%)</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 mr-1 rounded-full bg-red-500"></span>
            <span className="text-xs text-gray-500">Poor (0-30%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccinationProgress;