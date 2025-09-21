import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Copy, RefreshCw, MessageSquare, Plus, Sparkles, Zap, BarChart3, Settings2, Trash2, Edit3, ChevronDown, Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  chatAPI, 
  ChatSession, 
  Message, 
  ChatResponse, 
  SearchResult,
  PaginationInfo 
} from "@/services/chatAPI";

interface AIParameters {
  role: string;
  temperature: number;
  maxTokens: number;
  responseFormat: string;
}

// Predefined prompt suggestions
const promptSuggestions = [
  {
    icon: BarChart3,
    title: "Show Load Balancer Status",
    prompt: "Show me the current status and performance of all load balancers",
    category: "monitoring"
  },
  {
    icon: Plus,
    title: "Create New Load Balancer",
    prompt: "Help me create a new load balancer with best practices",
    category: "creation"
  },
  {
    icon: Settings2,
    title: "Optimize Performance",
    prompt: "Analyze my load balancers and suggest performance optimizations",
    category: "optimization"
  },
  {
    icon: Zap,
    title: "Quick Health Check",
    prompt: "Run a quick health check on all my load balancer instances",
    category: "health"
  }
];

// Dummy data for demonstration - will be replaced with API calls
const dummySessions: ChatSession[] = [
  {
    _id: "new",
    title: "New Chat",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function Chat() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [aiParameters, setAiParameters] = useState<AIParameters>({
    role: "assistant",
    temperature: 0.7,
    maxTokens: 1000,
    responseFormat: "text"
  });
  const [selectedModel, setSelectedModel] = useState("assistant-0.7-1000-text");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load chat sessions on component mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  // Load chat sessions from API
  const loadChatSessions = async () => {
    try {
      setSessionsLoading(true);
      const { sessions } = await chatAPI.getChatSessions(1, 20);
      
      // Format sessions to include proper types
      const formattedSessions = sessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages || []
      }));

      setChatSessions(formattedSessions);
      
      // If no current session and we have sessions, select the first one
      if (!currentSession && formattedSessions.length > 0) {
        await loadSessionMessages(formattedSessions[0]._id);
      } else if (formattedSessions.length === 0) {
        // Create a new session if none exist
        await createNewSession();
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
      // Create a new session as fallback
      await createNewSession();
    } finally {
      setSessionsLoading(false);
    }
  };

  // Load messages for a specific session
  const loadSessionMessages = async (sessionId: string) => {
    try {
      const { session, messages } = await chatAPI.getChatSession(sessionId, 1, 50);
      
      const formattedSession: ChatSession = {
        ...session,
        messages: messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      };

      setCurrentSession(formattedSession);
      
      // Update the session in the sessions list
      setChatSessions(prev => 
        prev.map(s => s._id === sessionId ? formattedSession : s)
      );
    } catch (error) {
      console.error('Error loading session messages:', error);
      toast({
        title: "Error",
        description: "Failed to load session messages",
        variant: "destructive",
      });
    }
  };

  // Get display name for selected model
  const getModelDisplayName = (modelValue: string) => {
    const modelMap = {
      "assistant-0.7-1000-text": "FlexiLB Assistant",
      "assistant-0.9-1500-text": "Verbose Explainer", 
      "system-0.3-800-json": "JSON Responder",
      "assistant-0.5-1200-text": "Debug Helper"
    };
    return modelMap[modelValue] || "FlexiLB Assistant";
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentSession]);

  // Create new chat session
  const createNewSession = async () => {
    try {
      const { session } = await chatAPI.createChatSession("New Chat");
      const formattedSession: ChatSession = {
        ...session,
        messages: [],
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      };
      
      setChatSessions(prev => [formattedSession, ...prev]);
      setCurrentSession(formattedSession);
      
      toast({
        title: "New Chat",
        description: "Created new chat session",
      });
    } catch (error) {
      console.error('Error creating new session:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
    }
  };

  // Delete a chat session
  const deleteSession = async (sessionId: string) => {
    try {
      await chatAPI.deleteChatSession(sessionId);
      
      setChatSessions(prev => prev.filter(s => s._id !== sessionId));
      
      // If deleting current session, select another or create new
      if (currentSession?._id === sessionId) {
        const remainingSessions = chatSessions.filter(s => s._id !== sessionId);
        if (remainingSessions.length > 0) {
          await loadSessionMessages(remainingSessions[0]._id);
        } else {
          await createNewSession();
        }
      }
      
      toast({
        title: "Session Deleted",
        description: "Chat session has been deleted",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    }
  };

  // Search through chat history
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const { searchResults } = await chatAPI.searchChatHistory(searchQuery.trim(), {
        page: 1,
        limit: 20
      });
      setSearchResults(searchResults);
    } catch (error) {
      console.error('Error searching chat history:', error);
      toast({
        title: "Search Error",
        description: "Failed to search chat history",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Start editing a session title
  const startEditingSession = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  // Save edited session title
  const saveSessionTitle = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      toast({
        title: "Error",
        description: "Session title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      await chatAPI.updateChatSession(sessionId, editingTitle.trim());
      
      // Update local state
      setChatSessions(prev => 
        prev.map(session => 
          session._id === sessionId 
            ? { ...session, title: editingTitle.trim(), updatedAt: new Date() }
            : session
        )
      );

      // Update current session if it's the one being edited
      if (currentSession?._id === sessionId) {
        setCurrentSession(prev => 
          prev ? { ...prev, title: editingTitle.trim(), updatedAt: new Date() } : null
        );
      }

      setEditingSessionId(null);
      setEditingTitle("");
      
      toast({
        title: "Success",
        description: "Session title updated successfully",
      });
    } catch (error) {
      console.error('Error updating session title:', error);
      toast({
        title: "Error",
        description: "Failed to update session title",
        variant: "destructive",
      });
    }
  };

  // Cancel editing session title
  const cancelEditingSession = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  // Handle Enter key in edit input
  const handleEditKeyPress = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveSessionTitle(sessionId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingSession();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (prompt: string) => {
    setMessage(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle sending messages with real API call
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content: message.trim(),
      role: "user",
      timestamp: new Date(),
      type: "text",
    };

    let sessionToUse = currentSession;
    
    // If no current session, create a new one
    if (!sessionToUse) {
      try {
        const { session } = await chatAPI.createChatSession("New Chat");
        sessionToUse = {
          ...session,
          messages: [],
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt)
        };
        setCurrentSession(sessionToUse);
        setChatSessions(prev => [sessionToUse!, ...prev]);
      } catch (error) {
        console.error('Error creating session:', error);
        toast({
          title: "Error",
          description: "Failed to create chat session",
          variant: "destructive",
        });
        return;
      }
    }

    // Update UI optimistically
    const optimisticSession = {
      ...sessionToUse,
      messages: [...(sessionToUse.messages || []), userMessage],
      updatedAt: new Date(),
      title: sessionToUse.messages?.length === 0 ? message.trim().slice(0, 30) : sessionToUse.title,
    };

    setCurrentSession(optimisticSession);
    setChatSessions(prev => 
      prev.map(session => 
        session._id === sessionToUse!._id ? optimisticSession : session
      )
    );

    const userQuery = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      // Send message using the API
      const response: ChatResponse = await chatAPI.sendMessage(
        userQuery,
        sessionToUse._id,
        {
          role: getModelDisplayName(selectedModel),
          temperature: aiParameters.temperature,
          responseFormat: aiParameters.responseFormat
        }
      );

      const { reply, sessionId, messageId, isActionExecuted, executionResult, needsClarification, suggestions } = response;

      let assistantContent = reply;
      let messageType: "text" | "loadbalancer" | "error" = "text";

      // Handle different response types
      if (needsClarification && suggestions) {
        assistantContent = `${reply}\n\n**Suggestions:**\n${suggestions.map(s => `• ${s}`).join('\n')}`;
      } else if (isActionExecuted && executionResult) {
        if (executionResult.status === "success") {
          assistantContent = `✅ **Action Completed Successfully**\n\n${executionResult.message}`;
          messageType = "loadbalancer";
          
          toast({
            title: "Action Executed",
            description: executionResult.message,
          });
        } else {
          assistantContent = `❌ **Action Failed**\n\n${executionResult.message}`;
          messageType = "error";
          
          toast({
            title: "Action Failed",
            description: executionResult.message,
            variant: "destructive",
          });
        }
      }

      const assistantMessage: Message = {
        id: messageId,
        content: assistantContent,
        role: "assistant",
        timestamp: new Date(),
        type: messageType,
        data: response.executionResult ? { 
          executionResult: response.executionResult,
          actionData: response.actionData 
        } : needsClarification ? {
          needsClarification: true,
          suggestions: suggestions
        } : undefined
      };

      // Update session with assistant response
      const finalSession = {
        ...optimisticSession,
        _id: sessionId, // Use the sessionId from response
        messages: [...optimisticSession.messages!, assistantMessage],
        updatedAt: new Date(),
      };

      setCurrentSession(finalSession);
      setChatSessions(prev => 
        prev.map(session => 
          session._id === sessionId ? finalSession : session
        )
      );

      // Reload sessions to get updated metadata
      await loadChatSessions();

    } catch (error) {
      console.error('Chat API error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        content: "Sorry, I'm having trouble connecting to the server. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
        type: "error",
      };

      const errorSession = {
        ...optimisticSession,
        messages: [...optimisticSession.messages!, errorMessage],
        updatedAt: new Date(),
      };

      setCurrentSession(errorSession);
      setChatSessions(prev => 
        prev.map(session => 
          session._id === sessionToUse!._id ? errorSession : session
        )
      );

      toast({
        title: "Connection Error",
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
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Enhanced Chat History Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-border/50 bg-background/95 backdrop-blur-sm`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">FlexiLB Assistant</h2>
                  <p className="text-xs text-muted-foreground">AI-Powered Management</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Bar */}
            {showSearch && (
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search chat history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="text-xs p-2 hover:bg-background rounded cursor-pointer"
                        onClick={() => {
                          loadSessionMessages(result.sessionId);
                          setShowSearch(false);
                          setSearchResults([]);
                          setSearchQuery("");
                        }}
                      >
                        <div className="font-medium truncate">{result.sessionTitle}</div>
                        <div className="text-muted-foreground truncate">{result.matches[0]?.preview}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <Button
              onClick={createNewSession}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          {/* Chat Sessions */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {sessionsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading sessions...</p>
                </div>
              ) : chatSessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">No chat sessions yet</p>
                  <Button onClick={createNewSession} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session._id}
                    className={`group relative rounded-xl p-3 cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
                      currentSession?._id === session._id 
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm' 
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => editingSessionId !== session._id && loadSessionMessages(session._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingSessionId === session._id ? (
                          // Edit mode
                          <div className="mb-2">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => handleEditKeyPress(e, session._id)}
                              className="text-sm h-8 mb-1"
                              placeholder="Enter session title..."
                              autoFocus
                              onBlur={() => {
                                // Save on blur if there's content
                                if (editingTitle.trim()) {
                                  saveSessionTitle(session._id);
                                } else {
                                  cancelEditingSession();
                                }
                              }}
                            />
                            <div className="text-xs text-muted-foreground">
                              Press Enter to save • Esc to cancel
                            </div>
                          </div>
                        ) : (
                          // Display mode
                          <div className="text-sm font-medium truncate mb-1 text-foreground">
                            {session.title}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground mb-1">
                          {session.messageCount || session.messages?.length || 0} messages
                          {session.hasLoadBalancerActions && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              LB Actions
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.updatedAt.toLocaleDateString()} • {session.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {session.lastMessage && editingSessionId !== session._id && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {session.lastMessage.content.slice(0, 50)}...
                          </div>
                        )}
                      </div>
                      
                      {editingSessionId === session._id ? (
                        // Edit mode buttons
                        <div className="flex gap-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveSessionTitle(session._id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditingSession();
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        // Normal mode buttons
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingSession(session._id, session.title);
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session._id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Enhanced Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background/50 backdrop-blur-sm">
        {/* Modern Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-muted/60"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    FlexiLB Assistant
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    AI-powered load balancer management
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Online
            </Badge>
          </div>
        </div>

        {/* Enhanced Messages Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-6 space-y-8">
            {(!currentSession || !currentSession.messages || currentSession.messages.length === 0) ? (
              /* Enhanced Welcome Screen */
              <div className="text-center py-12">
                <div className="mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-2xl">
                    <Sparkles className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Welcome to FlexiLB Assistant
                  </h3>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                    Your intelligent companion for load balancer management. I can help you create, configure, monitor, and optimize your load balancers with ease.
                  </p>
                </div>

                {/* Enhanced Suggestion Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
                  {promptSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <Card 
                        key={index}
                        className="p-6 text-left hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20"
                        onClick={() => handleSuggestionClick(suggestion.prompt)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                            suggestion.category === 'monitoring' ? 'bg-blue-100 text-blue-600' :
                            suggestion.category === 'creation' ? 'bg-green-100 text-green-600' :
                            suggestion.category === 'optimization' ? 'bg-purple-100 text-purple-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                              {suggestion.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {suggestion.prompt}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <h5 className="font-medium mb-2">Real-time Monitoring</h5>
                    <p className="text-sm text-muted-foreground">Track performance metrics and health status</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <h5 className="font-medium mb-2">Intelligent Optimization</h5>
                    <p className="text-sm text-muted-foreground">AI-powered suggestions for better performance</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Settings2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h5 className="font-medium mb-2">Easy Configuration</h5>
                    <p className="text-sm text-muted-foreground">Simplified setup and management</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Enhanced Message Display */
              (currentSession?.messages || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                    <div className={`rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto' 
                        : msg.type === 'error' 
                        ? 'bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20' 
                        : 'bg-gradient-to-br from-muted/80 to-muted/60 border border-border/30'
                    }`}>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {msg.content.split('\n').map((line, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-2">
                          {msg.type && msg.type !== 'text' && (
                            <Badge variant="outline" className="text-xs bg-background/50">
                              {msg.type}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(msg.content)}
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100 hover:bg-background/50"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center flex-shrink-0 border border-border/30">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Enhanced Loading State */}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="rounded-2xl p-4 bg-gradient-to-br from-muted/80 to-muted/60 border border-border/30 max-w-[75%] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      FlexiLB Assistant is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Enhanced Input Area */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto p-6">
            <div className="relative">
              {/* AI Model Selector */}
              <div className="mb-4">
                <Select 
                  value={selectedModel}
                  onValueChange={(value) => {
                    setSelectedModel(value);
                    const [role, temp, tokens, format] = value.split('-');
                    setAiParameters({
                      role,
                      temperature: parseFloat(temp),
                      maxTokens: parseInt(tokens),
                      responseFormat: format
                    });
                  }}
                >
                  <SelectTrigger className="w-[280px] bg-background/90 border-border/50 rounded-lg hover:bg-background/95 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <SelectValue />
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </SelectTrigger>
                  <SelectContent className="w-[280px]">
                    <SelectItem value="assistant-0.7-1000-text" className="flex flex-col items-start p-3">
                      <div className="font-medium">FlexiLB Assistant</div>
                      <div className="text-xs text-muted-foreground">For load balancer management</div>
                    </SelectItem>
                    <SelectItem value="assistant-0.9-1500-text" className="flex flex-col items-start p-3">
                      <div className="font-medium">Verbose Explainer</div>
                      <div className="text-xs text-muted-foreground">Longer explanations</div>
                    </SelectItem>
                    <SelectItem value="system-0.3-800-json" className="flex flex-col items-start p-3">
                      <div className="font-medium">JSON Responder</div>
                      <div className="text-xs text-muted-foreground">Structured output for backend execution</div>
                    </SelectItem>
                    <SelectItem value="assistant-0.5-1200-text" className="flex flex-col items-start p-3">
                      <div className="font-medium">Debug Helper</div>
                      <div className="text-xs text-muted-foreground">Troubleshooting logs/steps</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about your load balancers..."
                    className="min-h-[60px] max-h-[150px] resize-none pr-12 bg-background/80 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-2xl shadow-sm"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {message.length}/2000
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  size="lg"
                  className="h-[60px] px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl"
                >
                  {isLoading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Secure & Private</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    Powered by <Sparkles className="h-3 w-3" /> FlexiLB AI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}