import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import cors from 'cors';
import flexilbClient from './flexilbApiClient.js';
import { loadBalancerTools } from './tools/loadBalancerTools.js';
import { metricsTools } from './tools/metricsTools.js';
import { healthCheckTools } from './tools/healthCheckTools.js';
import { alertTools } from './tools/alertTools.js';

dotenv.config();

const app = express();
const PORT = process.env.MCP_SERVER_PORT || 4000;
const HOST = process.env.MCP_SERVER_HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());

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

// Express health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'FlexiLB MCP Server' });
});

// Express tools list endpoint (for debugging)
app.get('/tools', (req, res) => {
  res.json({
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
    })),
  });
});

// Start Express server
app.listen(PORT, HOST, () => {
  console.log(`FlexiLB MCP Server running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Available tools: http://${HOST}:${PORT}/tools`);
});

// Start MCP server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FlexiLB MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});