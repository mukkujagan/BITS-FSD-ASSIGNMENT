import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Coordinator {
  _id: string;
  name: string;
  email: string;
  school: string;
}

interface AuthContextType {
  currentUser: Coordinator | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, school: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Coordinator | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set the base URL for all Axios requests - CHANGE THIS URL TO MATCH YOUR BACKEND
    axios.defaults.baseURL = 'http://localhost:5000'; // Replace with your actual backend URL
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await axios.get('/api/auth/verify');
      setCurrentUser(res.data.coordinator);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Making login request to:', axios.defaults.baseURL + '/api/auth/login');
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, coordinator } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(coordinator);
      setIsAuthenticated(true);
      toast.success('Logged in successfully');
    } catch (error: any) {
      console.error('Login error details:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, school: string) => {
    try {
      setLoading(true);
      console.log('Making signup request to:', axios.defaults.baseURL + '/api/auth/signup');
      console.log('Sending signup data:', { name, email, password: '***', school });
      
      const res = await axios.post('/api/auth/signup', { name, email, password, school });
      console.log('Signup response:', res.data);
      
      const { token, coordinator } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(coordinator);
      setIsAuthenticated(true);
      toast.success('Account created successfully');
    } catch (error: any) {
      console.error('Signup error details:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      const message = error.response?.data?.message || 'Signup failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};