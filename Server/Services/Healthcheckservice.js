import LoadBalancer from "../Models/LoadBalancer.js";
import axios from "axios";

export const checkInstanceHealth = async (lbId, instance) => {
  try {
    const start = Date.now();
    await axios.get(instance.url, { timeout: 3000 }); 
    const latency = Date.now() - start;

    instance.isHealthy = true;
    // instance.metrics.requests += 1;
    instance.metrics.totalLatencyMs += latency;
    instance.metrics.lastLatency = latency;

    // ✅ Classify health based on response time
    if (latency < 200) {
      instance.healthStatus = "healthy";
    } else if (latency < 500) {
      instance.healthStatus = "degraded";
    } else {
      instance.healthStatus = "slow";
    }
  } catch (err) {
    instance.isHealthy = false;
    instance.healthStatus = "down";
    instance.metrics.failures += 1;
  }
};


export const updateAllLBsHealth = async () => {
  const lbs = await LoadBalancer.find();

  await Promise.all(lbs.map(async (lb) => {
    await Promise.all(lb.instances.map(instance => checkInstanceHealth(lb._id, instance)));
    
    await lb.save({ validateBeforeSave: false });
  }));
};

export const startHealthChecks = () => {
  setInterval(async () => {
    try {
      await updateAllLBsHealth();
      console.log("Health check completed");
    } catch (err) {
      console.error("Health check error:", err);
    }
  }, 5000); 
};