import { Hono } from "hono";
const chatroute = new Hono();
import { 
  chat, 
  getChatSessions, 
  getChatSession, 
  createChatSession, 
  saveMessage, 
  deleteChatSession,
  updateChatSession,
  searchChatHistory
} from "../Controllers/chatcontroller.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

// Chat completion endpoint
chatroute.post("/chat", authMiddleware, chat);

// Session management endpoints
chatroute.get("/sessions", authMiddleware, getChatSessions);
chatroute.get("/sessions/:sessionId", authMiddleware, getChatSession);
chatroute.post("/sessions", authMiddleware, createChatSession);
chatroute.put("/sessions/:sessionId", authMiddleware, updateChatSession);
chatroute.post("/sessions/message", authMiddleware, saveMessage);
chatroute.delete("/sessions/:sessionId", authMiddleware, deleteChatSession);

// Search endpoint
chatroute.get("/search", authMiddleware, searchChatHistory);

export default chatroute;