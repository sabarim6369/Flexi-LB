import LoadBalancer from "../Models/LoadBalancer.js";
import { getAgentForUrl } from "../Services/connectionPoolService.js";
import slugify from "slugify";
import axios from 'axios'
import http from "http";
import https from "https";
const rrState = new Map();

function selectInstance(lb) {
  const healthy = lb.instances.filter(i => i.isHealthy);
  if (!healthy.length) return null;

  switch (lb.algorithm) {
    case "round_robin": {
      const key = String(lb._id);

      // Expand list by weight → [A,A,B] if A=2, B=1
      const weightedList = healthy.flatMap(inst =>
        Array(inst.weight).fill(inst)
      );

      const last = rrState.get(key) ?? -1;
      const idx = (last + 1) % weightedList.length;
      rrState.set(key, idx);

      return weightedList[idx];
    }

    case "least_conn":
      return healthy.reduce((a, b) => {
        const aReq = a.metrics.requests - a.metrics.failures;
        const bReq = b.metrics.requests - b.metrics.failures;
        return aReq <= bReq ? a : b;
      });

    case "random":
      return healthy[Math.floor(Math.random() * healthy.length)];

    default:
      return healthy[0];
  }
}


export async function createLB(c) {
  console.log(c.req.json())
  try {
    const user = c.get("user");
    const { name, instances = [], algorithm = "round_robin" } = await c.req.json();

    if (!name || instances.length === 0) {
      return c.json({ error: "Invalid body" }, 400);
    }
  const existingLB = await LoadBalancer.findOne({ name, owner: user.id });
    if (existingLB) {
      return c.json({ error: "Load Balancer name already exists" }, 400);
    }
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await LoadBalancer.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    let lb = await LoadBalancer.create({
      name,
      owner: user.id,
      slug,
      algorithm,
       instances: instances.map((inst, i) => ({
    id: `inst-${Date.now()}-${i}`,
    url: inst.url,
    weight: inst.weight ?? 1, 
    instancename:inst.name  
  })),
      endpoint: "temp"
    });

    const BASE_URL = process.env.BASE_URL || "https://flexilb.onrender.com";
        // const BASE_URL = process.env.BASE_URL || "http://localhost:3003";

    lb.endpoint = `${BASE_URL}/proxy/${slug}`;
    await lb.save();

    rrState.set(String(lb._id), 0);

    return c.json({ lb });
  } catch (err) {
    console.log(err);
    return c.json({ error: err.message }, 500);
  }
}


