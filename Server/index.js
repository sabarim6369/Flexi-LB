import { Hono } from "hono";
import { connectDB } from "./config/db.js";
import authRoutes from "./Routes/auth.route.js";
import lbRoutes from "./Routes/lb.route.js";
// import { startHealthChecks } from "./services/healthChecker.js";

const app = new Hono();

app.use("*", async (c, next) => {
  // simple CORS for testing
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") return c.text("", 204);
  await next();
});

app.route("/auth", authRoutes);
app.route("/lbs", lbRoutes);

const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/flexilb";

(async () => {
  try {
    await connectDB(MONGO);
    // start health checker (runs every 10s)
    // startHealthChecks(10000, 3000);

    console.log("FlexiLB backend running on port", PORT);
  } catch (err) {
    console.error("Startup error", err);
  }
})();
app.fire();
