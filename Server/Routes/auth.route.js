import { Hono } from "hono";
import { signup, login, getUserById,
  editProfile,
  changePassword,
  updateNotifications,
  getNotifications,
  checkvalidity
  } from "../Controllers/authController.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

const router = new Hono();

router.post("/signup", signup);
router.post("/login", login);
router.get("/user/byid",authMiddleware, getUserById);

// Edit profile (username/email)
router.put("/user/profile",authMiddleware, editProfile);

// Change password
router.put("/user/password",authMiddleware, changePassword);

// Update notification preferences
router.put("/user/notifications",authMiddleware, updateNotifications);

router.get("/user/notifications",authMiddleware, getNotifications);
router.post("/user/check-validity",checkvalidity)
export default router;

