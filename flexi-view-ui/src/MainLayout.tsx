// src/layouts/MainLayout.tsx
import { Outlet } from "react-router-dom";
import ChatBox from "./components/modals/ChatModel";
export default function MainLayout() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Main page content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Chatbot at bottom-right */}
      <div className="fixed bottom-4 right-4 w-80">
        <ChatBox />
      </div>
    </div>
  );
}
