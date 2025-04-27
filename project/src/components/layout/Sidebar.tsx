import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Syringe, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileBarChart 
} from 'lucide-react';

interface SidebarProps {
  mobile?: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Vaccination Drives', href: '/vaccination-drives', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
];

const Sidebar: React.FC<SidebarProps> = ({ mobile = false }) => {
  return (
    <div className="h-full flex flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-500 p-1.5 rounded-md">
            <Syringe className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">VacciTrack</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;