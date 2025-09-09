import LoadBalancer from "../Models/LoadBalancer.js";
import slugify from "slugify";
import axios from 'axios'
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
  try {
    const user = c.get("user");
    const { name, instances = [], algorithm = "round_robin" } = await c.req.json();

    if (!name || instances.length === 0) {
      return c.json({ error: "Invalid body" }, 400);
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
  })),
      endpoint: "temp"
    });

    const BASE_URL = process.env.BASE_URL || "http://localhost:3003";
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

    // --- Aggregations ---
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
    const { name, endpoint, algorithm } = await c.req.json();
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);
    if (name) lb.name = name;
    if (endpoint) lb.endpoint = endpoint;
    if (algorithm) lb.algorithm = algorithm;
    await lb.save();
    return c.json({ lb });
  } catch (err) {
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
    const { url, weight = 1 } = await c.req.json();
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);

    lb.instances.push({
      id: `inst-${Date.now()}`,
      url,
      weight,
      isHealthy: true
    });

    await lb.save();
    return c.json({ lb });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}


export async function updateInstance(c) {
  try {
    const { id, url, weight } = await c.req.json();
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);

    const instance = lb.instances.find(inst => inst.id === id);
    if (!instance) return c.json({ error: "Instance not found" }, 404);

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
    case "roundRobin": {
      if (!rrCounters[lb.id]) rrCounters[lb.id] = 0;
      const idx = rrCounters[lb.id] % healthyInstances.length;
      rrCounters[lb.id]++;
      return healthyInstances[idx];
    }

    case "leastConn": {
      return healthyInstances.reduce((a, b) =>
        (a.activeConnections || 0) <= (b.activeConnections || 0) ? a : b
      );
    }

    case "ipHash": {
      const hash = [...clientIp].reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return healthyInstances[hash % healthyInstances.length];
    }

    default:
      return healthyInstances[0]; // fallback
  }
}
export async function proxyRequest(c) {
  const slug = c.req.param("slug");
  const path = c.req.param("*") || "";

  const lb = await LoadBalancer.findOne({ slug });
  if (!lb || lb.instances.length === 0) {
    return c.json({ error: "No backend available" }, 404);
  }

  const clientIp =
    c.req.header("x-forwarded-for") ||
    c.req.header("x-real-ip") ||
    "127.0.0.1";

  const instance = pickInstance(lb, clientIp);
  if (!instance) {
    return c.json({ error: "No healthy instances available" }, 503);
  }

  instance.metrics.requests = (instance.metrics.requests || 0) + 1;
  instance.metrics.todayRequests = (instance.metrics.todayRequests || 0) + 1;

 const now = new Date();
const hourKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}`;

  const prevCount = instance.metrics.hourlyRequests?.get(hourKey) || 0;
  instance.metrics.hourlyRequests.set(hourKey, prevCount + 1);

  await lb.save(); // Save updated metrics

  try {
    const targetUrl = `${instance.url}/${path}`;
    const method = c.req.method;

    const response = await axios({
      url: targetUrl,
      method,
      data: method !== "GET" ? await c.req.json().catch(() => null) : undefined,
      headers: c.req.header(),
      validateStatus: () => true,
    });

    return c.newResponse(
      typeof response.data === "object"
        ? JSON.stringify(response.data)
        : response.data,
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
    await lb.save(); // Save failure count too
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

    // Prepare instances array
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
