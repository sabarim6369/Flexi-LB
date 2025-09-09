// Keep round-robin counters in memory per LB
const rrCounters = {};

function pickInstance(lb, clientIp) {
  if (!lb.instances || lb.instances.length === 0) return null;

  // Filter only healthy enough instances (exclude completely unhealthy)
  const healthyInstances = lb.instances.filter(
    (i) => i.healthLevel !== "unhealthy"
  );

  if (healthyInstances.length === 0) {
    console.warn(`No healthy instances available for LB: ${lb.name}`);
    return null;
  }

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
      // simple hash of client IP
      const hash = [...clientIp].reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return healthyInstances[hash % healthyInstances.length];
    }

    case "weighted": {
      // Expand list based on weight & health level
      const weightedPool = [];
      healthyInstances.forEach((inst) => {
        let factor = inst.weight || 1;

        // Adjust based on healthLevel
        switch (inst.healthLevel) {
          case "high":
            factor *= 3;
            break;
          case "medium":
            factor *= 2;
            break;
          case "low":
            factor *= 1;
            break;
          case "critical":
            factor *= 0.5; // very low chance
            break;
        }

        for (let i = 0; i < factor; i++) {
          weightedPool.push(inst);
        }
      });

      if (weightedPool.length === 0) return null;

      const randIdx = Math.floor(Math.random() * weightedPool.length);
      return weightedPool[randIdx];
    }

    default:
      // fallback → just pick first healthy instance
      return healthyInstances[0];
  }
}

export default pickInstance;
