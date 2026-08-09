/**
 * Health Check Tools
 * These tools provide health monitoring capabilities for load balancers and instances
 */

export const healthCheckTools = [
  {
    name: 'check_instance_health',
    description: 'Check the health status of a specific instance within a load balancer',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer',
        },
        instanceName: {
          type: 'string',
          description: 'The name of the instance to check',
        },
      },
      required: ['lbId', 'instanceName'],
    },
    handler: async (args, client) => {
      return await client.checkInstanceHealth(args.lbId, args.instanceName);
    },
  },
  {
    name: 'check_all_instances_health',
    description: 'Check the health status of all instances within a load balancer',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer',
        },
      },
      required: ['lbId'],
    },
    handler: async (args, client) => {
      return await client.checkAllInstancesHealth(args.lbId);
    },
  },
  {
    name: 'get_load_balancer_health_summary',
    description: 'Get a comprehensive health summary for a load balancer including all instances and overall status',
    inputSchema: {
      type: 'object',
      properties: {
        lbId: {
          type: 'string',
          description: 'The ID of the load balancer',
        },
      },
      required: ['lbId'],
    },
    handler: async (args, client) => {
      const lb = await client.getLoadBalancer(args.lbId);
      const instances = lb.instances || [];

      const healthyInstances = instances.filter(i => i.isHealthy);
      const unhealthyInstances = instances.filter(i => !i.isHealthy);

      return {
        loadBalancer: {
          id: lb._id,
          name: lb.name,
          algorithm: lb.algorithm,
          status: unhealthyInstances.length === 0 ? 'healthy' : 'degraded'
        },
        instances: {
          total: instances.length,
          healthy: healthyInstances.length,
          unhealthy: unhealthyInstances.length,
          healthPercentage: instances.length > 0 
            ? Math.round((healthyInstances.length / instances.length) * 100) 
            : 0
        },
        details: {
          healthyInstances: healthyInstances.map(i => ({
            name: i.name,
            url: i.url,
            lastChecked: i.lastHealthCheck
          })),
          unhealthyInstances: unhealthyInstances.map(i => ({
            name: i.name,
            url: i.url,
            lastChecked: i.lastHealthCheck
          }))
        },
        recommendations: unhealthyInstances.length > 0 ? [
          'Investigate unhealthy instances',
          'Check instance connectivity',
          'Review error logs',
          'Consider restarting unhealthy instances'
        ] : ['All instances are healthy']
      };
    },
  },
  {
    name: 'health_check_all_load_balancers',
    description: 'Perform health checks on all load balancers and return a comprehensive status report',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (args, client) => {
      const loadBalancers = await client.listLoadBalancers();

      const healthReports = await Promise.all(
        loadBalancers.map(async (lb) => {
          try {
            const instances = lb.instances || [];
            const healthyInstances = instances.filter(i => i.isHealthy);
            
            return {
              id: lb._id,
              name: lb.name,
              algorithm: lb.algorithm,
              status: healthyInstances.length === instances.length && instances.length > 0 ? 'healthy' : 
                     instances.length === 0 ? 'no_instances' : 'degraded',
              instances: {
                total: instances.length,
                healthy: healthyInstances.length,
                unhealthy: instances.length - healthyInstances.length
              },
              healthPercentage: instances.length > 0 
                ? Math.round((healthyInstances.length / instances.length) * 100) 
                : 0
            };
          } catch (error) {
            return {
              id: lb._id,
              name: lb.name,
              status: 'error',
              error: error.message
            };
          }
        })
      );

      const healthyLBs = healthReports.filter(r => r.status === 'healthy');
      const degradedLBs = healthReports.filter(r => r.status === 'degraded');
      const noInstanceLBs = healthReports.filter(r => r.status === 'no_instances');
      const errorLBs = healthReports.filter(r => r.status === 'error');

      return {
        summary: {
          total: healthReports.length,
          healthy: healthyLBs.length,
          degraded: degradedLBs.length,
          noInstances: noInstanceLBs.length,
          errors: errorLBs.length
        },
        loadBalancers: healthReports,
        overallHealth: healthReports.length > 0 && degradedLBs.length === 0 && errorLBs.length === 0 
          ? 'healthy' 
          : 'issues_detected'
      };
    },
  },
];