import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  MapPin, 
  Syringe, 
  Users, 
  Info,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader
} from 'lucide-react';

// API base URL - this should match your backend URL
const API_BASE_URL = 'http://localhost:5000';

// Function to get the authentication token
const getAuthToken = (): string | null => {
  // Try to get token from localStorage
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

interface VaccinationDrive {
  _id: string;
  name: string;
  date: string;
  location: string;
  vaccineType: string;
  description: string;
  targetCount: number;
  vaccinatedCount: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

interface NewDriveFormData {
  name: string;
  vaccineType: string;
  date: string;
  time: string;
  location: string;
  targetCount: number;
  description: string;
}

const VaccinationDrives: React.FC = () => {
  const [drives, setDrives] = useState<VaccinationDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<NewDriveFormData>({
    name: '',
    vaccineType: '',
    date: '',
    time: '',
    location: '',
    targetCount: 0,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  
  // Add new state variables for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [driveToDelete, setDriveToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{id: string, action: string} | null>(null);

  // Create headers with auth token for API requests
  const createAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Most common format for JWT auth
    };
  };

  // Fetch vaccination drives from the backend
  const fetchDrives = async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);
    
    try {
      // Add authorization header to the request
      const headers = createAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/vaccination-drives`, {
        method: 'GET',
        headers
      });
      
      if (response.status === 401 || response.status === 403) {
        setAuthError(true);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setDrives(data);
    } catch (err) {
      console.error('Error fetching vaccination drives:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vaccination drives';
      setError(errorMessage);
      
      // Only fall back to mock data if there's no authentication error
      if (!authError && drives.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('Using mock data as fallback in development mode');
        const mockDrives: VaccinationDrive[] = [
          {
            _id: '1',
            name: 'Annual Flu Vaccination',
            date: '2025-02-15T09:00:00.000Z',
            location: 'School Gymnasium',
            vaccineType: 'Influenza',
            description: 'Annual flu vaccination drive for all students to prevent seasonal influenza.',
            targetCount: 300,
            vaccinatedCount: 0,
            status: 'scheduled'
          },
          {
            _id: '2',
            name: 'COVID-19 Booster',
            date: '2025-02-20T10:00:00.000Z',
            location: 'Auditorium',
            vaccineType: 'COVID-19 Booster',
            description: 'Booster shots for COVID-19 for eligible students.',
            targetCount: 250,
            vaccinatedCount: 0,
            status: 'scheduled'
          }
        ];
        setDrives(mockDrives);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      vaccineType: '',
      date: '',
      time: '',
      location: '',
      targetCount: 0,
      description: ''
    });
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsEditMode(false);
    setEditingDriveId(null);
  };

  // Handle form input changes - Fixed to prevent focus loss
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [id]: id === 'targetCount' ? parseInt(value) || 0 : value
    }));
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    if (!formData.name || !formData.vaccineType || !formData.date || 
        !formData.time || !formData.location || !formData.targetCount) {
      setSubmitError('Please fill in all required fields.');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors/success messages
    setSubmitError(null);
    setSubmitSuccess(null);
    
    // Validate form
    if (!validateForm()) return;
    
    setSubmitting(true);

    try {
      // Combine date and time for the API
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Create drive object
      const driveData = {
        name: formData.name,
        date: dateTime.toISOString(),
        location: formData.location,
        vaccineType: formData.vaccineType,
        description: formData.description,
        targetCount: formData.targetCount,
        vaccinatedCount: isEditMode ? undefined : 0,
        status: isEditMode ? undefined : 'scheduled' as const
      };

      console.log(`${isEditMode ? 'Updating' : 'Sending'} drive data to API:`, driveData);
      
      // Get headers with authentication token
      const headers = createAuthHeaders();
      
      // Make the API call to save or update the drive
      const url = isEditMode 
        ? `${API_BASE_URL}/api/vaccination-drives/${editingDriveId}`
        : `${API_BASE_URL}/api/vaccination-drives`;
        
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(driveData),
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        setAuthError(true);
        throw new Error('Authentication failed. Please log in again.');
      }

      // Handle other non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Status:', response.status);
        console.error('API Error Response:', errorText);
        
        // Check if response is JSON
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || `Server error: ${response.status}`;
        } catch {
          errorMessage = `Server error: ${response.status}. Please try again.`;
        }
        
        throw new Error(errorMessage);
      }

      const savedDrive = await response.json();
      console.log(`Drive ${isEditMode ? 'updated' : 'saved'} successfully:`, savedDrive);

      if (isEditMode) {
        // Update the drive in local state
        setDrives(prevDrives => 
          prevDrives.map(drive => 
            drive._id === editingDriveId 
              ? { 
                  ...drive,
                  name: formData.name,
                  date: dateTime.toISOString(),
                  location: formData.location,
                  vaccineType: formData.vaccineType,
                  description: formData.description,
                  targetCount: formData.targetCount
                } 
              : drive
          )
        );
        setSubmitSuccess('Vaccination drive updated successfully!');
      } else {
        // Add new drive to state
        const driveWithId: VaccinationDrive = {
          ...driveData as any,
          _id: savedDrive._id || `temp-${Date.now()}`, // Use server ID or temporary ID if needed
          vaccinatedCount: 0,
          status: 'scheduled'
        };
        
        setDrives(prevDrives => [...prevDrives, driveWithId]);
        setSubmitSuccess('Vaccination drive scheduled successfully!');
      }
      
      // Reset form
      resetForm();
      
      // Optionally close form after short delay to show success message
      setTimeout(() => {
        setShowAddForm(false);
        setSubmitSuccess(null);
      }, 2000);
      
      // Refresh list from server to ensure we have the latest data
      fetchDrives();
      
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'scheduling'} drive:`, error);
      setSubmitError(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'schedule'} vaccination drive. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit drive
  const handleEditDrive = (drive: VaccinationDrive) => {
    // Extract date and time from the drive's date string
    const driveDate = new Date(drive.date);
    const formattedDate = driveDate.toISOString().split('T')[0];
    const hours = driveDate.getHours().toString().padStart(2, '0');
    const minutes = driveDate.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    // Populate form with drive data
    setFormData({
      name: drive.name,
      vaccineType: drive.vaccineType,
      date: formattedDate,
      time: formattedTime,
      location: drive.location,
      targetCount: drive.targetCount,
      description: drive.description || ''
    });
    
    // Set edit mode and store drive ID
    setIsEditMode(true);
    setEditingDriveId(drive._id);
    setShowAddForm(true);
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete drive - Fixed by using proper API endpoint and updating state
  const handleDeleteDrive = async (driveId: string) => {
    setActionLoading({ id: driveId, action: 'delete' });
    
    try {
      const headers = createAuthHeaders();
      
      // Make the DELETE request to the API
      const response = await fetch(`${API_BASE_URL}/api/vaccination-drives/${driveId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.status === 401 || response.status === 403) {
        setAuthError(true);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      console.log('Drive deleted successfully');
      
      // Update local state by removing the deleted drive
      setDrives(prevDrives => prevDrives.filter(drive => drive._id !== driveId));
      
      // Close the delete confirmation modal
      setDriveToDelete(null);
      setShowDeleteConfirm(false);
      
    } catch (error) {
      console.error('Error deleting drive:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete vaccination drive.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle mark as complete - Fixed by implementing proper state update
  const handleMarkComplete = async (driveId: string) => {
    setActionLoading({ id: driveId, action: 'complete' });
    
    try {
      const headers = createAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/vaccination-drives/${driveId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.status === 401 || response.status === 403) {
        setAuthError(true);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const updatedDrive = await response.json();
      console.log('Drive marked as complete:', updatedDrive);
      
      // Update the drive status in local state
      setDrives(prevDrives => 
        prevDrives.map(drive => 
          drive._id === driveId ? { ...drive, status: 'completed' } : drive
        )
      );
      
    } catch (error) {
      console.error('Error marking drive as complete:', error);
      setError(error instanceof Error ? error.message : 'Failed to update vaccination drive status.');
    } finally {
      setActionLoading(null);
    }
  };

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

  // Status badge component
  const StatusBadge: React.FC<{ status: VaccinationDrive['status'] }> = ({ status }) => {
    let badgeClass = '';
    let statusText = '';

    switch (status) {
      case 'scheduled':
        badgeClass = 'bg-blue-100 text-blue-800';
        statusText = 'Scheduled';
        break;
      case 'in_progress':
        badgeClass = 'bg-amber-100 text-amber-800';
        statusText = 'In Progress';
        break;
      case 'completed':
        badgeClass = 'bg-green-100 text-green-800';
        statusText = 'Completed';
        break;
      case 'cancelled':
        badgeClass = 'bg-red-100 text-red-800';
        statusText = 'Cancelled';
        break;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {statusText}
      </span>
    );
  };

  // Authentication error component
  const AuthErrorMessage = () => (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">
            <strong>Authentication error:</strong> You need to be logged in to access this feature.
          </p>
          <div className="mt-2">
            <a 
              href="/login" 
              className="text-sm font-medium text-red-700 hover:text-red-600"
            >
              Go to login page
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  // Delete confirmation modal
  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this vaccination drive? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              setDriveToDelete(null);
            }}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={actionLoading !== null}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (driveToDelete) {
                handleDeleteDrive(driveToDelete);
              }
            }}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            disabled={actionLoading !== null}
          >
            {actionLoading?.action === 'delete' ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const AddDriveForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditMode ? 'Edit Vaccination Drive' : 'Schedule New Vaccination Drive'}
        </h2>
        <button 
          onClick={() => {
            setShowAddForm(false);
            resetForm();
          }}
          className="text-gray-500 hover:text-gray-700"
          type="button"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700">
          <div className="flex">
            <Check className="h-5 w-5 mr-2" />
            <p>{submitSuccess}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Drive Name*
          </label>
          <input
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Vaccination drive name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="vaccineType" className="block text-sm font-medium text-gray-700 mb-1">
            Vaccine Type*
          </label>
          <input
            type="text"
            id="vaccineType"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Influenza, COVID-19, MMR"
            value={formData.vaccineType}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date*
          </label>
          <input
            type="date"
            id="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            Time*
          </label>
          <input
            type="time"
            id="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.time}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location*
          </label>
          <input
            type="text"
            id="location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. School Gymnasium"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="targetCount" className="block text-sm font-medium text-gray-700 mb-1">
            Target Student Count*
          </label>
          <input
            type="number"
            id="targetCount"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. 100"
            min="1"
            value={formData.targetCount || ''}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Details about the vaccination drive"
            value={formData.description}
            onChange={handleInputChange}
          ></textarea>
        </div>

        <div className="md:col-span-2 mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              resetForm();
            }}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                {isEditMode ? 'Updating...' : 'Scheduling...'}
              </span>
            ) : (
              isEditMode ? 'Update Drive' : 'Schedule Drive'
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const DriveCard: React.FC<{ drive: VaccinationDrive }> = ({ drive }) => {
    const completionPercentage = drive.status === 'completed' 
      ? 100 
      : Math.round((drive.vaccinatedCount / drive.targetCount) * 100) || 0;
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold text-gray-900">{drive.name}</h2>
            <StatusBadge status={drive.status} />
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              <span>{formatDate(drive.date)} at {formatTime(drive.date)}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2 text-blue-500" />
              <span>{drive.location}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Syringe className="h-5 w-5 mr-2 text-blue-500" />
              <span>{drive.vaccineType}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              <span>Target: {drive.targetCount} students</span>
            </div>
          </div>
          
          {drive.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                <p>{drive.description}</p>
              </div>
            </div>
          )}
          
          {drive.status !== 'scheduled' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>Vaccination Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    drive.status === 'completed' 
                      ? 'bg-green-500' 
                      : completionPercentage > 70 
                        ? 'bg-green-500' 
                        : completionPercentage > 30 
                          ? 'bg-amber-500' 
                          : 'bg-blue-500'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {drive.vaccinatedCount} of {drive.targetCount} students vaccinated
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <button className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              View Details
            </button>
            <div className="flex space-x-2">
              {drive.status === 'scheduled' && (
                <>
                  <button 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" 
                    aria-label="Edit"
                    onClick={() => handleEditDrive(drive)}
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full" 
                    aria-label="Delete"
                    onClick={() => {
                      setDriveToDelete(drive._id);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              {drive.status === 'scheduled' && (

                  <button 
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                    aria-label="Mark complete"
                    onClick={() => handleMarkComplete(drive._id)}
                    disabled={actionLoading?.id === drive._id}
                  >
                    {actionLoading?.id === drive._id && actionLoading?.action === 'complete' ? (
                      <Loader className="animate-spin h-5 w-5" />
                    ) : (
                      <Check className="h-5 w-5" />
                    )}
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vaccination Drives</h1>
        <p className="text-gray-600 mt-1">Manage school vaccination schedules and track progress</p>
      </div>

      {/* Authentication Error Banner */}
      {authError && <AuthErrorMessage />}

      {/* Error Alert */}
      {error && !authError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Add New Drive Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Schedule New Vaccination Drive
        </button>
      )}

      {/* Add/Edit Drive Form */}
      {showAddForm && <AddDriveForm />}

      {/* Drive List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading vaccination drives...</span>
        </div>
      ) : drives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map((drive) => (
            <DriveCard key={drive._id} drive={drive} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No vaccination drives</h3>
          <p className="mt-2 text-gray-600">Get started by scheduling your first vaccination drive.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Schedule Drive
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && <DeleteConfirmationModal />}
    </div>
  );
};

export default VaccinationDrives;
                  