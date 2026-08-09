/**
 * Metrics and Monitoring Tools
 * These tools call the existing FlexiLB metrics API endpoints
 */

export const metricsTools = [
  {
    name: 'get_overall_metrics',
    description: 'Get overall metrics for all load balancers including total requests, success rate, and performance data',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (args, client) => {
      return await client.getOverallMetrics();
    },
  },
  {
    name: 'get_load_balancer_metrics',
    description: 'Get detailed metrics for a specific load balancer including request counts, response times, and error rates',
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
      return await client.getLoadBalancerMetrics(args.lbId);
    },
  },
  {
    name: 'get_hourly_requests',
    description: 'Get hourly request statistics for a specific load balancer to analyze traffic patterns',
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
      return await client.getHourlyRequests(args.lbId);
    },
  },
  {
    name: 'get_instance_performance',
    description: 'Get performance metrics for individual instances within a load balancer',
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

      return {
        loadBalancer: lb.name,
        instances: instances.map(instance => ({
          name: instance.name,
          url: instance.url,
          isHealthy: instance.isHealthy,
          metrics: instance.metrics || {
            requests: 0,
            errors: 0,
            avgResponseTime: 0,
            successRate: 0
          },
          weight: instance.weight || 1
        })),
        summary: {
          totalInstances: instances.length,
          healthyInstances: instances.filter(i => i.isHealthy).length,
          totalRequests: instances.reduce((sum, i) => sum + (i.metrics?.requests || 0), 0),
          totalErrors: instances.reduce((sum, i) => sum + (i.metrics?.errors || 0), 0)
        }
      };
    },
  },
  {
    name: 'analyze_traffic_patterns',
    description: 'Analyze traffic patterns across all load balancers to identify trends and anomalies',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['hourly', 'daily', 'weekly'],
          description: 'Timeframe for analysis (default: hourly)',
        },
      },
    },
    handler: async (args, client) => {
      const overallMetrics = await client.getOverallMetrics();
      const loadBalancers = await client.listLoadBalancers();

      // Gather hourly data for each load balancer
      const trafficData = await Promise.all(
        loadBalancers.map(async (lb) => {
          try {
            const hourlyData = await client.getHourlyRequests(lb._id);
            return {
              name: lb.name,
              id: lb._id,
              hourlyData: hourlyData || []
            };
          } catch (error) {
            return {
              name: lb.name,
              id: lb._id,
              hourlyData: [],
              error: error.message
            };
          }
        })
      );

      return {
        overallMetrics,
        trafficData,
        analysis: {
          totalLoadBalancers: loadBalancers.length,
          activeLoadBalancers: loadBalancers.filter(lb => lb.instances?.length > 0).length,
          timeframe: args.timeframe || 'hourly'
        }
      };
    },
  },
];