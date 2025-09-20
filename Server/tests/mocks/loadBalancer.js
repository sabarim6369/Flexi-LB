// tests/mocks/loadBalancer.js
export const LoadBalancer = {
  create: async (data) => ({
    _id: "lb-123",
    name: data.name,
    owner: data.owner,
    slug: data.slug,
    algorithm: data.algorithm,
    instances: data.instances,
    endpoint: data.endpoint,
    rateLimiter: { limit: 100, window: 60 },
    rateLimiterOn: false,
    save: async function() { return this; },
    toObject: function() { return { ...this }; }
  }),

  find: async (filter) => {
    if (filter.owner) {
      return [
        {
          _id: "lb-1",
          name: "Test LB 1",
          owner: filter.owner,
          slug: "test-lb-1",
          algorithm: "round_robin",
          instances: [
            {
              id: "inst-1",
              url: "http://server1.com",
              weight: 1,
              instancename: "server1",
              isHealthy: true,
              metrics: { requests: 100, failures: 5, totalLatencyMs: 500, lastLatency: 50, todayRequests: 20 }
            }
          ],
          endpoint: "http://test.com/proxy/test-lb-1",
          rateLimiterOn: false
        }
      ];
    }
    return [];
  },

  findById: async (id) => {
    if (id === "valid-lb-id") {
      return {
        _id: "valid-lb-id",
        name: "Test Load Balancer",
        owner: "user-123",
        slug: "test-lb",
        algorithm: "round_robin",
        instances: [
          {
            id: "inst-1",
            url: "http://server1.com",
            weight: 1,
            instancename: "server1",
            isHealthy: true,
            metrics: { 
              requests: 100, 
              failures: 5, 
              totalLatencyMs: 500, 
              lastLatency: 50,
              todayRequests: 20,
              hourlyRequests: new Map()
            }
          }
        ],
        endpoint: "http://test.com/proxy/test-lb",
        rateLimiter: { limit: 100, window: 60 },
        rateLimiterOn: false,
        save: async function() { return this; }
      };
    }
    return null;
  },

  findOne: async (filter) => {
    if (filter.name === "existing-lb" && filter.owner) {
      return {
        _id: "existing-lb-id",
        name: "existing-lb",
        owner: filter.owner
      };
    }
    if (filter.slug === "test-slug") {
      return {
        _id: "lb-123",
        slug: "test-slug",
        instances: [
          {
            id: "inst-1",
            url: "http://server1.com",
            isHealthy: true,
            metrics: { requests: 0, failures: 0 }
          }
        ],
        rateLimiterOn: false
      };
    }
    return null;
  },

  findByIdAndDelete: async (id) => {
    if (id === "valid-lb-id") {
      return {
        _id: "valid-lb-id",
        name: "Deleted LB"
      };
    }
    return null;
  }
};