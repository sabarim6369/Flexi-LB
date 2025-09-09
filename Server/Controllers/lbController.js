import LoadBalancer from "../Models/LoadBalancer.js";
import slugify from "slugify";

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
    const user = c.get("user");
    console.log(user);
  const lbs = await LoadBalancer.find({ owner: user.id });

return c.json(lbs);
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


export async function proxyRequest(c) {
  try {
    const slug = c.req.param("slug");
    const lb = await LoadBalancer.findOne({ slug });
    if (!lb) return c.text("LB not found", 404);

    const target = selectInstance(lb);
    if (!target) return c.text("No healthy instances", 502);

    const tail = c.req.param("0") || "";
    const url = target.url.replace(/\/$/, "") + "/" + tail.replace(/^\//, "");

    const start = Date.now();
    const headers = {};
    for (const [k, v] of c.req.headers.entries()) headers[k] = v;
    const body = await c.req.arrayBuffer().catch(() => null);

    const res = await fetch(url, {
      method: c.req.method,
      headers,
      body: body && body.byteLength ? Buffer.from(body) : undefined,
    });

    const latency = Date.now() - start;
    const inst = lb.instances.find(i => i.id === target.id);
    if (inst) {
      inst.metrics.requests += 1;
      inst.metrics.totalLatencyMs += latency;
      if (!res.ok) inst.metrics.failures += 1;
      await lb.save();
    }

    const resBody = await res.arrayBuffer();
    const response = c.body(resBody, res.status);
    for (const [k, v] of res.headers.entries()) response.header(k, v);
    return response;
  } catch (err) {
    return c.text("Proxy error: " + err.message, 500);
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
