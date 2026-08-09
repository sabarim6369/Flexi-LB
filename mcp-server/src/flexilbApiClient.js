import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class FlexiLBApiClient {
  constructor() {
    this.baseURL = process.env.FLEXILB_API_URL || 'http://localhost:3000';
    this.apiToken = process.env.FLEXILB_API_TOKEN || '';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` })
      }
    });
  }

  // Load Balancer Operations
  async listLoadBalancers() {
    try {
      const response = await this.client.get('/api/lb');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list load balancers: ${error.message}`);
    }
  }

  async getLoadBalancer(lbId) {
    try {
      const response = await this.client.get(`/api/lb/${lbId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get load balancer: ${error.message}`);
    }
  }

  async createLoadBalancer(lbData) {
    try {
      const response = await this.client.post('/api/lb', lbData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create load balancer: ${error.message}`);
    }
  }

  async updateLoadBalancer(lbId, lbData) {
    try {
      const response = await this.client.put(`/api/lb/${lbId}`, lbData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update load balancer: ${error.message}`);
    }
  }

  async deleteLoadBalancer(lbId) {
    try {
      const response = await this.client.delete(`/api/lb/${lbId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete load balancer: ${error.message}`);
    }
  }

  // Instance Operations
  async addInstance(lbId, instanceData) {
    try {
      const response = await this.client.post(`/api/lb/${lbId}/instances`, instanceData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add instance: ${error.message}`);
    }
  }

  async updateInstance(lbId, instanceData) {
    try {
      const response = await this.client.put(`/api/lb/${lbId}/instances`, instanceData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update instance: ${error.message}`);
    }
  }

  async removeInstance(lbId, instanceData) {
    try {
      const response = await this.client.delete(`/api/lb/${lbId}/instances`, { data: instanceData });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to remove instance: ${error.message}`);
    }
  }

  // Metrics Operations
  async getOverallMetrics() {
    try {
      const response = await this.client.get('/api/lb/data/overallmetrics');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get overall metrics: ${error.message}`);
    }
  }

  async getLoadBalancerMetrics(lbId) {
    try {
      const response = await this.client.get(`/api/lb/${lbId}/metrics`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get load balancer metrics: ${error.message}`);
    }
  }

  async getHourlyRequests(lbId) {
    try {
      const response = await this.client.get(`/api/lb/${lbId}/hourlyreq`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hourly requests: ${error.message}`);
    }
  }

  // Rate Limiter Operations
  async setRateLimit(lbId, rateLimitData) {
    try {
      const response = await this.client.post(`/api/lb/${lbId}/ratelimit`, rateLimitData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to set rate limit: ${error.message}`);
    }
  }

  async getRateLimit(lbId) {
    try {
      const response = await this.client.get(`/api/lb/${lbId}/ratelimit`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get rate limit: ${error.message}`);
    }
  }

  async updateRateLimit(lbId, rateLimitData) {
    try {
      const response = await this.client.put(`/api/lb/${lbId}/ratelimit`, rateLimitData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update rate limit: ${error.message}`);
    }
  }

  async disableRateLimit(lbId) {
    try {
      const response = await this.client.delete(`/api/lb/${lbId}/ratelimit`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to disable rate limit: ${error.message}`);
    }
  }

  async getRateLimiterStatus() {
    try {
      const response = await this.client.get('/api/lb/ratelimiter/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get rate limiter status: ${error.message}`);
    }
  }

  // Alert Operations
  async getAlerts(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await this.client.get(`/api/alerts?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get alerts: ${error.message}`);
    }
  }

  async getAlert(alertId) {
    try {
      const response = await this.client.get(`/api/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get alert: ${error.message}`);
    }
  }

  async createAlert(alertData) {
    try {
      const response = await this.client.post('/api/alerts', alertData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  async acknowledgeAlert(alertId) {
    try {
      const response = await this.client.patch(`/api/alerts/${alertId}/acknowledge`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  }

  async resolveAlert(alertId) {
    try {
      const response = await this.client.patch(`/api/alerts/${alertId}/resolve`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }
  }

  async deleteAlert(alertId) {
    try {
      const response = await this.client.delete(`/api/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete alert: ${error.message}`);
    }
  }

  // Health Check Operations
  async checkInstanceHealth(lbId, instanceName) {
    try {
      const lb = await this.getLoadBalancer(lbId);
      const instance = lb.instances?.find(i => i.name === instanceName);
      
      if (!instance) {
        throw new Error(`Instance ${instanceName} not found`);
      }

      return {
        instanceName: instance.name,
        isHealthy: instance.isHealthy,
        url: instance.url,
        metrics: instance.metrics || {},
        lastChecked: instance.lastHealthCheck || new Date()
      };
    } catch (error) {
      throw new Error(`Failed to check instance health: ${error.message}`);
    }
  }

  async checkAllInstancesHealth(lbId) {
    try {
      const lb = await this.getLoadBalancer(lbId);
      const instances = lb.instances || [];

      return instances.map(instance => ({
        instanceName: instance.name,
        isHealthy: instance.isHealthy,
        url: instance.url,
        metrics: instance.metrics || {},
        lastChecked: instance.lastHealthCheck || new Date()
      }));
    } catch (error) {
      throw new Error(`Failed to check all instances health: ${error.message}`);
    }
  }
}

export default new FlexiLBApiClient();