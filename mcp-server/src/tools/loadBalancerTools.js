/**
 * Load Balancer Management Tools
 * These tools call the existing FlexiLB API endpoints
 */

export const loadBalancerTools = [
  {
    name: 'list_load_balancers',
    description: 'List all load balancers for the current user with their basic information',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (args, client) => {
      return await client.listLoadBalancers();
    },
  },
  {
    name: 'get_load_balancer',
    description: 'Get detailed information about a specific load balancer by ID',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer to retrieve',
        },
      },
      required: ['lbId'],
    },
    handler: async (args, client) => {
      return await client.getLoadBalancer(args.lbId);
    },
  },
  {
    name: 'create_load_balancer',
    description: 'Create a new load balancer with specified configuration',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the load balancer',
        },
        algorithm: {
          type: 'string',
          enum: ['round_robin', 'least_conn', 'random'],
          description: 'Load balancing algorithm to use',
        },
        instances: {
          type: 'array',
          description: 'Array of instances to add to the load balancer',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Instance URL' },
              name: { type: 'string', description: 'Instance name' },
              weight: { type: 'number', description: 'Instance weight' },
            },
          },
        },
      },
      required: ['name', 'algorithm'],
    },
    handler: async (args, client) => {
      return await client.createLoadBalancer(args);
    },
  },
  {
    name: 'update_load_balancer',
    description: 'Update an existing load balancer configuration',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer to update',
        },
        name: {
          type: 'string',
          description: 'New name for the load balancer',
        },
        algorithm: {
          type: 'string',
          enum: ['round_robin', 'least_conn', 'random'],
          description: 'New load balancing algorithm',
        },
      },
      required: ['lbId'],
    },
    handler: async (args, client) => {
      const { lbId, ...updateData } = args;
      return await client.updateLoadBalancer(lbId, updateData);
    },
  },
  {
    name: 'delete_load_balancer',
    description: 'Delete a load balancer by ID',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer to delete',
        },
      },
      required: ['lbId'],
    },
    handler: async (args, client) => {
      return await client.deleteLoadBalancer(args.lbId);
    },
  },
  {
    name: 'add_instance',
    description: 'Add a new instance to an existing load balancer',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer',
        },
        url: {
          type: 'string',
          description: 'URL of the instance to add',
        },
        name: {
          type: 'string',
          description: 'Name for the instance',
        },
        weight: {
          type: 'number',
          description: 'Weight for the instance (default: 1)',
        },
      },
      required: ['lbId', 'url', 'name'],
    },
    handler: async (args, client) => {
      const { lbId, ...instanceData } = args;
      return await client.addInstance(lbId, instanceData);
    },
  },
  {
    name: 'update_instance',
    description: 'Update an existing instance in a load balancer',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer',
        },
        instanceName: {
          type: 'string',
          description: 'Current name of the instance to update',
        },
        url: {
          type: 'string',
          description: 'New URL for the instance',
        },
        name: {
          type: 'string',
          description: 'New name for the instance',
        },
        weight: {
          type: 'number',
          description: 'New weight for the instance',
        },
      },
      required: ['lbId', 'instanceName'],
    },
    handler: async (args, client) => {
      const { lbId, ...instanceData } = args;
      return await client.updateInstance(lbId, instanceData);
    },
  },
  {
    name: 'remove_instance',
    description: 'Remove an instance from a load balancer',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer',
        },
        instanceName: {
          type: 'string',
          description: 'Name of the instance to remove',
        },
      },
      required: ['lbId', 'instanceName'],
    },
    handler: async (args, client) => {
      return await client.removeInstance(args.lbId, { instanceName: args.instanceName });
    },
  },
];