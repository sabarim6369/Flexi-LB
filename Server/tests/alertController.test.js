// tests/alertController.test.js
import { describe, it, expect, mock, beforeEach } from "bun:test";
import * as alertController from "../Controllers/alertController.js";
import { Alert, AlertConstructor } from "./mocks/alert.js";
import { LoadBalancer } from "./mocks/loadBalancer.js";
import { createContext } from "./helpers/createContext.js";

// Mock external dependencies
mock.module("../Models/Alert.js", () => ({
  default: Alert
}));

mock.module("../Models/LoadBalancer.js", () => ({
  default: LoadBalancer
}));

// Mock Alert constructor for new Alert()
global.Alert = function(data) {
  return new AlertConstructor(data);
};

Object.assign(global.Alert, Alert);

describe("Alert Controller Tests", () => {

  describe("getAlerts", () => {
    it("should return alerts with pagination and stats", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.query = mock(() => ({ page: "1", limit: "10" }));

      const res = await alertController.getAlerts(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
      expect(res.response.alerts).toBeDefined();
      expect(res.response.pagination).toBeDefined();
      expect(res.response.stats).toBeDefined();
      expect(res.response.pagination.page).toBe(1);
      expect(res.response.pagination.limit).toBe(10);
    });

    it("should filter alerts by status", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.query = mock(() => ({ status: "active", page: "1", limit: "10" }));

      const res = await alertController.getAlerts(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
    });

    it("should filter alerts by type", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.query = mock(() => ({ type: "critical", page: "1", limit: "10" }));

      const res = await alertController.getAlerts(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
    });

    it("should handle server error", async () => {
      const c = createContext({});
      c.get = mock(() => { throw new Error("Database error"); });

      const res = await alertController.getAlerts(c);

      expect(res.status).toBe(500);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Failed to fetch alerts");
    });
  });

  describe("getAlert", () => {
    it("should return single alert by ID", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "valid-alert-id" }));

      const res = await alertController.getAlert(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
      expect(res.response.alert).toBeDefined();
      expect(res.response.alert._id).toBe("valid-alert-id");
    });

    it("should return 404 for non-existent alert", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "invalid-alert-id" }));

      const res = await alertController.getAlert(c);

      expect(res.status).toBe(404);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Alert not found");
    });

    it("should handle server error", async () => {
      const c = createContext({});
      c.get = mock(() => { throw new Error("Database error"); });
      c.req.param = mock(() => ({ id: "valid-alert-id" }));

      const res = await alertController.getAlert(c);

      expect(res.status).toBe(500);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Failed to fetch alert");
    });
  });

  describe("createAlert", () => {
    it("should create alert successfully", async () => {
      const c = createContext({
        body: {
          type: "critical",
          title: "Test Alert",
          message: "Test alert message",
          source: "test",
          loadBalancerId: "valid-lb-id",
          severity: 4
        }
      });
      c.get = mock(() => "user-123");

      const res = await alertController.createAlert(c);

      expect(res.status).toBe(201);
      expect(res.response.success).toBe(true);
      expect(res.response.alert).toBeDefined();
      expect(res.response.message).toBe("Alert created successfully");
    });

    it("should return error for missing required fields", async () => {
      const c = createContext({
        body: {
          title: "Test Alert"
          // Missing type, message, source
        }
      });
      c.get = mock(() => "user-123");

      const res = await alertController.createAlert(c);

      expect(res.status).toBe(400);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toContain("Missing required fields");
    });

    it("should create alert without loadBalancer", async () => {
      const c = createContext({
        body: {
          type: "warning",
          title: "System Alert",
          message: "System warning message",
          source: "system"
        }
      });
      c.get = mock(() => "user-123");

      const res = await alertController.createAlert(c);

      expect(res.status).toBe(201);
      expect(res.response.success).toBe(true);
    });

    it("should handle server error", async () => {
      const c = createContext({
        body: {
          type: "critical",
          title: "Test Alert",
          message: "Test message",
          source: "test"
        }
      });
      c.get = mock(() => { throw new Error("Database error"); });

      const res = await alertController.createAlert(c);

      expect(res.status).toBe(500);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Failed to create alert");
    });
  });

  describe("acknowledgeAlert", () => {
    it("should acknowledge alert successfully", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "valid-alert-id" }));

      const res = await alertController.acknowledgeAlert(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
      expect(res.response.message).toBe("Alert acknowledged successfully");
    });

    it("should return 404 for non-existent alert", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "invalid-alert-id" }));

      const res = await alertController.acknowledgeAlert(c);

      expect(res.status).toBe(404);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Alert not found");
    });

    it("should return error for non-active alert", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "resolved-alert-id" }));

      const res = await alertController.acknowledgeAlert(c);

      expect(res.status).toBe(400);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Only active alerts can be acknowledged");
    });
  });

  describe("resolveAlert", () => {
    it("should resolve alert successfully", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "valid-alert-id" }));

      const res = await alertController.resolveAlert(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
      expect(res.response.message).toBe("Alert resolved successfully");
    });

    it("should return 404 for non-existent alert", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "invalid-alert-id" }));

      const res = await alertController.resolveAlert(c);

      expect(res.status).toBe(404);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Alert not found");
    });

    it("should return error for already resolved alert", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "resolved-alert-id" }));

      const res = await alertController.resolveAlert(c);

      expect(res.status).toBe(400);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Alert is already resolved");
    });
  });

  describe("deleteAlert", () => {
    it("should delete alert successfully", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "valid-alert-id" }));

      const res = await alertController.deleteAlert(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
      expect(res.response.message).toBe("Alert deleted successfully");
    });

    it("should return 404 for non-existent alert", async () => {
      const c = createContext({});
      c.get = mock(() => "user-123");
      c.req.param = mock(() => ({ id: "invalid-alert-id" }));

      const res = await alertController.deleteAlert(c);

      expect(res.status).toBe(404);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Alert not found");
    });

    it("should handle server error", async () => {
      const c = createContext({});
      c.get = mock(() => { throw new Error("Database error"); });
      c.req.param = mock(() => ({ id: "valid-alert-id" }));

      const res = await alertController.deleteAlert(c);

      expect(res.status).toBe(500);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Failed to delete alert");
    });
  });

  describe("bulkUpdateAlerts", () => {
    it("should acknowledge multiple alerts", async () => {
      const c = createContext({
        body: {
          alertIds: ["alert-1", "alert-2"],
          action: "acknowledge"
        }
      });
      c.get = mock(() => "user-123");

      const res = await alertController.bulkUpdateAlerts(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
      expect(res.response.modifiedCount).toBe(2);
      expect(res.response.message).toContain("acknowledged successfully");
    });

    it("should resolve multiple alerts", async () => {
      const c = createContext({
        body: {
          alertIds: ["alert-1", "alert-2", "alert-3"],
          action: "resolve"
        }
      });
      c.get = mock(() => "user-123");

      const res = await alertController.bulkUpdateAlerts(c);

      expect(res.status).toBe(200);
      expect(res.response.success).toBe(true);
      expect(res.response.modifiedCount).toBe(3);
      expect(res.response.message).toContain("resolved successfully");
    });

    it("should return error for empty alertIds", async () => {
      const c = createContext({
        body: {
          alertIds: [],
          action: "acknowledge"
        }
      });
      c.get = mock(() => "user-123");

      const res = await alertController.bulkUpdateAlerts(c);

      expect(res.status).toBe(400);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toContain("non-empty array");
    });

    it("should return error for invalid action", async () => {
      const c = createContext({
        body: {
          alertIds: ["alert-1"],
          action: "invalid-action"
        }
      });
      c.get = mock(() => "user-123");

      const res = await alertController.bulkUpdateAlerts(c);

      expect(res.status).toBe(400);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toContain("Invalid action");
    });

    it("should return error for missing alertIds", async () => {
      const c = createContext({
        body: {
          action: "acknowledge"
        }
      });
      c.get = mock(() => "user-123");

      const res = await alertController.bulkUpdateAlerts(c);

      expect(res.status).toBe(400);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toContain("non-empty array");
    });

    it("should handle server error", async () => {
      const c = createContext({
        body: {
          alertIds: ["alert-1"],
          action: "acknowledge"
        }
      });
      c.get = mock(() => { throw new Error("Database error"); });

      const res = await alertController.bulkUpdateAlerts(c);

      expect(res.status).toBe(500);
      expect(res.response.success).toBe(false);
      expect(res.response.error).toBe("Failed to update alerts");
    });
  });

  describe("createSystemAlert", () => {
    it("should create system alert successfully", async () => {
      const alertData = {
        type: "system",
        title: "System Alert",
        message: "System message",
        source: "system"
      };

      const result = await alertController.createSystemAlert(alertData);

      expect(result._id).toBe("system-alert-id");
      expect(result.type).toBe("system");
      expect(result.createdAt).toBeDefined();
    });

    it("should handle error in createSystemAlert", async () => {
      // Mock Alert.createSystemAlert to throw error
      const originalCreateSystemAlert = Alert.createSystemAlert;
      Alert.createSystemAlert = mock(() => { throw new Error("System error"); });

      const alertData = {
        type: "system",
        title: "System Alert",
        message: "System message",
        source: "system"
      };

      try {
        await alertController.createSystemAlert(alertData);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.message).toBe("System error");
      }

      // Restore original function
      Alert.createSystemAlert = originalCreateSystemAlert;
    });
  });

});