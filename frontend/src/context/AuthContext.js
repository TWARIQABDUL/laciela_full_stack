import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Setup Axios defaults
  axios.defaults.withCredentials = true;

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/auth/verify`);
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/auth/login`, { username, password });
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};
