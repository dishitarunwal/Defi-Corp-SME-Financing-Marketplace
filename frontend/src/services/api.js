const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Get user data from localStorage
const getUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Set auth data in localStorage
const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Clear auth data from localStorage
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Attach backend details (validation errors etc.) to the thrown Error
      const err = new Error(data.message || 'API request failed');
      // `data.errors` is commonly used by express-validator; include it when present
      err.details = data.errors || data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  signup: async (userData) => {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success) {
      setAuthData(response.data.token, response.data.user);
    }
    
    return response;
  },

  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success) {
      setAuthData(response.data.token, response.data.user);
    }
    
    return response;
  },

  logout: () => {
    clearAuthData();
  },

  getMe: async () => {
    return await apiRequest('/auth/me');
  },

  isAuthenticated: () => {
    return !!getToken();
  },

  getUserType: () => {
    const user = getUser();
    return user?.user_type || null;
  }
};

// Loan API
export const loanAPI = {
  // SME endpoints
  applyForLoan: async (applicationData) => {
    return await apiRequest('/loan/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  getMyLoans: async () => {
    return await apiRequest('/loan/my-loans');
  },

  // Corporate endpoints
  getLoanApplications: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/loan/applications${queryParams ? `?${queryParams}` : ''}`;
    return await apiRequest(endpoint);
  },

  approveLoan: async (applicationId, approvalData = {}) => {
    return await apiRequest(`/loan/${applicationId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(approvalData),
    });
  },

  rejectLoan: async (applicationId, rejectionData) => {
    return await apiRequest(`/loan/${applicationId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify(rejectionData),
    });
  },

  // Common endpoints
  getLoanDetails: async (loanId) => {
    return await apiRequest(`/loan/details/${loanId}`);
  }
};

// Health check
export const healthCheck = async () => {
  return await apiRequest('/health');
};

// Export utilities
export { getToken, getUser, setAuthData, clearAuthData };