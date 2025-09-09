// Keep round-robin counters in memory per LB
const rrCounters = {};

function pickInstance(lb, clientIp) {
  if (!lb.instances || lb.instances.length === 0) return null;

  switch (lb.algorithm) {
    case "roundRobin": {
      if (!rrCounters[lb.id]) rrCounters[lb.id] = 0;
      const idx = rrCounters[lb.id] % lb.instances.length;
      rrCounters[lb.id]++;
      return lb.instances[idx];
    }

    case "leastConn": {
      // assumes each instance has a `activeConnections` counter
      return lb.instances.reduce((a, b) =>
        (a.activeConnections || 0) <= (b.activeConnections || 0) ? a : b
      );
    }

    case "ipHash": {
      // simple hash of client IP
      const hash = [...clientIp].reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return lb.instances[hash % lb.instances.length];
    }

    default:
      // fallback → just pick first
      return lb.instances[0];
  }
}
