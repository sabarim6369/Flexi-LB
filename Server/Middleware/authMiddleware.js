import { verifyToken } from "../Utils/jwt.js";
import User from "../Models/User.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization"); // ✅ correct
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // attach user info to context
    c.set("user", decoded);

    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized", details: err.message }, 401);
  }
};

