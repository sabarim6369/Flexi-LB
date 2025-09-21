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

// Chat completion endpoint
chatroute.post("/chat", chat);

// Session management endpoints
chatroute.get("/sessions", getChatSessions);
chatroute.get("/sessions/:sessionId", getChatSession);
chatroute.post("/sessions", createChatSession);
chatroute.post("/sessions/message", saveMessage);
chatroute.delete("/sessions/:sessionId", deleteChatSession);

export default chatroute;