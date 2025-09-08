import { verifyToken } from "../Utils/jwt.js";
import User from "../Models/User.js";

export async function authMiddleware(c, next) {
  try {
    const auth = c.req.headers.get("authorization") || "";
    if (!auth || !auth.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
    const token = auth.slice(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    c.req.user = user; // attach user to request
    return next();
  } catch (err) {
    return c.json({ error: "Unauthorized", details: err.message }, 401);
  }
}
