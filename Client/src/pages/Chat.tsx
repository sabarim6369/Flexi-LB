import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Copy, RefreshCw, MessageSquare, Plus, Sparkles, Zap, BarChart3, Settings2, Trash2, Edit3, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Dummy data for demonstration - starting with empty new chat
const dummySessions: ChatSession[] = [
  {
    id: "new",
    title: "New Chat",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "1",
    title: "Load Balancer Setup Help",
    messages: [
      {
        id: "1",
        content: "How do I create a new load balancer?",
        role: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        type: "text"
      },
      {
        id: "2",
        content: "I'll help you create a new load balancer! Here's how you can do it:\n\n1. **Navigate to Dashboard**: Go to your FlexiLB dashboard\n2. **Click 'Create Load Balancer'**: Look for the create button\n3. **Configure Settings**:\n   - Name: Choose a descriptive name\n   - Algorithm: Select from Round Robin, Least Connections, or Random\n   - Instances: Add your backend servers\n\n4. **Set Health Checks**: Configure health check intervals\n5. **Deploy**: Click create to deploy your load balancer\n\nWould you like me to guide you through any specific step?",
        role: "assistant",
        timestamp: new Date(Date.now() - 1000 * 60 * 4),
        type: "loadbalancer"
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    updatedAt: new Date(Date.now() - 1000 * 60 * 4)
  },
  {
    id: "2",
    title: "Performance Metrics Analysis",
    messages: [
      {
        id: "3",
        content: "Show me the current load balancer performance",
        role: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: "text"
      },
      {
        id: "4",
        content: "Here's your current load balancer performance overview:\n\n**Active Load Balancers**: 3\n\n📊 **MyApp-LB** (Round Robin)\n- Status: ✅ Healthy\n- Instances: 4/4 healthy\n- Requests/min: 1,247\n- Avg Response: 45ms\n\n📊 **API-Gateway** (Least Connections)\n- Status: ✅ Healthy  \n- Instances: 3/3 healthy\n- Requests/min: 892\n- Avg Response: 38ms\n\n📊 **Static-Assets** (Random)\n- Status: ⚠️ Degraded\n- Instances: 2/3 healthy\n- Requests/min: 2,156\n- Avg Response: 120ms\n\nWould you like detailed metrics for any specific load balancer?",
        role: "assistant",
        timestamp: new Date(Date.now() - 1000 * 60 * 29),
        type: "loadbalancer"
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    updatedAt: new Date(Date.now() - 1000 * 60 * 29)
  }
];

const dummyResponses = [
  "I can help you with load balancer management! What would you like to know?",
  "Based on your current setup, I recommend using Round Robin algorithm for balanced distribution.",
  "Your load balancers are performing well. The average response time is 52ms across all instances.",
  "I can guide you through creating a new load balancer. Would you like to start with the configuration?",
  "Let me check your current load balancer status... All systems are operational!",
  "For better performance, consider adding more instances to your Static-Assets load balancer.",
  "I notice one of your instances is unhealthy. Would you like me to help troubleshoot this issue?"
];

export default function Chat() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(dummySessions[0]); // Start with new chat
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(dummySessions);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
  };

  // Handle suggestion click
  const handleSuggestionClick = (prompt: string) => {
    setMessage(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle sending messages with dummy responses
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

    // Simulate API delay
    setTimeout(() => {
      // Check if message is related to load balancers
      const isLBQuery = message.toLowerCase().includes("load balancer") || 
                       message.toLowerCase().includes("loadbalancer") || 
                       message.toLowerCase().includes("create") ||
                       message.toLowerCase().includes("show") ||
                       message.toLowerCase().includes("list") ||
                       message.toLowerCase().includes("performance") ||
                       message.toLowerCase().includes("metrics");

      // Get a random response or a specific one based on content
      let responseContent;
      if (isLBQuery) {
        if (message.toLowerCase().includes("create")) {
          responseContent = "I'll help you create a new load balancer!\n\n1. **Choose a name**: Pick a descriptive name for your load balancer\n2. **Select algorithm**: Round Robin, Least Connections, or Random\n3. **Add instances**: Configure your backend servers\n4. **Set health checks**: Define health check parameters\n\nWould you like me to guide you through each step?";
        } else if (message.toLowerCase().includes("show") || message.toLowerCase().includes("list")) {
          responseContent = "Here are your current load balancers:\n\n🔹 **MyApp-LB** (Round Robin)\n   - 4/4 instances healthy\n   - 1,247 req/min\n\n🔹 **API-Gateway** (Least Connections)\n   - 3/3 instances healthy\n   - 892 req/min\n\n🔹 **Static-Assets** (Random)\n   - 2/3 instances healthy ⚠️\n   - 2,156 req/min\n\nClick on any load balancer name to view detailed metrics.";
        } else if (message.toLowerCase().includes("performance") || message.toLowerCase().includes("metrics")) {
          responseContent = "📊 **Performance Overview**\n\n**Overall Health**: 92% (11/12 instances healthy)\n**Total Requests**: 4,295 req/min\n**Average Response Time**: 67ms\n**Uptime**: 99.7%\n\n**Top Performing**:\n✅ API-Gateway: 38ms avg response\n✅ MyApp-LB: 45ms avg response\n\n**Needs Attention**:\n⚠️ Static-Assets: 120ms avg response (1 instance down)\n\nWould you like detailed metrics for any specific load balancer?";
        } else {
          responseContent = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
        }
      } else {
        responseContent = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
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

      setIsLoading(false);
    }, 1500); // 1.5 second delay to simulate API call
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
            </div>
            
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
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative rounded-xl p-3 cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
                    currentSession?.id === session.id 
                      ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm' 
                      : 'hover:shadow-sm'
                  }`}
                  onClick={() => setCurrentSession(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate mb-1 text-foreground">
                        {session.title}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {session.messages.length} messages
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.updatedAt.toLocaleDateString()} • {session.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {session.id !== 'new' && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
            {currentSession?.messages.length === 0 ? (
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
              currentSession?.messages.map((msg) => (
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