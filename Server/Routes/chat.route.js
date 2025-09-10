import { Hono } from "hono";
const chatroute=new Hono();
import { chat } from "../Controllers/chatcontroller";
chatroute.post("/chat",chat);
export default chatroute