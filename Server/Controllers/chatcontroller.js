import Groq from "groq-sdk";
import LoadBalancer from "../Models/LoadBalancer.js";
import ChatSession from "../Models/ChatSession.js";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper function to detect if query is load balancer related
function isLoadBalancerQuery(message) {
  const keywords = [
    'load balancer', 'loadbalancer', 'lb', 'create', 'show', 'list', 'delete', 
    'metrics', 'configure', 'instances', 'health', 'algorithm', 'round robin',
    'least connections', 'random', 'status', 'performance'
  ];
  
  return keywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Helper function to get load balancer data
async function getLoadBalancerContext(userId) {
  try {
    const loadBalancers = await LoadBalancer.find({ userId }).select('name algorithm instances metrics createdAt');
    return loadBalancers.map(lb => ({
      id: lb._id,
      name: lb.name,
      algorithm: lb.algorithm,
      instanceCount: lb.instances?.length || 0,
      healthyInstances: lb.instances?.filter(i => i.isHealthy)?.length || 0,
      totalRequests: lb.instances?.reduce((sum, i) => sum + (i.metrics?.requests || 0), 0) || 0,
      createdAt: lb.createdAt
    }));
  } catch (error) {
    console.error('Error fetching load balancer context:', error);
    return [];
  }
}

// Enhanced chat function with load balancer integration
export async function chat(c) {
  try {
    const body = await c.req.json();
    const { message, sessionId } = body;
    const user = c.get("user"); // Assuming user is set by auth middleware

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    let enhancedMessage = message;
    let contextData = null;

    // If it's a load balancer query, add context
    if (isLoadBalancerQuery(message)) {
      const lbData = await getLoadBalancerContext(user.id);
      contextData = lbData;

      enhancedMessage = `You are FlexiLB Assistant, a specialized AI for load balancer management.

Current Load Balancers:
${lbData.length > 0 ? lbData.map(lb => 
  `- ${lb.name} (${lb.algorithm}): ${lb.healthyInstances}/${lb.instanceCount} healthy instances, ${lb.totalRequests} total requests`
).join('\n') : 'No load balancers found.'}

User Query: "${message}"

Available Operations:
1. "show load balancers" / "list lb" - Display current load balancers
2. "create load balancer [name]" - Guide user through LB creation
3. "delete load balancer [name]" - Help with LB deletion
4. "show metrics for [name]" - Display performance metrics
5. "configure [name]" - Help with configuration changes
6. "health check [name]" - Show health status of instances

Please provide helpful, specific responses for load balancer management. If the user wants to perform an action, provide step-by-step instructions or direct them to the appropriate page in the FlexiLB interface.

Response Guidelines:
- Be concise and actionable
- Include specific load balancer names when relevant
- Suggest next steps when appropriate
- If data is needed, format it clearly
- Always be helpful and professional`;
    }

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: enhancedMessage }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return c.json({ 
      reply: response.choices[0].message.content,
      context: contextData,
      isLoadBalancerQuery: isLoadBalancerQuery(message)
    });
  } catch (err) {
    console.error('Chat error:', err);
    return c.json({ error: "Something went wrong" }, 500);
  }
}

// Get chat sessions for a user
export async function getChatSessions(c) {
  try {
    const user = c.get("user");
    
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const sessions = await ChatSession.find({ 
      userId: user.id, 
      isActive: true 
    })
    .select('_id title createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(50);

    return c.json({ sessions });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return c.json({ error: "Failed to fetch chat sessions" }, 500);
  }
}

// Get messages for a specific chat session
export async function getChatSession(c) {
  try {
    const user = c.get("user");
    const { sessionId } = c.req.param();
    
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const session = await ChatSession.findOne({ 
      _id: sessionId, 
      userId: user.id,
      isActive: true 
    });

    if (!session) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    return c.json({ session });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return c.json({ error: "Failed to fetch chat session" }, 500);
  }
}

// Create a new chat session
export async function createChatSession(c) {
  try {
    const user = c.get("user");
    const { title = "New Chat" } = await c.req.json();
    
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const session = new ChatSession({
      userId: user.id,
      title,
      messages: [],
    });

    await session.save();

    return c.json({ 
      session: {
        _id: session._id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.messages
      }
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return c.json({ error: "Failed to create chat session" }, 500);
  }
}

// Save message to chat session
export async function saveMessage(c) {
  try {
    const user = c.get("user");
    const { sessionId, message: messageData } = await c.req.json();
    
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const session = await ChatSession.findOne({ 
      _id: sessionId, 
      userId: user.id,
      isActive: true 
    });

    if (!session) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    session.messages.push(messageData);
    session.updatedAt = new Date();
    
    // Update title if it's the first message and it's from user
    if (session.messages.length === 1 && messageData.role === 'user') {
      session.title = messageData.content.slice(0, 50);
    }

    await session.save();

    return c.json({ success: true, session });
  } catch (error) {
    console.error('Error saving message:', error);
    return c.json({ error: "Failed to save message" }, 500);
  }
}

// Delete chat session
export async function deleteChatSession(c) {
  try {
    const user = c.get("user");
    const { sessionId } = c.req.param();
    
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId: user.id },
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return c.json({ error: "Failed to delete chat session" }, 500);
  }
}