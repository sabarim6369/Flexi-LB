# Claude Desktop Setup for FlexiLB MCP Server

## Steps to Configure Claude Desktop

### 1. Locate Claude Desktop Config File

On Windows, the configuration file is located at:
```
%APPDATA%\Claude\claude_desktop_config.json
```

You can navigate there by:
- Pressing `Win + R`
- Type `%APPDATA%\Claude` and press Enter
- Open `claude_desktop_config.json` in a text editor

### 2. Add MCP Server Configuration

Add the following configuration to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "flexilb": {
      "command": "node",
      "args": [
        "C:\\Users\\sabar\\Documents\\Projects\\Flexi-LB\\mcp-server\\src\\index.js"
      ],
      "env": {
        "FLEXILB_API_URL": "http://localhost:3000",
        "FLEXILB_API_TOKEN": ""
      }
    }
  }
}
```

**Important:** Update the path in `args` to match your actual file path if different.

### 3. Start Your FlexiLB Server

Make sure your main FlexiLB server is running on port 3000:
```bash
cd C:\Users\sabar\Documents\Projects\Flexi-LB\Server
npm start
```

### 4. Restart Claude Desktop

Close and reopen Claude Desktop for the configuration to take effect.

### 5. Test the MCP Tools

In Claude Desktop, you can now use the following tools:

#### Load Balancer Management:
- `list_load_balancers` - List all load balancers
- `get_load_balancer` - Get specific load balancer details
- `create_load_balancer` - Create new load balancer
- `update_load_balancer` - Update load balancer configuration
- `delete_load_balancer` - Delete a load balancer
- `add_instance` - Add instance to load balancer
- `update_instance` - Update instance configuration
- `remove_instance` - Remove instance from load balancer

#### Metrics & Monitoring:
- `get_overall_metrics` - Get overall system metrics
- `get_load_balancer_metrics` - Get specific LB metrics
- `get_hourly_requests` - Get hourly request statistics
- `get_instance_performance` - Get instance performance data
- `analyze_traffic_patterns` - Analyze traffic patterns

#### Health Checks:
- `check_instance_health` - Check specific instance health
- `check_all_instances_health` - Check all instances in LB
- `get_load_balancer_health_summary` - Get comprehensive health summary
- `health_check_all_load_balancers` - Health check all LBs

#### Alert Management:
- `get_alerts` - Get all alerts with filtering
- `get_alert` - Get specific alert details
- `create_alert` - Create new alert
- `acknowledge_alert` - Acknowledge an alert
- `resolve_alert` - Resolve an alert
- `delete_alert` - Delete an alert
- `get_active_alerts_summary` - Get active alerts summary

### Example Usage in Claude Desktop

Try asking Claude:
- "Show me all my load balancers"
- "Check the health of all my load balancers"
- "Get the metrics for load balancer with ID [your-lb-id]"
- "Create a new load balancer named 'my-lb' with round-robin algorithm"
- "Analyze the traffic patterns across my load balancers"

### Troubleshooting

#### If tools don't appear:
1. Check the path in the configuration is correct
2. Make sure Node.js is installed and accessible
3. Restart Claude Desktop
4. Check Claude Desktop logs for errors

#### If API calls fail:
1. Ensure FlexiLB server is running on port 3000
2. Check if authentication is required and set `FLEXILB_API_TOKEN`
3. Verify the `FLEXILB_API_URL` is correct

#### Testing the server directly:
You can test the MCP server directly:
```bash
cd C:\Users\sabar\Documents\Projects\Flexi-LB\mcp-server
npm start
```

Then send MCP protocol messages via stdin to test the tools.