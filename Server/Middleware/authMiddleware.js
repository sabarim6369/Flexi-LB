import { verifyToken } from "../Utils/jwt.js";
import User from "../Models/User.js";


export const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization"); 
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    c.set("user", decoded);

    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized", details: err.message }, 401);
  }
};

