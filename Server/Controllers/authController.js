import User from "../Models/User.js";
import bcrypt from "bcryptjs";
import { signToken } from "../Utils/jwt.js";

export async function signup(c) {
  try {
    const { username, email, password } = await c.req.json();
    if (!username || !email || !password) return c.json({ error: "Missing fields" }, 400);

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return c.json({ error: "User exists" }, 400);

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    const token = signToken({ id: user._id });
    return c.json({ user: { id: user._id, username, email }, token });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

export async function login(c) {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Missing fields" }, 400);
    const user = await User.findOne({ email });
    if (!user) return c.json({ error: "Invalid credentials" }, 401);
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return c.json({ error: "Invalid credentials" }, 401);
    const token = signToken({ id: user._id });
    return c.json({ user: { id: user._id, username: user.username, email: user.email }, token });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}
