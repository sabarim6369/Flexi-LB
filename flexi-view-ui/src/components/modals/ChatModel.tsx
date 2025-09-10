import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, Send, X } from "lucide-react";
import { apiurl } from './../../api';
import axiosInstance from './../../Utils/axiosInstance';

export default function ChatBox() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages come
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);

    try {
      const res = await axiosInstance.post("/api/chat", { message: input });
      setMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "⚠️ Error connecting to AI" }]);
    }

    setInput("");
  };

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transform transition"
      >
        <MessageCircle size={26} />
      </button>

      {/* Popup chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 flex flex-col rounded-2xl shadow-2xl border bg-white/90 backdrop-blur-md animate-slide-up">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-2xl">
            <span className="font-semibold">FlexiLB Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <span
                  className={`px-3 py-2 rounded-2xl max-w-[70%] shadow ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center border-t p-2 bg-white rounded-b-2xl">
            <input
              className="flex-1 border-none px-3 py-2 focus:outline-none rounded-lg text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me something..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:scale-110 transition"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
