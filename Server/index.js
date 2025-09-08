import { Hono } from "hono";
import { connectDB } from "./config/db.js";
import authRoutes from "./Routes/auth.route.js";
import lbRoutes from "./Routes/lb.route.js";

const app = new Hono();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") return c.text("", 204);
  await next();
});

app.route("/auth", authRoutes);
app.route("/lbs", lbRoutes);

const PORT = process.env.PORT || 3003;
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/flexilb";

(async () => {
  try {
    await connectDB(MONGO);
    console.log("MongoDB connected");


  } catch (err) {
    console.error("Startup error", err);
  }
})();
export default{
  port: PORT,
  fetch: app.fetch
}