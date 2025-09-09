import User from "../Models/User.js";
import bcrypt from "bcryptjs";
import { signToken,verifyToken } from "../Utils/jwt.js";

// Get user details using ID from token
export async function getUserById(c) {
  try {
    // Get the decoded token info set by authMiddleware
    const userData = c.get("user"); // { id: "..." }
    if (!userData?.id) return c.json({ error: "Unauthorized" }, 401);

    const user = await User.findById(userData.id).select("-password"); // exclude password
    if (!user) return c.json({ error: "User not found" }, 404);

    return c.json({ user });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

// Change password
export async function changePassword(c) {
  try {
    const { oldPassword, newPassword } = await c.req.json();
    const userData = c.get("user"); // from authMiddleware
    if (!userData?.id) return c.json({ error: "Unauthorized" }, 401);
    if (!oldPassword || !newPassword) return c.json({ error: "Missing fields" }, 400);

    const user = await User.findById(userData.id);
    if (!user) return c.json({ error: "User not found" }, 404);

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return c.json({ error: "Old password incorrect" }, 401);

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return c.json({ message: "Password updated successfully" });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

// Edit profile (username/email)
export async function editProfile(c) {
  try {
    const { username, email } = await c.req.json();
    const userData = c.get("user");
    if (!userData?.id) return c.json({ error: "Unauthorized" }, 401);

    const user = await User.findById(userData.id);
    if (!user) return c.json({ error: "User not found" }, 404);

    if (username) user.username = username.trim().toLowerCase();
    if (email) user.email = email.trim().toLowerCase();

    await user.save();

    return c.json({ user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

// Update user notification settings
export async function updateNotifications(c) {
  try {
    const { notifications } = await c.req.json();
    const userData = c.get("user");
    if (!userData?.id) return c.json({ error: "Unauthorized" }, 401);
    if (!notifications) return c.json({ error: "Missing fields" }, 400);

    const user = await User.findById(userData.id);
    if (!user) return c.json({ error: "User not found" }, 404);

    user.notifications = { ...user.notifications, ...notifications };
    await user.save();

    return c.json({ notifications: user.notifications });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

// Get user notifications
export async function getNotifications(c) {
  try {
    const userData = c.get("user");
    if (!userData?.id) return c.json({ error: "Unauthorized" }, 401);

    const user = await User.findById(userData.id).select("notifications");
    if (!user) return c.json({ error: "User not found" }, 404);

    return c.json({ notifications: user.notifications });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}


export async function signup(c) {
  try {
    let { username, email, password } = await c.req.json();

    if (!username || !email || !password) {
      return c.json({ error: "Missing fields" }, 400);
    }

    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return c.json({ error: "User exists" }, 400);

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    const token = signToken({ id: user._id });

    return c.json({ user: { id: user._id, username: user.username, email: user.email }, token });
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

// Hono handler
export async function checkvalidity(c) {
  try {
    const { token } = await c.req.json();

    if (!token) {
      return c.json({ valid: false, message: "No token provided" }, 400);
    }

    const decoded = verifyToken(token);

    // check expiration
    const currentTime = Math.floor(Date.now() / 1000); // in seconds
    const expTime = decoded.exp;

    if (expTime && expTime < currentTime) {
      return c.json({ valid: false, message: "Token expired" }, 401);
    }

    const timeLeft = expTime ? expTime - currentTime : null;

    return c.json({ valid: true, decoded, expiresIn: timeLeft });
  } catch (err) {
    return c.json({ valid: false, message: "Invalid token" }, 401);
  }
}