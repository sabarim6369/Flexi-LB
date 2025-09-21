import Groq from "groq-sdk";
import LoadBalancer from "../Models/LoadBalancer.js";
import ChatSession from "../Models/ChatSession.js";
import slugify from "slugify";

const rrState = new Map();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper: Detect if message is related to Load Balancer
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

// Helper: Get current load balancer context for a user
async function getLoadBalancerContext(userId) {
  try {
    const loadBalancers = await LoadBalancer.find({ owner: userId });
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

function parseLoadBalancerCommand(message) {
  const lines = message.split(/\r?\n/).map(l => l.trim());
  const lb = { action: "create_loadbalancer", criteria: {}, parameters: { instances: [] } };
  let instanceUrl = null;
  let instanceCount = 1;

  for (let line of lines) {
    // LB name - handle both "loadbalcer name" and "loadbalancer name"
    if (/loadbalc?er\s*name\s*[:=]\s*(.+)/i.test(line)) {
      lb.criteria.name = line.match(/loadbalc?er\s*name\s*[:=]\s*(.+)/i)[1].trim();
    }

    // Algorithm - handle both "algo" and "algorithm"
    if (/(algo|algorithm)\s*[:=]\s*(\S+)/i.test(line)) {
      const algo = line.match(/(algo|algorithm)\s*[:=]\s*(\S+)/i)[2].toLowerCase();
      lb.parameters.algorithm = algo === 'roundrobin' ? 'round_robin' : 
                                algo === 'leastconn' ? 'least_conn' : 
                                algo === 'random' ? 'random' : 'round_robin';
    }

    // Instance count - handle both "instacen count" and "instance count"
    if (/(instanc?en?\s*count|instance\s*count)\s*[:=]\s*(\d+)/i.test(line)) {
      instanceCount = parseInt(line.match(/(instanc?en?\s*count|instance\s*count)\s*[:=]\s*(\d+)/i)[2], 10);
    }

    // URL
    if (/url\s*[:=]\s*(\S+)/i.test(line)) {
      instanceUrl = line.match(/url\s*[:=]\s*(\S+)/i)[1];
    }
  }

  // Populate instances array
  if (instanceUrl && instanceCount > 0) {
    lb.parameters.instances = Array(instanceCount)
      .fill(0)
      .map((_, i) => ({ 
        url: instanceUrl, 
        name: `instance${i + 1}`,
        weight: 1
      }));
  }

  return lb;
}

// Parse direct, clear commands
function parseDirectCommand(message, lbData) {
  const msg = message.toLowerCase().trim();
  const lbNames = lbData.map(lb => lb.name.toLowerCase());

  // Check for multi-line create load balancer command
  if (/create.*load\s*balancer|loadbalc?er\s*name\s*[:=]/i.test(message)) {
    const parsed = parseLoadBalancerCommand(message);
    console.log("🚀 Parsed create command:", JSON.stringify(parsed, null, 2));
    return parsed;
  }

  // Show/List commands
  if (/^(show|list|get)\s*(load\s*balancers?|lbs?)$/i.test(msg)) {
    return { action: "get_status", criteria: {}, parameters: {} };
  }

  // Delete commands
  const deleteMatch = msg.match(/^(delete|remove)\s*(load\s*balancer|lb)\s+(.+)$/i);
  if (deleteMatch) {
    const lbName = deleteMatch[3].trim();
    const exactMatch = lbData.find(lb => lb.name.toLowerCase() === lbName);
    if (exactMatch) {
      return { action: "delete_loadbalancer", criteria: { name: exactMatch.name }, parameters: {} };
    }
  }

  // Update/Edit instance URL commands - multiple patterns
  let editInstanceMatch = msg.match(/^(edit|change|update)\s+(the\s+)?(instance\s+url|url)\s+of\s+(.+?)\s+from\s+(.+?)\s+to\s+(.+)$/i);
  
  // Alternative pattern: "edit the instacne url of X from Y to Z"
  if (!editInstanceMatch) {
    editInstanceMatch = msg.match(/^(edit|change|update)\s+(the\s+)?instacne\s+url\s+of\s+(.+?)\s+from\s+(.+?)\s+to\s+(.+)$/i);
    if (editInstanceMatch) {
      // Adjust the indices since this pattern is slightly different
      editInstanceMatch = [editInstanceMatch[0], editInstanceMatch[1], editInstanceMatch[2], 'instance url', editInstanceMatch[3], editInstanceMatch[4], editInstanceMatch[5]];
    }
  }
  
  if (editInstanceMatch) {
    const lbName = editInstanceMatch[4].trim();
    let oldUrl = editInstanceMatch[5].trim();
    let newUrl = editInstanceMatch[6].trim();
    
    // Add protocol if missing
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      newUrl = 'http://' + newUrl;
    }
    
    console.log("🔍 Edit instance URL command detected:");
    console.log("  LB name:", lbName);
    console.log("  Old URL:", oldUrl);
    console.log("  New URL:", newUrl);
    
    const exactMatch = lbData.find(lb => lb.name.toLowerCase() === lbName.toLowerCase());
    if (exactMatch) {
      console.log("✅ Load balancer found:", exactMatch.name);
      return { 
        action: "update_instance", 
        criteria: { name: exactMatch.name, oldUrl: oldUrl }, 
        parameters: { newUrl: newUrl } 
      };
    } else {
      console.log("❌ Load balancer not found");
    }
  }

  // Update/Edit name commands - improved pattern matching
  const editMatch = msg.match(/^(edit|change|update|rename)\s+(the\s+)?name\s+of\s+(.+)\s+to\s+(.+)$/i);
  if (editMatch) {
    let currentNamePart = editMatch[3].trim();
    let newName = editMatch[4].trim();
    
    console.log("🔍 Edit command detected:");
    console.log("  Current name part:", currentNamePart);
    console.log("  New name:", newName);
    console.log("  Available LBs:", lbNames);
    
    // Special case: "edit the name of lastlbss fuckingboss to loadbalancer"
    // This means rename "lastlbss" (currently named "fuckingboss") to "loadbalancer"
    // The pattern is: [original_name] [current_name] to [new_name]
    const specialMatch = currentNamePart.match(/^(\w+)\s+(\w+)$/);
    if (specialMatch) {
      const [, possibleOldName, possibleCurrentName] = specialMatch;
      console.log("  Checking special case - old:", possibleOldName, "current:", possibleCurrentName);
      
      // Try to find by current name first
      let exactMatch = lbData.find(lb => lb.name.toLowerCase() === possibleCurrentName);
      if (!exactMatch) {
        // Try by old name
        exactMatch = lbData.find(lb => lb.name.toLowerCase() === possibleOldName);
      }
      
      if (exactMatch) {
        console.log("✅ Special case match found:", exactMatch.name);
        return { 
          action: "update_loadbalancer", 
          criteria: { name: exactMatch.name }, 
          parameters: { name: newName } 
        };
      }
    }
    
    // Try exact match first
    let exactMatch = lbData.find(lb => lb.name.toLowerCase() === currentNamePart);
    
    // If no exact match, try to find the load balancer name within the text
    if (!exactMatch) {
      // Split the current name part and try each combination
      const words = currentNamePart.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= words.length; j++) {
          const candidate = words.slice(i, j).join(' ');
          const match = lbData.find(lb => lb.name.toLowerCase() === candidate);
          if (match) {
            exactMatch = match;
            console.log("  Found LB:", match.name);
            break;
          }
        }
        if (exactMatch) break;
      }
    }
    
    if (exactMatch) {
      console.log("✅ Match found, creating update action");
      return { 
        action: "update_loadbalancer", 
        criteria: { name: exactMatch.name }, 
        parameters: { name: newName } 
      };
    } else {
      console.log("❌ No matching load balancer found");
    }
  }

  // Health check commands
  const healthMatch = msg.match(/^(health\s*check|check\s*health)\s+(.+)$/i);
  if (healthMatch) {
    const lbName = healthMatch[2].trim();
    const exactMatch = lbData.find(lb => lb.name.toLowerCase() === lbName);
    if (exactMatch) {
      return { action: "health_check", criteria: { name: exactMatch.name }, parameters: {} };
    }
  }

  return null;
}

