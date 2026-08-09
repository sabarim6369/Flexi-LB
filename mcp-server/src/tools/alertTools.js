/**
 * Alert Management Tools
 * These tools call the existing FlexiLB alert API endpoints
 */

export const alertTools = [
  {
    name: 'get_alerts',
    description: 'Get all alerts for the current user with optional filtering and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'acknowledged', 'resolved'],
          description: 'Filter by alert status',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Filter by severity level',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of alerts to return',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination',
        },
      },
    },
    handler: async (args, client) => {
      return await client.getAlerts(args);
    },
  },
  {
    name: 'get_alert',
    description: 'Get detailed information about a specific alert by ID',
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert to retrieve',
        },
      },
      required: ['alertId'],
    },
    handler: async (args, client) => {
      return await client.getAlert(args.alertId);
    },
  },
  {
    name: 'create_alert',
    description: 'Create a new alert with specified conditions and thresholds',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the alert',
        },
        loadBalancerId: {
          type: 'string',
          description: 'ID of the load balancer to monitor',
        },
        type: {
          type: 'string',
          enum: ['error_rate', 'response_time', 'request_count', 'instance_health'],
          description: 'Type of metric to monitor',
        },
        threshold: {
          type: 'number',
          description: 'Threshold value for triggering the alert',
        },
        condition: {
          type: 'string',
          enum: ['greater_than', 'less_than', 'equals'],
          description: 'Condition for threshold comparison',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Severity level of the alert',
        },
        description: {
          type: 'string',
          description: 'Description of the alert',
        },
      },
      required: ['name', 'loadBalancerId', 'type', 'threshold', 'condition', 'severity'],
    },
    handler: async (args, client) => {
      return await client.createAlert(args);
    },
  },
  {
    name: 'acknowledge_alert',
    description: 'Acknowledge an alert to indicate it has been seen and is being addressed',
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert to acknowledge',
        },
      },
      required: ['alertId'],
    },
    handler: async (args, client) => {
      return await client.acknowledgeAlert(args.alertId);
    },
  },
  {
    name: 'resolve_alert',
    description: 'Resolve an alert when the issue has been fixed',
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert to resolve',
        },
      },
      required: ['alertId'],
    },
    handler: async (args, client) => {
      return await client.resolveAlert(args.alertId);
    },
  },
  {
    name: 'delete_alert',
    description: 'Delete an alert permanently',
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert to delete',
        },
      },
      required: ['alertId'],
    },
    handler: async (args, client) => {
      return await client.deleteAlert(args.alertId);
    },
  },
  {
    name: 'get_active_alerts_summary',
    description: 'Get a summary of all active alerts grouped by severity and load balancer',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (args, client) => {
      const alerts = await client.getAlerts({ status: 'active' });

      const alertsBySeverity = {
        critical: alerts.filter(a => a.severity === 'critical'),
        high: alerts.filter(a => a.severity === 'high'),
        medium: alerts.filter(a => a.severity === 'medium'),
        low: alerts.filter(a => a.severity === 'low')
      };

      const alertsByLoadBalancer = {};
      alerts.forEach(alert => {
        if (!alertsByLoadBalancer[alert.loadBalancerId]) {
          alertsByLoadBalancer[alert.loadBalancerId] = [];
        }
        alertsByLoadBalancer[alert.loadBalancerId].push(alert);
      });

      return {
        total: alerts.length,
        bySeverity: {
          critical: alertsBySeverity.critical.length,
          high: alertsBySeverity.high.length,
          medium: alertsBySeverity.medium.length,
          low: alertsBySeverity.low.length
        },
        byLoadBalancer: Object.keys(alertsByLoadBalancer).map(lbId => ({
          loadBalancerId: lbId,
          count: alertsByLoadBalancer[lbId].length,
          alerts: alertsByLoadBalancer[lbId]
        })),
        recentAlerts: alerts.slice(0, 5).map(alert => ({
          id: alert._id,
          name: alert.name,
          severity: alert.severity,
          createdAt: alert.createdAt
        }))
      };
    },
  },
];