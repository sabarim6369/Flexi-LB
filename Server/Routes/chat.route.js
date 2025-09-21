import { Hono } from "hono";
const chatroute = new Hono();
import { 
  chat, 
  getChatSessions, 
  getChatSession, 
  createChatSession, 
  saveMessage, 
  deleteChatSession 
} from "../Controllers/chatcontroller.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

// Chat completion endpoint
chatroute.post("/chat",authMiddleware, chat);

// Session management endpoints
chatroute.get("/sessions", getChatSessions);
chatroute.get("/sessions/:sessionId", getChatSession);
chatroute.post("/sessions", createChatSession);
chatroute.post("/sessions/message", saveMessage);
chatroute.delete("/sessions/:sessionId", deleteChatSession);

export default chatroute;