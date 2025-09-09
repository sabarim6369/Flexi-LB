import cron from "node-cron";
import mongoose from "mongoose";
import User from "../Models/User.js";
import LoadBalancer from "../Models/LoadBalancer.js";
import { sendToQueue } from "../Utils/rabbitMQ.js";

// Health check simulation (replace with real checks)
async function checkInstanceHealth(instance) {
  try {
    // Example: simple fetch to instance URL
    const res = await fetch(instance.url);
    if (!res.ok) {
      return { isHealthy: false, healthStatus: "down" };
    }
    return { isHealthy: true, healthStatus: "healthy" };
  } catch (err) {
    return { isHealthy: false, healthStatus: "down" };
  }
}

async function notifyServerDown(user, instance, lbName) {
  await sendToQueue({
    to: user.email,
    subject: `Server Down Alert: ${instance.instancename || instance.id}`,
    template: "serverDown",
    context: { username: user.username, serverName: instance.instancename || instance.id, lbName }
  });
}

async function monitorLoadBalancers() {
  const users = await User.find({ "notifications.serverDownAlerts": true });
  for (const user of users) {
    const lbs = await LoadBalancer.find({ owner: user._id });
    for (const lb of lbs) {
      for (const instance of lb.instances) {
        const { isHealthy, healthStatus } = await checkInstanceHealth(instance);

        // Update instance status in DB if changed
        if (instance.isHealthy !== isHealthy || instance.healthStatus !== healthStatus) {
          instance.isHealthy = isHealthy;
          instance.healthStatus = healthStatus;
          await lb.save();
        }

        // Send email if server is down
        if (!isHealthy && user.notifications.serverDownAlerts) {
          await notifyServerDown(user, instance, lb.name);
        }
      }
    }
  }
}

// Run every minute
// cron.schedule("* * * * *", async () => {
//   console.log("Checking load balancer health...");
//   try {
//     await monitorLoadBalancers();
//     console.log("Health check completed.");
//   } catch (err) {
//     console.error("Error in health check:", err);
//   }
// });
