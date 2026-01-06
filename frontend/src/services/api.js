import axios from 'axios';

// The URL of your running API (proxied in Docker/Nginx)
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiKey = import.meta.env.VITE_API_KEY;

// Create a configured instance of axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {}),
  },
});

// Define the API calls
export const fraudService = {
  // Call the AI model to analyze a transaction
  analyzeTransaction: async (transactionData) => {
    try {
      const response = await api.post('/fraud/analyze', transactionData);
      return response.data;
    } catch (error) {
      console.error("Error analyzing transaction:", error);
      throw error;
    }
  },

  // Get recent alerts from the database
  getRecentAlerts: async () => {
    try {
      const response = await api.get('/fraud/alerts');
      return response.data;
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return [];
    }
  }
};

export const dashboardService = {
  // Get dashboard numbers (Fraud Rate, etc.)
  getMetrics: async () => {
    try {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    } catch (error) {
      console.error("Error fetching metrics:", error);
      return null;
    }
  }
};

export default api;
