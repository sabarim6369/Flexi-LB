import { Hono } from "hono";
import {
  createLB,
  listLBs,
  getLB,
  updateLB,
  deleteLB,
  addInstance,
  updateInstance,
  removeInstance,
  proxyRequest,
  getMetrics,
  getLBMetrics,
  getLBHourlyRequests,
  getoverallMetrics,
  setRateLimit,
  getRateLimit,
  updateRateLimit,
  disableRateLimit,
  listLBsForRateLimiterStatus
} from "../Controllers/lbController.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

const router = new Hono();

// LB routes
router.get("/", authMiddleware, listLBs);
router.post("/", authMiddleware, createLB);
router.get("/:lbId", authMiddleware, getLB);
router.put("/:lbId", authMiddleware, updateLB);
router.delete("/:lbId", authMiddleware, deleteLB);

router.post("/:lbId/instances", authMiddleware, addInstance);
router.put("/:lbId/instances", authMiddleware, updateInstance);
router.delete("/:lbId/instances", authMiddleware, removeInstance);

router.get("data/overallmetrics",authMiddleware,getoverallMetrics);

router.get("/:id/metrics", authMiddleware, getLBMetrics);
router.get("/:id/hourlyreq",authMiddleware,getLBHourlyRequests)

// Rate limiter routes
router.post("/:id/ratelimit", authMiddleware, setRateLimit);
router.get("/:id/ratelimit", authMiddleware, getRateLimit);
router.put("/:id/ratelimit", authMiddleware, updateRateLimit);
router.delete("/:id/ratelimit", authMiddleware, disableRateLimit);
router.get("/ratelimiter/status",authMiddleware,listLBsForRateLimiterStatus);

export default router;
