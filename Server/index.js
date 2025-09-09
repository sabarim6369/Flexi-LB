import { Hono } from "hono";
import { connectDB } from "./config/db.js";
import authRoutes from "./Routes/auth.route.js";
import lbRoutes from "./Routes/lb.route.js";
import { startHealthChecks } from "./Services/Healthcheckservice";
import { proxyRequest} from "./Controllers/lbController.js"
const app = new Hono();
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  c.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  // respond to preflight OPTIONS requests
  if (c.req.method === "OPTIONS") return c.text("", 204);

  await next();
});

require("./Services/EmailService.js")
app.route("/auth", authRoutes);
app.route("/lbs", lbRoutes);
app.all("/proxy/:slug/*", proxyRequest);
app.all("/proxy/:slug", proxyRequest);

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
startHealthChecks();
export default{
  port: PORT,
  fetch: app.fetch
}