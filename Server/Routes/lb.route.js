import { Hono } from "hono";
import {
  createLB, listLBs, getLB, addInstance, removeInstance,
  proxyRequest, getMetrics
} from "../Controllers/lbController.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

const router = new Hono();

// protected LB management
router.get("/", authMiddleware, listLBs);
router.post("/", authMiddleware, createLB);
router.get("/:lbId", authMiddleware, getLB);
router.post("/:lbId/instances", authMiddleware, addInstance);
router.delete("/:lbId/instances", authMiddleware, removeInstance);
router.get("/:lbId/metrics", authMiddleware, getMetrics);

// public proxy endpoint (you might protect it differently)
router.all("/proxy/:lbId/*", proxyRequest);

export default router;
