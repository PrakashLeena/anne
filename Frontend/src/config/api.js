// API Configuration
const API_CONFIG = {
  // Use environment variable or fallback to localhost for development
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // API endpoints
  ENDPOINTS: {
    CHAT_SESSIONS: '/api/chat-sessions',
    CHAT: '/api/chat',
    USERS: '/api/users',
    ORDERS: '/api/orders',
    SEND_CANCELLATION_EMAIL: '/api/send-cancellation-email'
  }
};

// Create full URL for API calls
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export individual endpoints
export const API_ENDPOINTS = API_CONFIG.ENDPOINTS;

export default API_CONFIG;
