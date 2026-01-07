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
  getRecentAlerts: async (limit) => {
    try {
      const response = await api.get('/fraud/alerts', { params: limit ? { limit } : {} });
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
  },
  getMetricsWithLatency: async () => {
    const startTime = performance.now();
    try {
      const response = await api.get('/dashboard/metrics');
      const latencyMs = Math.round(performance.now() - startTime);
      return { data: response.data, latencyMs };
    } catch (error) {
      console.error("Error fetching metrics:", error);
      return { data: null, latencyMs: null };
    }
  },
  getFraudTrends: async () => {
    try {
      const response = await api.get('/dashboard/fraud-trends');
      return response.data;
    } catch (error) {
      console.error("Error fetching fraud trends:", error);
      return [];
    }
  },
  getFraudTypeDistribution: async () => {
    try {
      const response = await api.get('/dashboard/fraud-type-distribution');
      return response.data;
    } catch (error) {
      console.error("Error fetching fraud distribution:", error);
      return [];
    }
  },
  getDetectionPosture: async () => {
    try {
      const response = await api.get('/dashboard/detection-posture');
      return response.data;
    } catch (error) {
      console.error("Error fetching detection posture:", error);
      return [];
    }
  }
};

export const accountsService = {
  getMonitoredAccounts: async () => {
    try {
      const response = await api.get('/accounts/monitored');
      return response.data;
    } catch (error) {
      console.error("Error fetching monitored accounts:", error);
      return [];
    }
  }
};

export const graphService = {
  getGraphData: async () => {
    try {
      const response = await api.get('/graph/data');
      return response.data;
    } catch (error) {
      console.error("Error fetching graph data:", error);
      return { nodes: [], edges: [] };
    }
  }
};

export const complianceService = {
  getFrameworks: async () => {
    try {
      const response = await api.get('/compliance/frameworks');
      return response.data;
    } catch (error) {
      console.error("Error fetching compliance frameworks:", error);
      return [];
    }
  },
  getActivities: async () => {
    try {
      const response = await api.get('/compliance/activities');
      return response.data;
    } catch (error) {
      console.error("Error fetching compliance activities:", error);
      return [];
    }
  }
};

export const riskService = {
  getRiskProfiles: async () => {
    try {
      const response = await api.get('/risk/profiles');
      return response.data;
    } catch (error) {
      console.error("Error fetching risk profiles:", error);
      return [];
    }
  },
  getHighRiskProfiles: async (threshold) => {
    try {
      const response = await api.get('/risk/profiles/high', { params: threshold ? { threshold } : {} });
      return response.data;
    } catch (error) {
      console.error("Error fetching high-risk profiles:", error);
      return [];
    }
  },
  getRiskDistribution: async () => {
    try {
      const response = await api.get('/risk/distribution');
      return response.data;
    } catch (error) {
      console.error("Error fetching risk distribution:", error);
      return { critical: 0, high: 0, medium: 0, low: 0 };
    }
  }
};

export default api;
