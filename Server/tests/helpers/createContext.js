// tests/helpers/createContext.js
export function createContext({ body = {}, user = null } = {}) {
  return {
    req: { json: async () => body },
    get: (key) => (key === "user" ? user : null),
    json: (response, status = 200) => ({ response, status }),
  };
}
