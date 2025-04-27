import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  CheckSquare, 
  X, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Student {
  _id: string;
  name: string;
  studentId: string;
  grade: string;
  class: string;
  dateOfBirth: string;
  parentName: string;
  contactNumber: string;
  vaccinationStatus: 'vaccinated' | 'partially_vaccinated' | 'not_vaccinated';
  vaccines: {
    name: string;
    date: string;
    doses: number;
    completed: boolean;
  }[];
}

interface StudentFormData {
  name: string;
  studentId: string;
  grade: string;
  class: string;
  dateOfBirth: string;
  parentName: string;
  contactNumber: string;
  vaccinationStatus: 'vaccinated' | 'partially_vaccinated' | 'not_vaccinated';
}

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    studentId: '',
    grade: '',
    class: '',
    dateOfBirth: '',
    parentName: '',
    contactNumber: '',
    vaccinationStatus: 'not_vaccinated',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(8);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Make actual API call to your backend
      const response = await axios.get('/api/students');
      setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      // Fall back to mock data if API fails
      generateMockData();
      toast.error('Failed to fetch students from the server. Using sample data instead.');
    }
  };

  const generateMockData = () => {
    setTimeout(() => {
      const mockStudents: Student[] = Array.from({ length: 25 }).map((_, index) => ({
        _id: `st-${index + 1}`,
        name: `Student ${index + 1}`,
        studentId: `STU${1000 + index}`,
        grade: ['9th', '10th', '11th', '12th'][Math.floor(Math.random() * 4)],
        class: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        dateOfBirth: new Date(
          2000 + Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1
        ).toISOString().split('T')[0],
        parentName: `Parent ${index + 1}`,
        contactNumber: `+1-555-${1000 + index}`,
        vaccinationStatus: ['vaccinated', 'partially_vaccinated', 'not_vaccinated'][
          Math.floor(Math.random() * 3)
        ] as Student['vaccinationStatus'],
        vaccines: [
          {
            name: 'COVID-19',
            date: '2023-01-15',
            doses: 2,
            completed: Math.random() > 0.3
          },
          {
            name: 'Influenza',
            date: '2023-02-12',
            doses: 1,
            completed: Math.random() > 0.5
          }
        ]
      }));
      setStudents(mockStudents);
      setLoading(false);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.studentId || !formData.grade || !formData.class) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setFormSubmitting(true);
      console.log('Sending request to add student:', formData);
      
      // Make API call to create student
      const response = await axios.post('/api/students', formData);
      
      console.log('Student added successfully:', response.data);
      
      // Add new student to state
      setStudents([...students, response.data]);
      
      // Reset form and close it
      setFormData({
        name: '',
        studentId: '',
        grade: '',
        class: '',
        dateOfBirth: '',
        parentName: '',
        contactNumber: '',
        vaccinationStatus: 'not_vaccinated',
      });
      setShowAddForm(false);
      
      toast.success('Student added successfully');
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(error.response?.data?.message || 'Failed to add student');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle search and filtering
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && student.vaccinationStatus === filterStatus;
  });

  // Get current students for pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Status badge component
  const StatusBadge: React.FC<{ status: Student['vaccinationStatus'] }> = ({ status }) => {
    let badgeClass = '';
    let statusText = '';

    switch (status) {
      case 'vaccinated':
        badgeClass = 'bg-green-100 text-green-800';
        statusText = 'Vaccinated';
        break;
      case 'partially_vaccinated':
        badgeClass = 'bg-amber-100 text-amber-800';
        statusText = 'Partially Vaccinated';
        break;
      case 'not_vaccinated':
        badgeClass = 'bg-red-100 text-red-800';
        statusText = 'Not Vaccinated';
        break;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {statusText}
      </span>
    );
  };

  const AddStudentForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Add New Student</h2>
        <button 
          onClick={() => setShowAddForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleAddStudent}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Student Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            className="input"
            placeholder="Full name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
            Student ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="studentId"
            className="input"
            placeholder="e.g. STU1001"
            value={formData.studentId}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
            Grade <span className="text-red-500">*</span>
          </label>
          <select 
            id="grade" 
            className="input"
            value={formData.grade}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Grade</option>
            <option value="9th">9th</option>
            <option value="10th">10th</option>
            <option value="11th">11th</option>
            <option value="12th">12th</option>
          </select>
        </div>
        <div>
          <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
            Class <span className="text-red-500">*</span>
          </label>
          <select 
            id="class" 
            className="input"
            value={formData.class}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Class</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            id="dateOfBirth"
            className="input"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
            Parent/Guardian Name
          </label>
          <input
            type="text"
            id="parentName"
            className="input"
            placeholder="Parent/Guardian name"
            value={formData.parentName}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number
          </label>
          <input
            type="tel"
            id="contactNumber"
            className="input"
            placeholder="e.g. +1-555-1234"
            value={formData.contactNumber}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="vaccinationStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Vaccination Status
          </label>
          <select 
            id="vaccinationStatus" 
            className="input"
            value={formData.vaccinationStatus}
            onChange={handleInputChange}
          >
            <option value="not_vaccinated">Not Vaccinated</option>
            <option value="partially_vaccinated">Partially Vaccinated</option>
            <option value="vaccinated">Vaccinated</option>
          </select>
        </div>
        <div className="md:col-span-2 mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="btn btn-outline"
            disabled={formSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={formSubmitting}
          >
            {formSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>Add Student</>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-6 slide-in">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Students</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </button>
      </div>

      {showAddForm && <AddStudentForm />}

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or ID"
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-3">
          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="input pl-10"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="vaccinated">Vaccinated</option>
                <option value="partially_vaccinated">Partially Vaccinated</option>
                <option value="not_vaccinated">Not Vaccinated</option>
              </select>
            </div>
          </div>
          <button className="btn btn-outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="btn btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade/Class
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent/Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.dateOfBirth}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.grade}</div>
                      <div className="text-sm text-gray-500">Class {student.class}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.parentName}</div>
                      <div className="text-sm text-gray-500">{student.contactNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={student.vaccinationStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstStudent + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastStudent, filteredStudents.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredStudents.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => paginate(index + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === index + 1
                            ? 'bg-blue-50 text-blue-600 border-blue-500 z-10'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Students;