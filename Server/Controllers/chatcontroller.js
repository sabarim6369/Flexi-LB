import Groq from "groq-sdk";
import LoadBalancer from "../Models/LoadBalancer.js";
import ChatSession from "../Models/ChatSession.js";
import slugify from "slugify";

const rrState = new Map();

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
    console.log(userId)
const loadBalancers = await LoadBalancer.find({ owner: userId });
    console.log(loadBalancers)
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

function needsActionExecution(message) {
  const actionKeywords = [
    'create', 'delete', 'remove', 'add instance', 'set rate', 'disable rate',
    'update', 'configure', 'health check'
  ];
  
  return actionKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}

export async function chat(c) {
  try {
    const body = await c.req.json();
    const { message, role = "assistant", temperature = 0.7, responseFormat = "text" } = body;
    const user = c.get("user"); // Assuming user is set by auth middleware

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    let systemPrompt = "";
    let aiModel = "llama-3.1-8b-instant";
    let aiTemperature = temperature;
    
    // Auto-detect if we need JSON action mode
    const shouldUseJsonMode = role === "JSON Responder" || responseFormat === "json" || needsActionExecution(message);

    if (shouldUseJsonMode) {
     
      systemPrompt = `You are FlexiLB AI. Convert user queries into JSON actions for load balancer management.

Supported actions:
- create_loadbalancer: Create new load balancer
- delete_loadbalancer: Delete existing load balancer  
- update_loadbalancer: Modify load balancer settings
- get_status: Get load balancer status/metrics
- add_instance: Add backend instance to load balancer
- remove_instance: Remove backend instance
- health_check: Check health of instances
- set_ratelimit: Set rate limiting on load balancer
- remove_ratelimit: Remove rate limiting from load balancer
- update_ratelimit: Update rate limit settings

Examples:
- "create lb named myapp" → {"action": "create_loadbalancer", "criteria": {"name": "myapp"}, "parameters": {"algorithm": "round_robin"}}
- "create loadbalancer mcplb roundrobin algorithm instacecount 1 url http://localhost:8080/chat" → {"action": "create_loadbalancer", "criteria": {"name": "mcplb"}, "parameters": {"algorithm": "round_robin", "instances": [{"url": "http://localhost:8080/chat", "id": "instance1"}]}}
- "delete lb myapp" → {"action": "delete_loadbalancer", "criteria": {"name": "myapp"}}
- "set rate limit 100 requests per minute on myapp" → {"action": "set_ratelimit", "criteria": {"name": "myapp"}, "parameters": {"limit": 100, "window": 60}}
- "add instance http://server1.com to myapp" → {"action": "add_instance", "criteria": {"name": "myapp"}, "parameters": {"instance": {"url": "http://server1.com", "id": "server1"}}}
- "health check myapp" → {"action": "health_check", "criteria": {"name": "myapp"}}
- "show load balancers" → {"action": "get_status", "criteria": {}}

Always return valid JSON with this structure:
{
  "action": "action_name",
  "criteria": {
    "name": "lb-name"
  },
  "parameters": {
    "key": "value"
  }
}

Return only JSON, no explanations.`;

      aiTemperature = 0.1; // Low temperature for structured output
    } else {
      // Regular chat mode with load balancer context
      const lbData = await getLoadBalancerContext(user.id);
      
      systemPrompt = `You are FlexiLB Assistant, a specialized AI for load balancer management.

Current Load Balancers:
${lbData.length > 0 ? lbData.map(lb => 
  `- ${lb.name} (${lb.algorithm}): ${lb.healthyInstances}/${lb.instanceCount} healthy instances, ${lb.totalRequests} total requests`
).join('\n') : 'No load balancers found.'}

Available Operations:
1. "show load balancers" / "list lb" - Display current load balancers
2. "create load balancer [name]" - Guide user through LB creation
3. "delete load balancer [name]" - Help with LB deletion
4. "show metrics for [name]" - Display performance metrics
5. "configure [name]" - Help with configuration changes
6. "health check [name]" - Show health status of instances

Please provide helpful, specific responses for load balancer management. Be concise and actionable.`;
    }

    const response = await client.chat.completions.create({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: aiTemperature,
      max_tokens: shouldUseJsonMode ? 500 : 1000,
    });

    const aiReply = response.choices[0].message.content;

    // If expecting JSON response, try to execute the action
    if (shouldUseJsonMode) {
      try {
        const actionData = JSON.parse(aiReply);
        const executionResult = await executeAction(actionData, user.id);
        
        return c.json({
          reply: aiReply,
          action: actionData,
          executionResult,
          isActionExecuted: true
        });
      } catch (parseError) {
        console.error('Failed to parse AI JSON response:', parseError);
        return c.json({
          reply: aiReply,
          error: "AI returned invalid JSON format",
          isActionExecuted: false
        });
      }
    }

    // Regular chat response
    return c.json({ 
      reply: aiReply,
      isActionExecuted: false
    });
  } catch (err) {
    console.error('Chat error:', err);
    return c.json({ error: "Something went wrong" }, 500);
  }
}

