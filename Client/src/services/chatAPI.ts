import axiosInstance from "@/Utils/axiosInstance";
import { apiurl } from "@/api";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "loadbalancer" | "error";
  data?: {
    action?: string;
    executionResult?: any;
    actionData?: any;
    error?: string;
    needsClarification?: boolean;
    suggestions?: string[];
    aiResponse?: string;
  };
}

export interface ChatSession {
  _id: string;
  title: string;
  messages?: Message[];
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  messageCount?: number;
  lastMessage?: {
    content: string;
    role: string;
    timestamp: Date;
  };
  hasLoadBalancerActions?: boolean;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  messageId: string;
  isActionExecuted?: boolean;
  executionResult?: any;
  actionData?: any;
  needsClarification?: boolean;
  suggestions?: string[];
}

export interface SearchResult {
  sessionId: string;
  sessionTitle: string;
  sessionCreatedAt: Date;
  sessionUpdatedAt: Date;
  matches: Array<{
    messageId: string;
    content: string;
    role: string;
    type: string;
    timestamp: Date;
    preview: string;
  }>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Chat API Service
export class ChatAPIService {
  private baseUrl = `${apiurl}/api/chat`;

  /**
   * Send a message to the chat API
   * @param message - The message content
   * @param sessionId - Optional session ID. If not provided, a new session will be created
   * @param aiParameters - Optional AI parameters
   */
  async sendMessage(
    message: string, 
    sessionId?: string, 
    aiParameters?: {
      role?: string;
      temperature?: number;
      responseFormat?: string;
    }
  ): Promise<ChatResponse> {
    const requestData = {
      message,
      sessionId,
      ...aiParameters
    };

    const response = await axiosInstance.post(`${this.baseUrl}/chat`, requestData);
    return response.data;
  }

  /**
   * Get all chat sessions for the current user
   * @param page - Page number for pagination
   * @param limit - Number of sessions per page
   */
  async getChatSessions(page = 1, limit = 20): Promise<{
    sessions: ChatSession[];
    pagination: PaginationInfo;
  }> {
    const response = await axiosInstance.get(
      `${this.baseUrl}/sessions?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Get a specific chat session with messages
   * @param sessionId - The session ID
   * @param page - Page number for message pagination
   * @param limit - Number of messages per page
   */
  async getChatSession(sessionId: string, page = 1, limit = 50): Promise<{
    session: ChatSession;
    messages: Message[];
    pagination: PaginationInfo;
  }> {
    const response = await axiosInstance.get(
      `${this.baseUrl}/sessions/${sessionId}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Create a new chat session
   * @param title - Optional custom title
   */
  async createChatSession(title?: string): Promise<{ session: ChatSession }> {
    const response = await axiosInstance.post(`${this.baseUrl}/sessions`, {
      title: title || "New Chat"
    });
    return response.data;
  }

  /**
   * Update a chat session title
   * @param sessionId - The session ID
   * @param title - New title
   */
  async updateChatSession(sessionId: string, title: string): Promise<{
    success: boolean;
    session: ChatSession;
  }> {
    const response = await axiosInstance.put(`${this.baseUrl}/sessions/${sessionId}`, {
      title
    });
    return response.data;
  }

  /**
   * Delete a chat session
   * @param sessionId - The session ID
   */
  async deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await axiosInstance.delete(`${this.baseUrl}/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Save a message to a session (for manual message saving)
   * @param sessionId - The session ID
   * @param message - Message data
   * @param messageType - Type of message
   * @param additionalData - Additional metadata
   */
  async saveMessage(
    sessionId: string,
    message: Partial<Message>,
    messageType = "text",
    additionalData?: any
  ): Promise<{
    success: boolean;
    session: Partial<ChatSession>;
    savedMessage: Message;
  }> {
    const response = await axiosInstance.post(`${this.baseUrl}/sessions/message`, {
      sessionId,
      message,
      messageType,
      additionalData
    });
    return response.data;
  }

  /**
   * Search through chat history
   * @param query - Search query
   * @param filters - Optional filters
   */
  async searchChatHistory(
    query: string,
    filters?: {
      sessionId?: string;
      messageType?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    searchResults: SearchResult[];
    query: string;
    pagination: PaginationInfo;
  }> {
    const params = new URLSearchParams({
      query,
      ...Object.fromEntries(
        Object.entries(filters || {}).map(([key, value]) => [key, String(value)])
      )
    });

    const response = await axiosInstance.get(`${this.baseUrl}/search?${params}`);
    return response.data;
  }

  /**
   * Helper method to convert backend message format to frontend format
   */
  static formatMessage(backendMessage: any): Message {
    return {
      id: backendMessage.id,
      content: backendMessage.content,
      role: backendMessage.role,
      timestamp: new Date(backendMessage.timestamp),
      type: backendMessage.type || "text",
      data: backendMessage.data
    };
  }

  /**
   * Helper method to convert backend session format to frontend format
   */
  static formatSession(backendSession: any): ChatSession {
    return {
      _id: backendSession._id,
      title: backendSession.title,
      messages: backendSession.messages?.map(this.formatMessage) || [],
      createdAt: new Date(backendSession.createdAt),
      updatedAt: new Date(backendSession.updatedAt),
      isActive: backendSession.isActive,
      messageCount: backendSession.messageCount,
      lastMessage: backendSession.lastMessage ? {
        content: backendSession.lastMessage.content,
        role: backendSession.lastMessage.role,
        timestamp: new Date(backendSession.lastMessage.timestamp)
      } : undefined,
      hasLoadBalancerActions: backendSession.hasLoadBalancerActions
    };
  }
}

// Export a singleton instance
export const chatAPI = new ChatAPIService();