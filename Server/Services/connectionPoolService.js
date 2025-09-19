import http from "http";
import https from "https";

const agentMap = new Map();

export function getAgentForUrl(url) {
  const isHttps = url.startsWith("https://");
  const key = isHttps ? `https:${url}` : `http:${url}`;

  if (!agentMap.has(key)) {
    const agent = isHttps
      ? new https.Agent({
          keepAlive: true,
          maxSockets: 100,
          maxFreeSockets: 10,
          timeout: 60000, // 60s
        })
      : new http.Agent({
          keepAlive: true,
          maxSockets: 100,
          maxFreeSockets: 10,
          timeout: 60000,
        });

    agentMap.set(key, agent);
  }

  return agentMap.get(key);
}