export async function listLBs(c) {
  try {
    const user = c.get("user");
    const lbs = await LoadBalancer.find({ owner: user.id });

    
    const activeLBs = lbs.length;

    let totalInstances = 0;
    let totalRequests = 0;
    let totalLatency = 0;

    lbs.forEach(lb => {
      totalInstances += lb.instances.length;
      lb.instances.forEach(inst => {
        totalRequests += inst.metrics.requests;
        totalLatency += inst.metrics.totalLatencyMs;
      });
    });

    const avgLatency =
      totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

    return c.json({
      lbs,
      stats: {
        activeLBs,
        totalInstances,
        totalRequests,
        avgLatency,
      },
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

export async function getLB(c) {
  const lb = await LoadBalancer.findById(c.req.param("lbId"));
  if (!lb) return c.json({ error: "LB not found" }, 404);
  return c.json({ lb });
}
export async function updateLB(c) {
  try {
    const user = c.get("user"); // get the current user
    const { name, endpoint, algorithm } = await c.req.json();
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);

    // Check if the new name already exists for the same user
    if (name && name !== lb.name) {
      const existingLB = await LoadBalancer.findOne({ name, owner: user.id });
      if (existingLB) {
        return c.json({ error: "You already have a Load Balancer with this name" }, 400);
      }
      lb.name = name;
    }

    if (endpoint) lb.endpoint = endpoint;
    if (algorithm) lb.algorithm = algorithm;

    await lb.save();
    return c.json({ lb });
  } catch (err) {
    console.log(err)
    return c.json({ error: err.message }, 500);
  }
}

export async function deleteLB(c) {
  try {
    const lb = await LoadBalancer.findByIdAndDelete(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);
    rrState.delete(String(lb._id));
    return c.json({ message: "LB deleted" });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

export async function addInstance(c) {
  try {
    const body = await c.req.json();
    console.log("Body received:", body);

    const { url, weight = 1, instancename = "s" } = body;
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);

    // Check if instancename already exists in this LB
    if (lb.instances.some(inst => inst.instancename === instancename)) {
      return c.json({ error: `Instance name "${instancename}" already exists in this LB.` }, 400);
    }

    lb.instances.push({
      id: `inst-${Date.now()}`,
      url,
      weight,
      instancename,
      isHealthy: true
    });

    await lb.save();
    return c.json({ lb });
  } catch (err) {
    console.log(err);
    return c.json({ error: err.message }, 500);
  }
}



export async function updateInstance(c) {
  try {
    const { id, url, weight, instancename } = await c.req.json();
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);

    const instance = lb.instances.find(inst => inst.id === id);
    if (!instance) return c.json({ error: "Instance not found" }, 404);

    // Check uniqueness if instancename is being updated
    if (instancename && instancename !== instance.instancename) {
      if (lb.instances.some(inst => inst.instancename === instancename)) {
        return c.json({ error: `Instance name "${instancename}" already exists in this LB.` }, 400);
      }
      instance.instancename = instancename;
    }

    if (url) instance.url = url;
    if (weight) instance.weight = weight;

    await lb.save();
    return c.json({ lb });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}



export async function removeInstance(c) {
  try {
    const { id } = await c.req.json();  // match frontend
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);

    lb.instances = lb.instances.filter(i => i.id !== id);

    await lb.save();
    return c.json({ lb });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}


// keep round-robin counters in memory per LB
const rrCounters = {};

function pickInstance(lb, clientIp) {
  // ✅ only consider healthy instances
  const healthyInstances = lb.instances.filter(i => i.isHealthy);
  if (healthyInstances.length === 0) return null;

  switch (lb.algorithm) {
    case "round-robin": {
      if (!rrCounters[lb.id]) rrCounters[lb.id] = 0;
      const idx = rrCounters[lb.id] % healthyInstances.length;
      rrCounters[lb.id]++;
      return healthyInstances[idx];
    }

    case "least_conn": {
      return healthyInstances.reduce((a, b) =>
        (a.activeConnections || 0) <= (b.activeConnections || 0) ? a : b
      );
    }

    case "random": {
      const idx = Math.floor(Math.random() * healthyInstances.length);
      return healthyInstances[idx];
    }

    case "ip-hash": {
      const hash = [...clientIp].reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return healthyInstances[hash % healthyInstances.length];
    }

    case "weighted_round_robin": {
      if (!rrCounters[lb.id]) rrCounters[lb.id] = 0;
      const totalWeight = healthyInstances.reduce((sum, i) => sum + (i.weight || 1), 0);
      let count = rrCounters[lb.id] % totalWeight;
      rrCounters[lb.id]++;

      for (const inst of healthyInstances) {
        count -= inst.weight || 1;
        if (count < 0) return inst;
      }
      return healthyInstances[0]; // fallback
    }

    case "least_response_time": {
      return healthyInstances.reduce((a, b) =>
        (a.metrics.lastLatency || 0) <= (b.metrics.lastLatency || 0) ? a : b
      );
    }

    default:
      return healthyInstances[0]; // fallback
  }
}
const agentMap = new Map(); 
const rateLimitStore = new Map(); // key = lb._id + clientIp

export async function proxyRequest(c) {
  const slug = c.req.param("slug");
  // const path = c.req.param("path") || "";
  const path = c.req.path.replace(`/proxy/${slug}/`, ""); // everything after slug

  const lb = await LoadBalancer.findOne({ slug });
  if (!lb || lb.instances.length === 0) {
    return c.json({ error: "No backend available" }, 404);
  }

  const clientIp =
    c.req.header("x-forwarded-for") ||
    c.req.header("x-real-ip") ||
    "127.0.0.1";

  // ---- Rate Limiting ----
  if (lb.rateLimiterOn) {
    const limit = lb.rateLimiter.limit;   // max requests
    const windowSec = lb.rateLimiter.window; // time window in seconds
    const now = Date.now();
    const key = `${lb._id}:${clientIp}`;

    let timestamps = rateLimitStore.get(key) || [];
    const cutoff = now - windowSec * 1000;
    timestamps = timestamps.filter(ts => ts > cutoff);

    if (timestamps.length >= limit) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    timestamps.push(now);
    rateLimitStore.set(key, timestamps);
  }

  // ---- Pick instance ----
  const instance = pickInstance(lb, clientIp);
  if (!instance) {
    return c.json({ error: "No healthy instances available" }, 503);
  }

  // ---- Metrics ----
  instance.metrics.requests = (instance.metrics.requests || 0) + 1;
  instance.metrics.todayRequests = (instance.metrics.todayRequests || 0) + 1;

  const hourKey = `${new Date().toISOString().slice(0, 13)}`;
  const prevCount = instance.metrics.hourlyRequests?.get(hourKey) || 0;
  instance.metrics.hourlyRequests.set(hourKey, prevCount + 1);

  await lb.save();

  try {
    // ---- Normalize URL ----
    const baseUrl = instance.url.replace(/\/+$/, "");       // remove trailing slash
    const cleanPath = path.replace(/^\/+/, "");            // remove leading slash
    const targetUrl = cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;

    console.log(`Proxying request to instance: ${instance.url}, path: ${path}`);
    console.log("targetUrl:", targetUrl);

    const method = c.req.method;
    const agent = getAgentForUrl(instance.url);
    console.log("agent", agent);

    const response = await axios({
      url: targetUrl,
      method,
      data: method !== "GET" ? await c.req.json().catch(() => null) : undefined,
      headers: c.req.header(),
      validateStatus: () => true,
      maxRedirects: 5,  
      httpAgent: agent,
      httpsAgent: agent,
    });

    return c.newResponse(
      typeof response.data === "object" ? JSON.stringify(response.data) : response.data,
      response.status,
      {
        ...response.headers,
        "content-type":
          typeof response.data === "object"
            ? "application/json"
            : response.headers["content-type"] || "text/plain",
      }
    );
  } catch (err) {
    console.error("Proxy error", err.message);
    instance.metrics.failures = (instance.metrics.failures || 0) + 1;
    await lb.save();
    return c.json({ error: "Proxy request failed" }, 500);
  }
}



export async function getMetrics(c) {
  const lb = await LoadBalancer.findById(c.req.param("lbId"));
  if (!lb) return c.json({ error: "LB not found" }, 404);
  return c.json({
    metrics: lb.instances.map(i => ({
      id: i.id,
      ...i.metrics,
      isHealthy: i.isHealthy,
    }))
  });
}

export const getLBMetrics = async (c) => {
  try {
    const id = c.req.param("id"); // Hono param

    const lb = await LoadBalancer.findById(id).populate("owner", "name email");
    if (!lb) {
      return c.json({ error: "Load Balancer not found" }, 404);
    }

    // Initialize metrics
    const metrics = {
      totalRequests: 0,
      requestsToday: 0,
      avgLatency: 0,
      errorRate: 0,
      successRate: 0,
      uptime: 100,
      bandwidth: 0,
      hourlyRequests: Array(24).fill(0),
    };

    let totalLatencySum = 0;
    let failureSum = 0;

   
    const instances = lb.instances.map((inst) => {
      const instRequests = inst.metrics.requests || 0;
      const instFailures = inst.metrics.failures || 0;
      const instLatency = inst.metrics.lastLatency || 0;
      const instRequestsToday = inst.metrics.todayRequests || 0;

      metrics.totalRequests += instRequests;
      metrics.requestsToday += instRequestsToday;
      totalLatencySum += instLatency;
      failureSum += instFailures;

      // Merge hourlyRequests
      inst.metrics.hourlyRequests?.forEach((r, idx) => {
        metrics.hourlyRequests[idx] += r;
      });

      return {
        id: inst.id || inst._id,
        url: inst.url,
        servername: inst.instancename || inst.url, // ✅ must exist
        healthStatus: inst.isHealthy
          ? inst.metrics.lastLatency < 200
            ? "healthy"
            : "slow"
          : "down",
        isHealthy: inst.isHealthy,
        weight: inst.weight,
        metrics: {
          requests: instRequests,
          failures: instFailures,
          totalLatencyMs: inst.metrics.totalLatencyMs || 0,
          lastLatency: instLatency,
          bandwidth: inst.metrics.bandwidth || 0,
          uptime: inst.metrics.uptime || 100,
          todayRequests: instRequestsToday,
          hourlyRequests: inst.metrics.hourlyRequests || [],
        },
      };
    });

    const instanceCount = lb.instances.length || 1;
    metrics.avgLatency = Math.round(totalLatencySum / instanceCount);
    metrics.errorRate = metrics.totalRequests
      ? Number(((failureSum / metrics.totalRequests) * 100).toFixed(2))
      : 0;
    metrics.successRate = Number((100 - metrics.errorRate).toFixed(2));

    // Example: bandwidth & uptime (replace with real data if available)
    metrics.bandwidth = instances.reduce((sum, inst) => sum + (inst.metrics.bandwidth || 0), 0);
    metrics.uptime = Math.min(
      100,
      Math.max(...instances.map((inst) => (inst.metrics.uptime || 100)))
    );

    // Overall status
    const allHealthy = instances.every((i) => i.isHealthy);
    const status = allHealthy ? "active" : instances.some((i) => i.isHealthy) ? "warning" : "error";

    return c.json({
      id: lb._id,
      name: lb.name,
      slug: lb.slug,
      endpoint: lb.endpoint,
      algorithm: lb.algorithm,
      owner: lb.owner,
      status,
      metrics,
      instances, // ✅ Send instances directly to frontend
    });
  } catch (err) {
    console.error("Error fetching LB metrics:", err);
    return c.json({ error: "Server error" }, 500);
  }
};
export const getLBHourlyRequests = async (c) => {
  try {
    const lbId = c.req.param("id");
    const lb = await LoadBalancer.findById(lbId);
    if (!lb) return c.json({ error: "Load Balancer not found" }, 404);

    const now = new Date();

    const normalizeHourly = (hourlyRequests) => {
      return Array.from({ length: 24 }, (_, i) => {
        const h = String(i).padStart(2, "0");
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}-${h}`;
        return hourlyRequests.get(key) || 0;
      });
    };

    const instances = lb.instances.map(inst => ({
      id: inst.id,
      url: inst.url,
      hourlyRequests: normalizeHourly(inst.metrics.hourlyRequests || new Map())
    }));

    return c.json({ lbId: lb._id, name: lb.name, instances });
  } catch (err) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
};

export const getoverallMetrics = async (c) => {
  try {

       const user = c.get("user");
       console.log("😁😁😁😁")

    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const lbs = await LoadBalancer.find({ owner: user.id }).lean();

    let totalRequests = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    let totalFailures = 0;
    let activeLBs = 0;
    let totalLBs = lbs.length;
    let totalInstances = 0;
    let activeInstances = 0;

    const loadBalancers = lbs.map((lb) => {
      let requests = 0;
      let failures = 0;
      let latencySum = 0;
      let lastLatency = 0;
      let instanceCount = lb.instances.length;
      let healthyInstances = 0;

      lb.instances.forEach((inst) => {
        requests += inst.metrics.requests || 0;
        failures += inst.metrics.failures || 0;
        latencySum += inst.metrics.totalLatencyMs || 0;
        if (inst.metrics.lastLatency) lastLatency = inst.metrics.lastLatency;
        if (inst.isHealthy) healthyInstances++;
      });

      const avgLatency = requests > 0 ? Math.round(latencySum / requests) : 0;
      const errorRate = requests > 0 ? ((failures / requests) * 100).toFixed(1) : "0.0";
      const uptime = ((healthyInstances / instanceCount) * 100).toFixed(1);

      totalRequests += requests;
      totalLatency += latencySum;
      latencyCount += requests;
      totalFailures += failures;
      totalInstances += instanceCount;
      activeInstances += healthyInstances;
      if (healthyInstances > 0) activeLBs++;

      let status = "active";
      if (parseFloat(uptime) < 95) status = "warning";
      if (healthyInstances === 0) status = "error";

      return {
        id: lb._id,
        name: lb.name,
        requests,
        latency: avgLatency || lastLatency,
        errorRate,
        uptime,
        status,
        instances: { active: healthyInstances, total: instanceCount },
      };
    });

    const overview = {
      totalRequests,
      totalLBs,
      activeLBs,
      avgLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
      errorRate: totalRequests > 0 ? ((totalFailures / totalRequests) * 100).toFixed(1) : "0.0",
      uptime: totalInstances > 0 ? ((activeInstances / totalInstances) * 100).toFixed(1) : "0.0",
      instances: { active: activeInstances, total: totalInstances },
    };

    return c.json({ overview, loadBalancers });
  } catch (err) {
    console.error("Error fetching metrics:", err);
    return c.json({ message: "Failed to fetch metrics" }, 500);
  }
};

// Set rate limiter for a load balancer
export async function setRateLimit(c) {
  console.log("Setting rate limit")
  try {
    const user = c.get("user");
    console.log(user)
    const { id } = c.req.param();

    const { limit, window } = await c.req.json();

    if (!limit || !window || limit <= 0 || window <= 0) {
      return c.json({ error: "Invalid limit or window values" }, 400);
    }

    const lb = await LoadBalancer.findOne({ _id: id, owner: user.id });
    if (!lb) {
      console.log("Load balancer not found")
      console.log(id)
      return c.json({ error: "Load balancer not found" }, 404);
    }

    lb.rateLimiter = { limit, window };
    lb.rateLimiterOn = true;
    await lb.save();

    return c.json({ 
      message: "Rate limit set successfully", 
      rateLimit: lb.rateLimiter,
      rateLimiterOn: lb.rateLimiterOn 
    });
  } catch (err) {
    console.error("Error setting rate limit:", err);
    return c.json({ message: "Failed to set rate limit" }, 500);
  }
}

// Get rate limiter settings for a load balancer
export async function getRateLimit(c) {
  try {
    const user = c.get("user");
    const { id } = c.req.param();

    const lb = await LoadBalancer.findOne({ _id: id, owner: user.id });
    if (!lb) {
      return c.json({ error: "Load balancer not found" }, 404);
    }

    return c.json({ 
      rateLimit: lb.rateLimiter,
      rateLimiterOn: lb.rateLimiterOn 
    });
  } catch (err) {
    console.error("Error getting rate limit:", err);
    return c.json({ message: "Failed to get rate limit" }, 500);
  }
}

// Update rate limiter settings
export async function updateRateLimit(c) {
  try {
    const user = c.get("user");
    const { id } = c.req.param();
    const { limit, window, rateLimiterOn } = await c.req.json();

    const lb = await LoadBalancer.findOne({ _id: id, owner: user.id });
    if (!lb) {
      return c.json({ error: "Load balancer not found" }, 404);
    }

    if (limit !== undefined && window !== undefined) {
      if (limit <= 0 || window <= 0) {
        return c.json({ error: "Invalid limit or window values" }, 400);
      }
      lb.rateLimiter = { limit, window };
    }

    if (rateLimiterOn !== undefined) {
      lb.rateLimiterOn = rateLimiterOn;
    }

    await lb.save();

    return c.json({ 
      message: "Rate limit updated successfully", 
      rateLimit: lb.rateLimiter,
      rateLimiterOn: lb.rateLimiterOn 
    });
  } catch (err) {
    console.error("Error updating rate limit:", err);
    return c.json({ message: "Failed to update rate limit" }, 500);
  }
}

// Disable rate limiter for a load balancer
export async function disableRateLimit(c) {
  try {
    const user = c.get("user");
    const { id } = c.req.param();

    const lb = await LoadBalancer.findOne({ _id: id, owner: user.id });
    if (!lb) {
      return c.json({ error: "Load balancer not found" }, 404);
    }

    lb.rateLimiterOn = false;
    await lb.save();

    return c.json({ 
      message: "Rate limiter disabled successfully", 
      rateLimiterOn: lb.rateLimiterOn 
    });
  } catch (err) {
    console.error("Error disabling rate limit:", err);
    return c.json({ message: "Failed to disable rate limit" }, 500);
  }
}
export async function listLBsForRateLimiterStatus(c) {
  try {
    const user = c.get("user");
    const lbs = await LoadBalancer.find({ owner: user.id });

    const activeLBs = lbs.length;

    let totalInstances = 0;
    let totalRequests = 0;
    let totalLatency = 0;
    let totalRateLimiterOn = 0; 
    lbs.forEach(lb => {
      totalInstances += lb.instances.length;
      if (lb.rateLimiterOn) totalRateLimiterOn++; // NEW
      lb.instances.forEach(inst => {
        totalRequests += inst.metrics.requests;
        totalLatency += inst.metrics.totalLatencyMs;
      });
    });

    const avgLatency =
      totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

    // add rate limiter info per LB
    const lbsWithRateLimiter = lbs.map(lb => ({
      ...lb.toObject(),
      rateLimiterOn: lb.rateLimiterOn,
      rateLimiter: lb.rateLimiterOn ? lb.rateLimiter : null
    }));

    return c.json({
      lbs: lbsWithRateLimiter,
      stats: {
        activeLBs,
        totalInstances,
        totalRequests,
        avgLatency,
        totalRateLimiterOn // NEW
      },
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