// Execute AI-generated actions
async function executeAction(actionData, userId) {
  try {
    const { action, criteria, parameters } = actionData;

    switch (action) {
      case 'delete_loadbalancer':
        const deleteResult = await LoadBalancer.findOneAndDelete({
          owner: userId,
          name: criteria.name
        });
        
        if (deleteResult) {
          return {
            status: "success",
            message: `Load balancer "${criteria.name}" deleted successfully.`
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" not found.`
          };
        }

      case 'create_loadbalancer':
        // Validate input
        if (!criteria.name || (parameters?.instances && parameters.instances.length === 0)) {
          return {
            status: "error",
            message: "Invalid body: name is required and instances cannot be empty if provided"
          };
        }

        // Check if LB with same name already exists
        const existingLB = await LoadBalancer.findOne({
          owner: userId,
          name: criteria.name
        });
        
        if (existingLB) {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" already exists.`
          };
        }

        // Generate unique slug
        const baseSlug = slugify(criteria.name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        while (await LoadBalancer.findOne({ slug })) {
          slug = `${baseSlug}-${counter++}`;
        }

        // Prepare instances data
        const instances = parameters?.instances ? parameters.instances.map((inst, i) => ({
          id: `inst-${Date.now()}-${i}`,
          url: inst.url,
          weight: inst.weight ?? 1,
          instancename: inst.name || inst.url
        })) : [];

        // Create load balancer
        let lb = await LoadBalancer.create({
          name: criteria.name,
          owner: userId,
          slug,
          algorithm: parameters?.algorithm || 'round_robin',
          instances,
          endpoint: "temp"
        });

        // Set proper endpoint
        const BASE_URL = process.env.BASE_URL || "https://flexilb.onrender.com";
        lb.endpoint = `${BASE_URL}/proxy/${slug}`;
        await lb.save();

        // Initialize round robin state
        rrState.set(String(lb._id), 0);
        
        return {
          status: "success",
          message: `Load balancer "${criteria.name}" created successfully.`,
          data: {
            name: lb.name,
            endpoint: lb.endpoint,
            slug: lb.slug,
            algorithm: lb.algorithm,
            instances: lb.instances.length
          }
        };

      case 'get_status':
        const loadBalancers = criteria.name 
          ? await LoadBalancer.find({ owner: userId, name: criteria.name })
          : await LoadBalancer.find({ owner: userId });
        
        if (loadBalancers.length === 0) {
          return {
            status: "success",
            message: criteria.name ? `Load balancer "${criteria.name}" not found.` : "No load balancers found.",
            data: []
          };
        }

        const lbStatus = loadBalancers.map(lb => ({
          name: lb.name,
          algorithm: lb.algorithm,
          instances: lb.instances.length,
          healthy: lb.instances.filter(i => i.isHealthy).length,
          endpoint: lb.endpoint,
          rateLimit: lb.rateLimiterOn ? `${lb.rateLimiter.limit}/${lb.rateLimiter.window}s` : 'Off'
        }));

        return {
          status: "success",
          message: `Found ${loadBalancers.length} load balancer(s).`,
          data: lbStatus
        };

      case 'update_loadbalancer':
        const updateResult = await LoadBalancer.findOneAndUpdate(
          { owner: userId, name: criteria.name },
          { $set: parameters },
          { new: true }
        );
        
        if (updateResult) {
          return {
            status: "success",
            message: `Load balancer "${criteria.name}" updated successfully.`
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" not found.`
          };
        }

      case 'add_instance':
        const instance = {
          id: parameters.instance.id || `instance-${Date.now()}`,
          url: parameters.instance.url,
          instancename: parameters.instance.name || parameters.instance.url,
          isHealthy: true,
          healthStatus: "healthy",
          weight: parameters.instance.weight || 1,
          metrics: {
            requests: 0,
            failures: 0,
            totalLatencyMs: 0,
            lastLatency: 0,
            hourlyRequests: {}
          }
        };

        const addResult = await LoadBalancer.findOneAndUpdate(
          { owner: userId, name: criteria.name },
          { $push: { instances: instance } },
          { new: true }
        );
        
        if (addResult) {
          return {
            status: "success",
            message: `Instance "${instance.url}" added to "${criteria.name}".`
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" not found.`
          };
        }

      case 'remove_instance':
        const removeResult = await LoadBalancer.findOneAndUpdate(
          { owner: userId, name: criteria.name },
          { $pull: { instances: { url: criteria.instanceUrl || parameters.url } } },
          { new: true }
        );
        
        if (removeResult) {
          return {
            status: "success",
            message: `Instance removed from "${criteria.name}".`
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" not found.`
          };
        }

      case 'set_ratelimit':
        const rateLimitResult = await LoadBalancer.findOneAndUpdate(
          { owner: userId, name: criteria.name },
          { 
            $set: { 
              rateLimiterOn: true,
              'rateLimiter.limit': parameters.limit || 100,
              'rateLimiter.window': parameters.window || 60
            }
          },
          { new: true }
        );
        
        if (rateLimitResult) {
          return {
            status: "success",
            message: `Rate limit set to ${parameters.limit || 100} requests per ${parameters.window || 60} seconds on "${criteria.name}".`
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" not found.`
          };
        }

      case 'remove_ratelimit':
        const removeRateLimitResult = await LoadBalancer.findOneAndUpdate(
          { owner: userId, name: criteria.name },
          { $set: { rateLimiterOn: false } },
          { new: true }
        );
        
        if (removeRateLimitResult) {
          return {
            status: "success",
            message: `Rate limiting disabled on "${criteria.name}".`
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" not found.`
          };
        }

      case 'update_ratelimit':
        const updateRateLimitResult = await LoadBalancer.findOneAndUpdate(
          { owner: userId, name: criteria.name },
          { 
            $set: { 
              'rateLimiter.limit': parameters.limit,
              'rateLimiter.window': parameters.window
            }
          },
          { new: true }
        );
        
        if (updateRateLimitResult) {
          return {
            status: "success",
            message: `Rate limit updated to ${parameters.limit} requests per ${parameters.window} seconds on "${criteria.name}".`
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" not found.`
          };
        }

      case 'health_check':
        const healthLB = await LoadBalancer.findOne({ owner: userId, name: criteria.name });
        if (healthLB) {
          const totalInstances = healthLB.instances.length;
          const healthyInstances = healthLB.instances.filter(i => i.isHealthy).length;
          const unhealthyInstances = totalInstances - healthyInstances;
          
          let healthMessage = `Health check for "${criteria.name}": ${healthyInstances}/${totalInstances} instances healthy.`;
          if (unhealthyInstances > 0) {
            healthMessage += ` ${unhealthyInstances} instance(s) need attention.`;
          }
          
          return {
            status: "success",
            message: healthMessage,
            data: {
              name: healthLB.name,
              totalInstances,
              healthyInstances,
              unhealthyInstances
            }
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" not found.`
          };
        }

      default:
        return {
          status: "error",
          message: `Unsupported action: ${action}`
        };
    }
  } catch (error) {
    console.error('Action execution error:', error);
    return {
      status: "error",
      message: "Failed to execute action",
      details: error.message
    };
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