// Quick test for chat functionality
import { chat } from './Controllers/chatcontroller.js';

// Mock request object
const mockRequest = {
  json: () => ({
    message: "edit the name of lastlbss loadbalancer to fuckingboss"
  })
};

// Mock context
const mockContext = {
  req: mockRequest,
  get: (key) => key === "user" ? { id: "test-user-123" } : null,
  json: (data) => {
    console.log("Response:", JSON.stringify(data, null, 2));
    return data;
  }
};

console.log("Testing chat controller...");
// This would need a real database connection to work
// chat(mockContext).catch(console.error);