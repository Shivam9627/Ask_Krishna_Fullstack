import axios from 'axios';

// Create an axios instance with default config
// Use relative paths when proxy is configured in package.json
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    console.log('📦 User from localStorage:', user ? 'exists' : 'missing');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const token = userData.token;
        console.log('🔑 Token type:', typeof token, 'Token length:', token ? token.length : 0);
        if (token && typeof token === 'string') {
          console.log('✅ Sending JWT token:', token.substring(0, 50) + '...');
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('⚠️ Token is not a string:', token);
        }
        // Always include X-User-Id as fallback for backend
        if (userData && userData.user_id) {
          console.log('📌 Also sending X-User-Id:', userData.user_id);
          config.headers['X-User-Id'] = userData.user_id;
        }
      } catch (e) {
        console.log('❌ Error parsing user from localStorage:', e.message);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Chat related API calls
const chatService = {
  // Send a message to the chatbot
  sendMessage: async (message, language = 'english') => {
    try {
      // This will connect to the MERN backend
      const response = await api.post('/api/chat', { prompt: message, language });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  // Get chat history for a user
  getChatHistory: async () => {
    try {
      const response = await api.get('/api/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },
  
  // Delete a specific chat from history
  deleteChat: async (chatId) => {
    try {
      const response = await api.delete(`/api/history/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  },

  // Delete all chats for current user
  deleteAllChats: async () => {
    try {
      const response = await api.delete('/api/history');
      return response.data;
    } catch (error) {
      console.error('Error deleting all chats:', error);
      throw error;
    }
  },

  // Get a single chat by ID
  getChatById: async (chatId) => {
    try {
      const response = await api.get(`/api/history/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat by ID:', error);
      throw error;
    }
  },
};

// Auth related API calls
const authService = {
  // Register a new user
  register: async (username, email, password) => {
    try {
      const response = await api.post('/api/auth/register', { username, email, password });
      if (response.data && response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },
  
  // Login a user
  login: async (email, password) => {
    try {
      console.log("🔍 Attempting login with:", { email, password });
      const response = await api.post('/api/auth/login', { email, password });
      console.log("✅ Login response:", response.data);
      if (response.data && response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      console.error('❌ Error logging in:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },
  
  // Logout a user
  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Send OTP for registration
  sendRegistrationOTP: async (email) => {
    try {
      const response = await api.post('/api/auth/send-registration-otp', { email });
      return response.data;
    } catch (error) {
      console.error('Error sending registration OTP:', error);
      throw error;
    }
  },

  // Verify OTP for registration
  verifyRegistrationOTP: async (email, otp) => {
    try {
      const response = await api.post('/api/auth/verify-registration-otp', { email, otp });
      return response.data;
    } catch (error) {
      console.error('Error verifying registration OTP:', error);
      throw error;
    }
  },

  // Send OTP for account deletion
  sendDeleteOTP: async () => {
    try {
      const response = await api.post('/api/auth/send-delete-otp');
      return response.data;
    } catch (error) {
      console.error('Error sending delete OTP:', error);
      throw error;
    }
  },

  // Delete account with OTP
  deleteAccount: async (otp) => {
    try {
      const response = await api.delete('/api/auth/account', { data: { otp } });
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};

export { chatService, authService };