// Check if command needs clarification
function needsClarification(message, lbData) {
  const msg = message.toLowerCase().trim();
  const lbNames = lbData.map(lb => lb.name);

  // Vague edit/update commands
  if (/^(edit|change|update|rename|modify)(?!\s+name\s+of\s+\w+\s+to)/i.test(msg)) {
    if (lbNames.length === 0) {
      return {
        message: "No load balancers found. Create one first using: 'create load balancer [name]'",
        options: ["create load balancer myapp"]
      };
    }
    
    // Check if this looks like a failed edit name command
    if (/(edit|change|update|rename)\s+(the\s+)?name/i.test(msg)) {
      return {
        message: "I couldn't understand which load balancer to rename. Your current load balancers are:",
        options: lbNames.map(name => `edit name of ${name} to newname`)
      };
    }
    
    return {
      message: "What would you like to edit? Please choose one of these specific commands:",
      options: lbNames.flatMap(name => [
        `edit name of ${name} to newname`,
        `update algorithm of ${name} to least_conn`,
        `edit instance url of ${name} from oldurl to newurl`,
        `add instance http://server.com to ${name}`,
        `set rate limit 100 requests per minute on ${name}`
      ])
    };
  }

  // Vague delete commands
  if (/^(delete|remove)$/i.test(msg) || /^(delete|remove)\s+(load\s*balancer|lb)$/i.test(msg)) {
    if (lbNames.length === 0) {
      return {
        message: "No load balancers found to delete.",
        options: []
      };
    }
    
    return {
      message: "Which load balancer do you want to delete? Choose one:",
      options: lbNames.map(name => `delete load balancer ${name}`)
    };
  }

  // Vague status/show commands
  if (/^(show|status|metrics)$/i.test(msg)) {
    const baseOptions = ["show load balancers"];
    if (lbNames.length > 0) {
      baseOptions.push(...lbNames.map(name => `show metrics for ${name}`));
      baseOptions.push(...lbNames.map(name => `health check ${name}`));
    }
    
    return {
      message: "What would you like to see? Choose one:",
      options: baseOptions
    };
  }

  // Partial matches that need clarification
  const partialMatches = [];
  
  // Check for partial LB name matches in edit commands
  const editPartialMatch = msg.match(/^(edit|change|update|rename)\s+.*?(\w+)/i);
  if (editPartialMatch) {
    const partialName = editPartialMatch[2];
    const matches = lbNames.filter(name => 
      name.toLowerCase().includes(partialName) || partialName.includes(name.toLowerCase())
    );
    
    if (matches.length > 1) {
      return {
        message: `Found multiple load balancers matching "${partialName}". Please be more specific:`,
        options: matches.flatMap(name => [
          `edit name of ${name} to newname`,
          `update algorithm of ${name} to least_conn`
        ])
      };
    }
    
    if (matches.length === 0 && lbNames.length > 0) {
      return {
        message: `No load balancer found matching "${partialName}". Available load balancers:`,
        options: lbNames.map(name => `edit name of ${name} to newname`)
      };
    }
  }

  return null;
}


