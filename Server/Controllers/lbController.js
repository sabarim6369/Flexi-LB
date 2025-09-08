import LoadBalancer from "../Models/LoadBalancer.js";

/*
 In-memory map to track lastIndex for round-robin per LB.
 NOTE: not persisted — good enough for small setups. Persist if you need strict continuity.
*/
const rrState = new Map();

// Create LB
export async function createLB(c) {
  try {
    const user = c.req.user;
    const { name, endpoint, instances = [] } = await c.req.json();
    if (!name || !endpoint || !Array.isArray(instances)) return c.json({ error: "Invalid body" }, 400);
    const lb = await LoadBalancer.create({
      name,
      owner: user._id,
      endpoint,
      instances: instances.map((u, i) => ({ id: `inst-${Date.now()}-${i}`, url: u })),
    });
    rrState.set(String(lb._id), 0);
    return c.json({ lb });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}
r
// List LBs for user
export async function listLBs(c) {
  const user = c.req.user;
  const lbs = await LoadBalancer.find({ owner: user._id }).lean();
  return c.json({ lbs });
}

// Get LB
export async function getLB(c) {
  const lb = await LoadBalancer.findById(c.req.param("lbId"));
  if (!lb) return c.json({ error: "LB not found" }, 404);
  return c.json({ lb });
}

// Add instance
export async function addInstance(c) {
  try {
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);
    const { url } = await c.req.json();
    lb.instances.push({ id: `inst-${Date.now()}`, url, isHealthy: true });
    await lb.save();
    return c.json({ lb });
  } catch (err) { return c.json({ error: err.message }, 500); }
}

// Remove instance
export async function removeInstance(c) {
  try {
    const lb = await LoadBalancer.findById(c.req.param("lbId"));
    if (!lb) return c.json({ error: "LB not found" }, 404);
    const { instId } = await c.req.json();
    lb.instances = lb.instances.filter(i => i.id !== instId);
    await lb.save();
    return c.json({ lb });
  } catch (err) { return c.json({ error: err.message }, 500); }
}

// Simple proxy endpoint: forwards /proxy/:lbId/* -> selected instance
export async function proxyRequest(c) {
  try {
    const lbId = c.req.param("lbId");
    const lb = await LoadBalancer.findById(lbId);
    if (!lb) return c.text("LB not found", 404);

    const healthy = lb.instances.filter(i => i.isHealthy);
    if (!healthy.length) return c.text("No healthy instances", 502);

    // Round-robin selection (in-memory)
    const stateKey = String(lb._id);
    const last = rrState.get(stateKey) ?? 0;
    const idx = (last + 1) % healthy.length;
    rrState.set(stateKey, idx);
    const target = healthy[idx];

    // Build target url: append the path after /proxy/:lbId/
    const tail = c.req.param("0") || ""; // Hono captures wildcard as param 0
    const url = target.url.replace(/\/$/, "") + "/" + tail.replace(/^\//, "");

    // Measure latency
    const start = Date.now();
    // Use global fetch (available in Bun / modern runtimes)
    const forwardHeaders = {};
    for (const [k, v] of c.req.headers.entries()) {
      // Remove hop-by-hop headers if needed
      forwardHeaders[k] = v;
    }

    // Forward body if present
    const body = await c.req.arrayBuffer().catch(()=>null);
    const init = {
      method: c.req.method,
      headers: forwardHeaders,
      body: (body && body.byteLength) ? Buffer.from(body) : undefined,
      // set timeout handling externally if desired
    };

    const res = await fetch(url, init);
    const latency = Date.now() - start;

    // update metrics in DB (simple accumulation)
    const instIndex = lb.instances.findIndex(i => i.id === target.id);
    if (instIndex >= 0) {
      lb.instances[instIndex].metrics.requests += 1;
      lb.instances[instIndex].metrics.totalLatencyMs += latency;
      if (!res.ok) lb.instances[instIndex].metrics.failures += 1;
      await lb.save();
    }

    // Relay response to client
    const resBody = await res.arrayBuffer();
    const response = c.body(resBody, res.status);
    // copy response headers (some may be hop-by-hop)
    for (const [k, v] of res.headers.entries()) response.header(k, v);
    return response;
  } catch (err) {
    return c.text("Proxy error: " + err.message, 500);
  }
}

// Endpoint to get metrics
export async function getMetrics(c) {
  const lb = await LoadBalancer.findById(c.req.param("lbId"));
  if (!lb) return c.json({ error: "LB not found" }, 404);
  return c.json({ metrics: lb.instances.map(i => ({ id: i.id, ...i.metrics, isHealthy: i.isHealthy })) });
}
