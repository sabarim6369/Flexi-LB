// Test the parse function directly
function parseLoadBalancerCommand(message) {
  const lines = message.split(/\r?\n/).map(l => l.trim());
  const lb = { action: "create_loadbalancer", criteria: {}, parameters: { instances: [] } };
  let instanceUrl = null;
  let instanceCount = 1;

  console.log("📝 Parsing lines:", lines);

  for (let line of lines) {
    console.log("🔍 Processing line:", line);
    
    // LB name - handle both "loadbalcer name" and "loadbalancer name"
    if (/loadbalc?er\s*name\s*[:=]\s*(.+)/i.test(line)) {
      lb.criteria.name = line.match(/loadbalc?er\s*name\s*[:=]\s*(.+)/i)[1].trim();
      console.log("✅ Found name:", lb.criteria.name);
    }

    // Algorithm - handle both "algo" and "algorithm"
    if (/(algo|algorithm)\s*[:=]\s*(\S+)/i.test(line)) {
      const algo = line.match(/(algo|algorithm)\s*[:=]\s*(\S+)/i)[2].toLowerCase();
      lb.parameters.algorithm = algo === 'roundrobin' ? 'round_robin' : 
                                algo === 'leastconn' ? 'least_conn' : 
                                algo === 'random' ? 'random' : 'round_robin';
      console.log("✅ Found algorithm:", lb.parameters.algorithm);
    }

    // Instance count - handle both "instacen count" and "instance count"
    if (/(instanc?en?\s*count|instance\s*count)\s*[:=]\s*(\d+)/i.test(line)) {
      instanceCount = parseInt(line.match(/(instanc?en?\s*count|instance\s*count)\s*[:=]\s*(\d+)/i)[2], 10);
      console.log("✅ Found instance count:", instanceCount);
    }

    // URL
    if (/url\s*[:=]\s*(\S+)/i.test(line)) {
      instanceUrl = line.match(/url\s*[:=]\s*(\S+)/i)[1];
      console.log("✅ Found URL:", instanceUrl);
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
    console.log("✅ Created instances:", lb.parameters.instances);
  }

  console.log("🎯 Final parsed result:", JSON.stringify(lb, null, 2));
  return lb;
}

// Test with your exact message
const testMessage = `create a loadbalancer named

loadbalcer name :lastlbssssssssss

algo:roundrobin

instacen count:2

url:http://localhost:8080/chat

create it without confirmation`;

console.log("🧪 Testing parse function...");
parseLoadBalancerCommand(testMessage);