// Main Chat Function
export async function chat(c) {
  try {
    const body = await c.req.json();
    const { message, role = "assistant", temperature = 0.7, responseFormat = "text" } = body;
    const user = c.get("user");

    if (!user) return c.json({ error: "Authentication required" }, 401);

    const lbData = await getLoadBalancerContext(user.id);
    
    // Step 1: Try to parse direct command patterns first
    const directAction = parseDirectCommand(message, lbData);
    console.log("🔍 Direct action parsed:", directAction ? JSON.stringify(directAction, null, 2) : "none");
    
    if (directAction) {
      console.log("🎯 Executing direct action...");
      const executionResult = await executeAction(directAction, user.id);
      console.log("✅ Execution result:", JSON.stringify(executionResult, null, 2));
      return c.json({
        reply: executionResult.message,
        executionResult,
        isActionExecuted: true,
        actionData: directAction
      });
    }

    // Step 2: Check if it's a vague command that needs clarification
    const clarificationNeeded = needsClarification(message, lbData);
    if (clarificationNeeded) {
      return c.json({
        reply: clarificationNeeded.message,
        suggestions: clarificationNeeded.options,
        isActionExecuted: false,
        needsClarification: true
      });
    }

    // Step 3: Use AI for complex parsing
    let aiModel = "llama-3.1-8b-instant";
    
    const systemPrompt = `You are FlexiLB Assistant. Convert user requests to JSON actions or provide helpful guidance.

Current Load Balancers:
${lbData.length > 0 ? lbData.map(lb => 
  `- ${lb.name} (${lb.algorithm}): ${lb.healthyInstances}/${lb.instanceCount} healthy instances`
).join('\n') : 'No load balancers found.'}

For action requests, return JSON with "action", "criteria", "parameters".
For general help, respond normally.

Supported actions:
- create_loadbalancer, delete_loadbalancer, update_loadbalancer, get_status, add_instance, remove_instance, health_check, set_ratelimit, remove_ratelimit

User: """${message}"""`;

    const response = await client.chat.completions.create({
      model: aiModel,
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.3,
      max_tokens: 800
    });

    const aiReply = response.choices[0].message.content;

    // Try to parse as JSON action
    try {
      const actionData = JSON.parse(aiReply);
      if (actionData.action && actionData.criteria !== undefined && actionData.parameters !== undefined) {
        const executionResult = await executeAction(actionData, user.id);
        return c.json({
          reply: executionResult.message,
          executionResult,
          isActionExecuted: true,
          actionData
        });
      }
    } catch (parseError) {
      // Not JSON, treat as regular response
    }

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
        const updateData = { ...parameters };

        // If renaming, check for conflicts and generate unique slug
        if (parameters.name) {
          // First get the current LB to get its ID
          const currentLB = await LoadBalancer.findOne({ owner: userId, name: criteria.name });
          if (!currentLB) {
            return {
              status: "error",
              message: `Load balancer "${criteria.name}" not found.`
            };
          }

          // Check if new name already exists (excluding current LB)
          const nameConflict = await LoadBalancer.findOne({
            owner: userId,
            name: parameters.name,
            _id: { $ne: currentLB._id } // Exclude current LB by ID
          });

          if (nameConflict) {
            return {
              status: "error",
              message: `Load balancer name "${parameters.name}" already exists.`
            };
          }

          // Generate unique slug
          const baseSlug = slugify(parameters.name, { lower: true, strict: true });
          let newSlug = baseSlug;
          let counter = 1;
          
          while (await LoadBalancer.findOne({ 
            slug: newSlug, 
            _id: { $ne: currentLB._id } // Exclude current LB
          })) {
            newSlug = `${baseSlug}-${counter++}`;
          }

          updateData.slug = newSlug;
          updateData.endpoint = `${process.env.BASE_URL || 'https://flexilb.onrender.com'}/proxy/${newSlug}`;
        }

        const updatedLB = await LoadBalancer.findOneAndUpdate(
          { owner: userId, name: criteria.name },
          { $set: updateData },
          { new: true }
        );

        if (updatedLB) {
          return {
            status: "success",
            message: `Load balancer "${criteria.name}" updated successfully${parameters.name ? ` to "${parameters.name}"` : ''}.`,
            data: {
              oldName: criteria.name,
              name: updatedLB.name,
              slug: updatedLB.slug,
              endpoint: updatedLB.endpoint
            }
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

      case 'update_instance':
        const updateInstanceResult = await LoadBalancer.findOneAndUpdate(
          { 
            owner: userId, 
            name: criteria.name,
            "instances.url": criteria.oldUrl 
          },
          { 
            $set: { 
              "instances.$.url": parameters.newUrl,
              "instances.$.instancename": parameters.newUrl
            }
          },
          { new: true }
        );
        
        if (updateInstanceResult) {
          return {
            status: "success",
            message: `Instance URL updated from "${criteria.oldUrl}" to "${parameters.newUrl}" in "${criteria.name}".`,
            data: {
              loadBalancer: criteria.name,
              oldUrl: criteria.oldUrl,
              newUrl: parameters.newUrl
            }
          };
        } else {
          return {
            status: "error",
            message: `Load balancer "${criteria.name}" or instance with URL "${criteria.oldUrl}" not found.`
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