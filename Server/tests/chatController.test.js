// tests/chatController.test.js
import { describe, it, expect, mock } from "bun:test";
import * as chatController from "../Controllers/chatcontroller.js";
import { createContext } from "./helpers/createContext.js";

// Mock Groq SDK
const mockGroqClient = {
  chat: {
    completions: {
      create: mock(() => ({
        choices: [
          {
            message: {
              content: "This is a test response from the AI model"
            }
          }
        ]
      }))
    }
  }
};

// Mock the Groq import
mock.module("groq-sdk", () => {
  return {
    default: mock(() => mockGroqClient)
  };
});

describe("Chat Controller Tests", () => {
  
  it("should return AI response for valid message", async () => {
    const c = createContext({ 
      body: { message: "Hello, how are you?" } 
    });
    
    const res = await chatController.chat(c);
    
    expect(res.status).toBe(200);
    expect(res.response.reply).toBe("This is a test response from the AI model");
    expect(mockGroqClient.chat.completions.create).toHaveBeenCalledWith({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Hello, how are you?" }]
    });
  });

  it("should handle empty message", async () => {
    const c = createContext({ 
      body: { message: "" } 
    });
    
    const res = await chatController.chat(c);
    
    expect(res.status).toBe(200);
    expect(res.response.reply).toBe("This is a test response from the AI model");
  });

  it("should handle missing message field", async () => {
    const c = createContext({ 
      body: {} 
    });
    
    const res = await chatController.chat(c);
    
    expect(res.status).toBe(200);
    expect(res.response.reply).toBe("This is a test response from the AI model");
  });

  it("should handle API error gracefully", async () => {
    // Mock API error
    mockGroqClient.chat.completions.create.mockRejectedValueOnce(
      new Error("API Error")
    );
    
    const c = createContext({ 
      body: { message: "Test message" } 
    });
    
    const res = await chatController.chat(c);
    
    expect(res.status).toBe(500);
    expect(res.response.error).toBe("Something went wrong");
  });

  it("should handle malformed JSON request", async () => {
    const c = {
      req: { 
        json: async () => { 
          throw new Error("Invalid JSON"); 
        } 
      },
      json: (response, status = 200) => ({ response, status })
    };
    
    const res = await chatController.chat(c);
    
    expect(res.status).toBe(500);
    expect(res.response.error).toBe("Something went wrong");
  });

  it("should handle network timeout", async () => {
    // Mock network timeout
    mockGroqClient.chat.completions.create.mockRejectedValueOnce(
      new Error("ETIMEDOUT")
    );
    
    const c = createContext({ 
      body: { message: "Test message with timeout" } 
    });
    
    const res = await chatController.chat(c);
    
    expect(res.status).toBe(500);
    expect(res.response.error).toBe("Something went wrong");
  });

  it("should handle long messages", async () => {
    const longMessage = "A".repeat(10000);
    
    const c = createContext({ 
      body: { message: longMessage } 
    });
    
    const res = await chatController.chat(c);
    
    expect(res.status).toBe(200);
    expect(res.response.reply).toBe("This is a test response from the AI model");
    expect(mockGroqClient.chat.completions.create).toHaveBeenCalledWith({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: longMessage }]
    });
  });

  it("should handle special characters in message", async () => {
    const specialMessage = "Hello! @#$%^&*()_+ 🚀 How are you?";
    
    const c = createContext({ 
      body: { message: specialMessage } 
    });
    
    const res = await chatController.chat(c);
    
    expect(res.status).toBe(200);
    expect(res.response.reply).toBe("This is a test response from the AI model");
  });

});