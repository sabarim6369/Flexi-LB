import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Copy, RefreshCw, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/Utils/axiosInstance";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "loadbalancer" | "code" | "error";
  data?: any;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Load chat sessions on component mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  // Load chat sessions from backend
  const loadChatSessions = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await axiosInstance.get("/api/v1/sessions");
      const sessions = response.data.sessions.map((session: any) => ({
        id: session._id,
        title: session.title,
        messages: [],
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      }));
      
      setChatSessions(sessions);
      
      // If no current session and sessions exist, load the first one
      if (!currentSession && sessions.length > 0) {
        await loadChatSession(sessions[0].id);
      } else if (sessions.length === 0) {
        // Create a new session if none exist
        await createNewSession();
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
      // Create a new session as fallback
      createNewSession();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load specific chat session
  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await axiosInstance.get(`/api/v1/sessions/${sessionId}`);
      const sessionData = response.data.session;
      
      const session: ChatSession = {
        id: sessionData._id,
        title: sessionData.title,
        messages: sessionData.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        createdAt: new Date(sessionData.createdAt),
        updatedAt: new Date(sessionData.updatedAt),
      };
      
      setCurrentSession(session);
    } catch (error) {
      console.error("Failed to load chat session:", error);
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive",
      });
    }
  };

  // Create new chat session
  const createNewSession = async () => {
    try {
      const response = await axiosInstance.post("/api/v1/sessions", {
        title: "New Chat"
      });
      
      const sessionData = response.data.session;
      const newSession: ChatSession = {
        id: sessionData._id,
        title: sessionData.title,
        messages: [],
        createdAt: new Date(sessionData.createdAt),
        updatedAt: new Date(sessionData.updatedAt),
      };
      
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
    } catch (error) {
      console.error("Failed to create new session:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
    }
  };

  // Save message to backend
  const saveMessageToBackend = async (sessionId: string, messageData: Message) => {
    try {
      await axiosInstance.post("/api/v1/sessions/message", {
        sessionId,
        message: messageData,
      });
    } catch (error) {
      console.error("Failed to save message:", error);
      // Don't show error to user for this, as it's not critical
    }
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || !currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: "user",
      timestamp: new Date(),
      type: "text",
    };

    // Add user message to current session
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updatedAt: new Date(),
      title: currentSession.messages.length === 0 ? message.trim().slice(0, 30) : currentSession.title,
    };

    setCurrentSession(updatedSession);
    setChatSessions(prev => 
      prev.map(session => 
        session.id === currentSession.id ? updatedSession : session
      )
    );

    setMessage("");
    setIsLoading(true);

    try {
      // Check if message is related to load balancers
      const isLBQuery = message.toLowerCase().includes("load balancer") || 
                       message.toLowerCase().includes("loadbalancer") || 
                       message.toLowerCase().includes("create") ||
                       message.toLowerCase().includes("show") ||
                       message.toLowerCase().includes("list");

      let response;
      
      if (isLBQuery) {
        // Enhanced message for load balancer operations
        const enhancedMessage = `You are FlexiLB Assistant, a specialized AI for load balancer management. 
        User query: "${message}"
        
        Available commands:
        - "show available load balancers" - List all existing load balancers
        - "create load balancer" - Create a new load balancer with specified configuration
        - "delete load balancer [name]" - Remove a load balancer
        - "show metrics for [name]" - Display performance metrics
        - "configure [name]" - Modify load balancer settings
        
        Context: This is a FlexiLB management system with load balancer functionality.
        Please provide helpful, specific responses for load balancer management tasks.`;
        
        response = await axiosInstance.post("/api/v1/chat", {
          message: enhancedMessage,
        });
      } else {
        response = await axiosInstance.post("/api/v1/chat", {
          message,
        });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.reply,
        role: "assistant",
        timestamp: new Date(),
        type: isLBQuery ? "loadbalancer" : "text",
      };

      // Add assistant response to session
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updatedAt: new Date(),
      };

      setCurrentSession(finalSession);
      setChatSessions(prev => 
        prev.map(session => 
          session.id === currentSession.id ? finalSession : session
        )
      );

    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
        type: "error",
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        updatedAt: new Date(),
      };

      setCurrentSession(errorSession);
      setChatSessions(prev => 
        prev.map(session => 
          session.id === currentSession.id ? errorSession : session
        )
      );

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy message content
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  // Format message content for different types
  const formatMessageContent = (message: Message) => {
    if (message.type === "code") {
      return (
        <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm">
          <code>{message.content}</code>
        </pre>
      );
    }
    
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {message.content.split('\n').map((line, index) => (
          <p key={index} className="mb-2 last:mb-0">
            {line}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Chat History Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-border`}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat History
            </h2>
            <Button
              onClick={createNewSession}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <Card
                  key={session.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    currentSession?.id === session.id ? 'bg-muted border-primary' : ''
                  }`}
                  onClick={() => setCurrentSession(session)}
                >
                  <div className="text-sm font-medium truncate mb-1">
                    {session.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.messages.length} messages
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">FlexiLB Assistant</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered load balancer management
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Online
          </Badge>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {currentSession?.messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Welcome to FlexiLB Assistant</h3>
                <p className="text-muted-foreground mb-6">
                  I can help you manage load balancers, view metrics, create configurations, and more.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Card className="p-4 text-left">
                    <h4 className="font-medium mb-2">Load Balancer Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Create, configure, and manage your load balancers
                    </p>
                  </Card>
                  <Card className="p-4 text-left">
                    <h4 className="font-medium mb-2">Metrics & Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      View performance metrics and health status
                    </p>
                  </Card>
                  <Card className="p-4 text-left">
                    <h4 className="font-medium mb-2">Configuration Help</h4>
                    <p className="text-sm text-muted-foreground">
                      Get assistance with configuration and best practices
                    </p>
                  </Card>
                  <Card className="p-4 text-left">
                    <h4 className="font-medium mb-2">Troubleshooting</h4>
                    <p className="text-sm text-muted-foreground">
                      Diagnose issues and get solutions
                    </p>
                  </Card>
                </div>
              </div>
            ) : (
              currentSession?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                    <Card className={`p-4 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : msg.type === 'error' 
                        ? 'bg-destructive/10 border-destructive/20' 
                        : 'bg-muted/50'
                    }`}>
                      {formatMessageContent(msg)}
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-2">
                          {msg.type && msg.type !== 'text' && (
                            <Badge variant="outline" className="text-xs">
                              {msg.type}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(msg.content)}
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <Card className="p-4 bg-muted/50 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      FlexiLB Assistant is thinking...
                    </span>
                  </div>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me about load balancers, metrics, configurations..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                size="lg"
                className="h-[60px] px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span className="flex items-center gap-1">
                Powered by <Bot className="h-3 w-3" /> FlexiLB AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}