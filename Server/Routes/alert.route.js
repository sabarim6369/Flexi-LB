import { Hono } from "hono";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import {
  getAlerts,
  getAlert,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert,
  bulkUpdateAlerts
} from "../Controllers/alertController.js";

const alertRoutes = new Hono();

// Apply auth middleware to all routes
alertRoutes.use("*", authMiddleware);

// GET /alerts - Get all alerts for user with filtering and pagination
alertRoutes.get("/", getAlerts);

// GET /alerts/:id - Get single alert by ID
alertRoutes.get("/:id", getAlert);

// POST /alerts - Create new alert
alertRoutes.post("/", createAlert);

// PATCH /alerts/:id/acknowledge - Acknowledge an alert
alertRoutes.patch("/:id/acknowledge", acknowledgeAlert);

// PATCH /alerts/:id/resolve - Resolve an alert
alertRoutes.patch("/:id/resolve", resolveAlert);

// DELETE /alerts/:id - Delete an alert
alertRoutes.delete("/:id", deleteAlert);

// POST /alerts/bulk - Bulk update alerts (acknowledge/resolve multiple)
alertRoutes.post("/bulk", bulkUpdateAlerts);

export default alertRoutes;