import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import flexilbClient from './flexilbApiClient.js';
import { loadBalancerTools } from './tools/loadBalancerTools.js';
import { metricsTools } from './tools/metricsTools.js';
import { healthCheckTools } from './tools/healthCheckTools.js';
import { alertTools } from './tools/alertTools.js';

// Suppress all console output to avoid stdio pollution
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
console.log = () => {};
console.error = () => {};
console.warn = () => {};

// Create MCP Server
const server = new Server(
  {
    name: 'flexilb-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Combine all tools
const allTools = [
  ...loadBalancerTools,
  ...metricsTools,
  ...healthCheckTools,
  ...alertTools
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = allTools.find(t => t.name === name);
  if (!tool) {
    throw new Error(`Tool ${name} not found`);
  }

  try {
    const result = await tool.handler(args, flexilbClient);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start MCP server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});