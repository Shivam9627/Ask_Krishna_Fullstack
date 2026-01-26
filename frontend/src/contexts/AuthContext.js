import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import { clearInvalidTokens } from '../utils/tokenCleanup';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  
  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    // First, validate and cleanup invalid tokens
    clearInvalidTokens();
    
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        // Validate token format - JWT should have 3 parts separated by dots
        const token = parsedUser.token;
        if (token && typeof token === 'string' && token.split('.').length === 3) {
          console.log('✅ Valid JWT token found in localStorage');
          setCurrentUser(parsedUser);
        } else {
          console.log('❌ Invalid token format detected, clearing localStorage');
          console.log('Token parts:', token ? token.split('.').length : 'no token');
          localStorage.removeItem('user');
          setCurrentUser(null);
        }
      } catch (e) {
        console.log('❌ Error parsing user from localStorage:', e.message);
        localStorage.removeItem('user');
        setCurrentUser(null);
      }
    }
    
    // Get question count from localStorage
    const count = localStorage.getItem('questionCount');
    if (count) {
      setQuestionCount(parseInt(count));
    }
    
    setLoading(false);
  }, []);

  // On mount, if token exists, refresh profile from backend to ensure latest data
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) return;
        const storedUser = JSON.parse(stored);
        if (!storedUser?.token) return;
        // Fetch profile
        const profile = await authService.getProfile();
        const merged = {
          ...storedUser,
          username: profile.username,
          email: profile.email,
          created_at: profile.created_at,
          profileImage: profile.profileImage,
        };
        localStorage.setItem('user', JSON.stringify(merged));
        setCurrentUser(merged);
      } catch (e) {
        // ignore fetch errors
      }
    };
    refreshProfile();
  }, []);
  
  // Listen for profile updates
  useEffect(() => {
    const handleUserUpdate = (event) => {
      setCurrentUser(event.detail);
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);
  
  // Function to update current user
  const updateCurrentUser = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  // Function to register a new user
  const register = async (username, email, password) => {
    try {
      setError('');
      const user = await authService.register(username, email, password);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
      throw err;
    }
  };
  
  // Function to log in a user
  const login = async (email, password) => {
    try {
      setError('');
      const user = await authService.login(email, password);
      setCurrentUser(user);
      setQuestionCount(0); // Reset question count on login
      localStorage.setItem('questionCount', '0');
      return user;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log in');
      throw err;
    }
  };
  
  // Function to log out a user
  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setQuestionCount(0);
    localStorage.setItem('questionCount', '0');
    // Also clear chat messages from localStorage
    localStorage.removeItem('chatMessages');
  };
  
  // Function to increment question count
  const incrementQuestionCount = () => {
    if (!currentUser) {
      const newCount = questionCount + 1;
      setQuestionCount(newCount);
      localStorage.setItem('questionCount', newCount.toString());
      return newCount;
    }
    return null; // No limit for logged in users
  };
  
  // Function to reset question count
  const resetQuestionCount = () => {
    setQuestionCount(0);
    localStorage.setItem('questionCount', '0');
  };
  
  // Export a function to clear chat history for use in Chat.js
  const clearChatHistory = () => {
    localStorage.removeItem('chatMessages');
    setQuestionCount(0);
    localStorage.setItem('questionCount', '0');
  };
  
  const value = {
    currentUser,
    loading,
    error,
    questionCount,
    register,
    login,
    logout,
    incrementQuestionCount,
    resetQuestionCount,
    clearChatHistory,
    updateCurrentUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}