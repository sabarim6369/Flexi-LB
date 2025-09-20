// tests/lbController.test.js
import { describe, it, expect, mock, beforeEach } from "bun:test";
import * as lbController from "../Controllers/lbController.js";
import { LoadBalancer } from "./mocks/loadBalancer.js";
import { createContext } from "./helpers/createContext.js";

// Mock external dependencies
mock.module("../Models/LoadBalancer.js", () => ({
  default: LoadBalancer
}));

mock.module("slugify", () => ({
  default: (text, options) => text.toLowerCase().replace(/\s+/g, '-')
}));

mock.module("axios", () => ({
  default: mock(() => ({
    data: { message: "Success" },
    status: 200,
    headers: { "content-type": "application/json" }
  }))
}));

mock.module("../Services/connectionPoolService.js", () => ({
  getAgentForUrl: mock(() => ({}))
}));

describe("Load Balancer Controller Tests", () => {

  beforeEach(() => {
    // Reset environment variables
    process.env.BASE_URL = "http://localhost:3003";
  });

  describe("createLB", () => {
    it("should create a new load balancer successfully", async () => {
      const c = createContext({
        body: {
          name: "Test LB",
          instances: [
            { url: "http://server1.com", weight: 1, name: "server1" }
          ],
          algorithm: "round_robin"
        },
        user: { id: "user-123" }
      });

      const res = await lbController.createLB(c);

      expect(res.status).toBe(200);
      expect(res.response.lb.name).toBe("Test LB");
      expect(res.response.lb.slug).toBe("test lb");
      expect(res.response.lb.algorithm).toBe("round_robin");
      expect(res.response.lb.instances).toHaveLength(1);
    });

    it("should return error for missing name", async () => {
      const c = createContext({
        body: {
          instances: [{ url: "http://server1.com" }]
        },
        user: { id: "user-123" }
      });

      const res = await lbController.createLB(c);

      expect(res.status).toBe(400);
      expect(res.response.error).toBe("Invalid body");
    });

    it("should return error for empty instances", async () => {
      const c = createContext({
        body: {
          name: "Test LB",
          instances: []
        },
        user: { id: "user-123" }
      });

      const res = await lbController.createLB(c);

      expect(res.status).toBe(400);
      expect(res.response.error).toBe("Invalid body");
    });

    it("should return error for duplicate name", async () => {
      const c = createContext({
        body: {
          name: "existing-lb",
          instances: [{ url: "http://server1.com" }]
        },
        user: { id: "user-123" }
      });

      const res = await lbController.createLB(c);

      expect(res.status).toBe(400);
      expect(res.response.error).toBe("Load Balancer name already exists");
    });
  });

  describe("listLBs", () => {
    it("should return list of load balancers with stats", async () => {
      const c = createContext({
        user: { id: "user-123" }
      });

      const res = await lbController.listLBs(c);

      expect(res.status).toBe(200);
      expect(res.response.lbs).toHaveLength(1);
      expect(res.response.stats.activeLBs).toBe(1);
      expect(res.response.stats.totalInstances).toBe(1);
    });
  });

  describe("getLB", () => {
    it("should return load balancer by ID", async () => {
      const c = createContext({});
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.getLB(c);

      expect(res.status).toBe(200);
      expect(res.response.lb._id).toBe("valid-lb-id");
    });

    it("should return 404 for non-existent LB", async () => {
      const c = createContext({});
      c.req.param = mock(() => "invalid-id");

      const res = await lbController.getLB(c);

      expect(res.status).toBe(404);
      expect(res.response.error).toBe("LB not found");
    });
  });

  describe("updateLB", () => {
    it("should update load balancer successfully", async () => {
      const c = createContext({
        body: {
          name: "Updated LB",
          algorithm: "least_conn"
        },
        user: { id: "user-123" }
      });
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.updateLB(c);

      expect(res.status).toBe(200);
      expect(res.response.lb._id).toBe("valid-lb-id");
    });

    it("should return 404 for non-existent LB", async () => {
      const c = createContext({
        body: { name: "Updated LB" },
        user: { id: "user-123" }
      });
      c.req.param = mock(() => "invalid-id");

      const res = await lbController.updateLB(c);

      expect(res.status).toBe(404);
      expect(res.response.error).toBe("LB not found");
    });
  });

  describe("deleteLB", () => {
    it("should delete load balancer successfully", async () => {
      const c = createContext({});
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.deleteLB(c);

      expect(res.status).toBe(200);
      expect(res.response.message).toBe("LB deleted");
    });

    it("should return 404 for non-existent LB", async () => {
      const c = createContext({});
      c.req.param = mock(() => "invalid-id");

      const res = await lbController.deleteLB(c);

      expect(res.status).toBe(404);
      expect(res.response.error).toBe("LB not found");
    });
  });

  describe("addInstance", () => {
    it("should add instance successfully", async () => {
      const c = createContext({
        body: {
          url: "http://server2.com",
          weight: 2,
          instancename: "server2"
        }
      });
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.addInstance(c);

      expect(res.status).toBe(200);
      expect(res.response.lb._id).toBe("valid-lb-id");
    });

    it("should return error for duplicate instance name", async () => {
      const c = createContext({
        body: {
          url: "http://server1.com",
          instancename: "server1"
        }
      });
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.addInstance(c);

      expect(res.status).toBe(400);
      expect(res.response.error).toContain("already exists");
    });

    it("should return 404 for non-existent LB", async () => {
      const c = createContext({
        body: {
          url: "http://server2.com",
          instancename: "server2"
        }
      });
      c.req.param = mock(() => "invalid-id");

      const res = await lbController.addInstance(c);

      expect(res.status).toBe(404);
      expect(res.response.error).toBe("LB not found");
    });
  });

  describe("updateInstance", () => {
    it("should update instance successfully", async () => {
      const c = createContext({
        body: {
          id: "inst-1",
          url: "http://updated-server.com",
          weight: 3
        }
      });
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.updateInstance(c);

      expect(res.status).toBe(200);
      expect(res.response.lb._id).toBe("valid-lb-id");
    });

    it("should return 404 for non-existent instance", async () => {
      const c = createContext({
        body: {
          id: "invalid-inst-id",
          url: "http://server.com"
        }
      });
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.updateInstance(c);

      expect(res.status).toBe(404);
      expect(res.response.error).toBe("Instance not found");
    });
  });

  describe("removeInstance", () => {
    it("should remove instance successfully", async () => {
      const c = createContext({
        body: { id: "inst-1" }
      });
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.removeInstance(c);

      expect(res.status).toBe(200);
      expect(res.response.lb._id).toBe("valid-lb-id");
    });

    it("should return 404 for non-existent LB", async () => {
      const c = createContext({
        body: { id: "inst-1" }
      });
      c.req.param = mock(() => "invalid-id");

      const res = await lbController.removeInstance(c);

      expect(res.status).toBe(404);
      expect(res.response.error).toBe("LB not found");
    });
  });

  describe("getMetrics", () => {
    it("should return metrics for load balancer", async () => {
      const c = createContext({});
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.getMetrics(c);

      expect(res.status).toBe(200);
      expect(res.response.metrics).toHaveLength(1);
      expect(res.response.metrics[0].id).toBe("inst-1");
    });

    it("should return 404 for non-existent LB", async () => {
      const c = createContext({});
      c.req.param = mock(() => "invalid-id");

      const res = await lbController.getMetrics(c);

      expect(res.status).toBe(404);
      expect(res.response.error).toBe("LB not found");
    });
  });

  describe("getLBMetrics", () => {
    it("should return detailed LB metrics", async () => {
      const c = createContext({});
      c.req.param = mock(() => "valid-lb-id");

      const res = await lbController.getLBMetrics(c);

      expect(res.status).toBe(200);
      expect(res.response.id).toBe("valid-lb-id");
      expect(res.response.metrics).toBeDefined();
      expect(res.response.instances).toHaveLength(1);
    });
  });

  describe("setRateLimit", () => {
    it("should set rate limit successfully", async () => {
      const c = createContext({
        body: { limit: 50, window: 30 },
        user: { id: "user-123" }
      });
      c.req.param = mock(() => ({ id: "valid-lb-id" }));

      const res = await lbController.setRateLimit(c);

      expect(res.status).toBe(200);
      expect(res.response.message).toBe("Rate limit set successfully");
      expect(res.response.rateLimiterOn).toBe(true);
    });

    it("should return error for invalid values", async () => {
      const c = createContext({
        body: { limit: 0, window: 30 },
        user: { id: "user-123" }
      });
      c.req.param = mock(() => ({ id: "valid-lb-id" }));

      const res = await lbController.setRateLimit(c);

      expect(res.status).toBe(400);
      expect(res.response.error).toBe("Invalid limit or window values");
    });
  });

  describe("getRateLimit", () => {
    it("should get rate limit settings", async () => {
      const c = createContext({
        user: { id: "user-123" }
      });
      c.req.param = mock(() => ({ id: "valid-lb-id" }));

      const res = await lbController.getRateLimit(c);

      expect(res.status).toBe(200);
      expect(res.response.rateLimit).toBeDefined();
      expect(res.response.rateLimiterOn).toBeDefined();
    });
  });

  describe("proxyRequest", () => {
    it("should proxy request to healthy instance", async () => {
      const c = createContext({});
      c.req.param = mock((param) => {
        if (param === "slug") return "test-slug";
        if (param === "*") return "api/test";
        return null;
      });
      c.req.method = "GET";
      c.req.header = mock(() => "127.0.0.1");
      c.newResponse = mock((data, status, headers) => ({ data, status, headers }));

      const res = await lbController.proxyRequest(c);

      expect(res.status).toBe(200);
    });

    it("should return 404 for non-existent slug", async () => {
      const c = createContext({});
      c.req.param = mock((param) => {
        if (param === "slug") return "non-existent-slug";
        return null;
      });

      const res = await lbController.proxyRequest(c);

      expect(res.status).toBe(404);
      expect(res.response.error).toBe("No backend available");
    });
  });

  describe("getoverallMetrics", () => {
    it("should return overall metrics for user", async () => {
      const c = createContext({
        user: { id: "user-123" }
      });

      const res = await lbController.getoverallMetrics(c);

      expect(res.status).toBe(200);
      expect(res.response.overview).toBeDefined();
      expect(res.response.loadBalancers).toBeDefined();
    });

    it("should return 401 for unauthorized user", async () => {
      const c = createContext({
        user: null
      });

      const res = await lbController.getoverallMetrics(c);

      expect(res.status).toBe(401);
      expect(res.response.error).toBe("Unauthorized");
    });
  });

  describe("disableRateLimit", () => {
    it("should disable rate limiter successfully", async () => {
      const c = createContext({
        user: { id: "user-123" }
      });
      c.req.param = mock(() => ({ id: "valid-lb-id" }));

      const res = await lbController.disableRateLimit(c);

      expect(res.status).toBe(200);
      expect(res.response.message).toBe("Rate limiter disabled successfully");
    });
  });

  describe("updateRateLimit", () => {
    it("should update rate limit settings", async () => {
      const c = createContext({
        body: { limit: 75, window: 45, rateLimiterOn: true },
        user: { id: "user-123" }
      });
      c.req.param = mock(() => ({ id: "valid-lb-id" }));

      const res = await lbController.updateRateLimit(c);

      expect(res.status).toBe(200);
      expect(res.response.message).toBe("Rate limit updated successfully");
    });
  });

});