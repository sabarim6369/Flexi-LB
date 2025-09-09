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
  getMetrics
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

// Metrics
router.get("/:lbId/metrics", authMiddleware, getMetrics);

// Public proxy endpoint
router.all("/proxy/:slug/*", proxyRequest);
router.all("/proxy/:slug", proxyRequest);

export default router;
