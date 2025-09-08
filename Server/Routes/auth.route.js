import { Hono } from "hono";
import { signup, login } from "../Controllers/authController.js";

const router = new Hono();

router.post("/signup", signup);
router.post("/login", login);

export default router;
