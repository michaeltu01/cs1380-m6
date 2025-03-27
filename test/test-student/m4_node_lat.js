const { performance } = require('perf_hooks');
const { randomBytes } = require('crypto');
const distribution = require('@brown-ds/distribution');

const NUM_OBJECTS = 1000;
const GROUP_NAME = 'local-benchmark';

// AWS nodes
const localNodes = {
  n1: { ip: '127.0.0.1', port: 1237 },
  n2: { ip: '127.0.0.1', port: 1235 },
  n3: { ip: '127.0.0.1', port: 1236 }
};

function generateRandomString(length) {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

function generateRandomObject() {
  return {
    id: generateRandomString(8),
    name: generateRandomString(15),
    value: generateRandomString(20),
    timestamp: Date.now(),
    nested: {
      field1: Math.random() * 100,
      field2: generateRandomString(10),
      field3: [
        generateRandomString(5),
        generateRandomString(5),
        generateRandomString(5)
      ]
    }
  };
}

function generateKeyValuePairs(count) {
  console.log(`Generating ${count} random key-value pairs...`);
  const pairs = [];
  for (let i = 0; i < count; i++) {
    pairs.push({
      key: `key-${generateRandomString(8)}-${i}`,
      value: generateRandomObject()
    });
  }
  return pairs;
}

function testNodesConnection(callback) {
  console.log('Testing connection to local nodes...');
  
  let checkedNodes = 0;
  let runningNodes = 0;
  
  Object.entries(localNodes).forEach(([name, node]) => {
    const remote = { 
      node: node, 
      service: 'status', 
      method: 'get' 
    };
    
    distribution.local.comm.send(['sid'], remote, (error, result) => {
      checkedNodes++;
      
      if (error) {
        console.error(`Node ${name} (${node.ip}:${node.port}) is not running:`, error.message);
      } else {
        console.log(`Node ${name} (${node.ip}:${node.port}) is running with SID: ${result}`);
        runningNodes++;
      }
      
      if (checkedNodes === Object.keys(localNodes).length) {
        if (runningNodes === Object.keys(localNodes).length) {
          console.log('All nodes are running!');
          callback(null);
        } else {
          callback(new Error(`Only ${runningNodes}/${Object.keys(localNodes).length} nodes are running`));
        }
      }
    });
  });
}


function setupGroup(callback) {
  console.log('Creating group with local nodes...');
  
  const groupNodes = {};
  Object.values(localNodes).forEach(node => {
    const sid = distribution.util.id.getSID(node);
    groupNodes[sid] = node;
  });
  
  const groupConfig = { gid: GROUP_NAME };
  
  // create the group with local nodes
  distribution.local.groups.put(groupConfig, groupNodes, (error, result) => {
    if (error) {
      return callback(error);
    }
    
    // init the group on each node
    distribution[GROUP_NAME].groups.put(groupConfig, groupNodes, (error, result) => {
      if (JSON.stringify(error) !== JSON.stringify({})) {
        return callback(error);
      }
      console.log('Group setup complete.');
      callback(null);
    });
  });
}

function insertPairs(pairs, callback) {
  console.log(`Starting insertion of ${pairs.length} key-value pairs...`);
  
  const startTime = performance.now();
  let completed = 0;
  let errors = 0;
  const latencies = [];
  
  pairs.forEach((pair, index) => {
    const itemStartTime = performance.now();
    
    distribution[GROUP_NAME].store.put(pair.value, pair.key, (error, result) => {
      const itemEndTime = performance.now();
      const latency = itemEndTime - itemStartTime;
      latencies.push(latency);
      
      if (error) {
        errors++;
        console.error(`Error inserting pair ${index}: ${error.message}`);
      }
      
      completed++;
      if (completed === pairs.length) {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        const totalSuccessful = completed - errors;
        const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
        const throughput = (totalSuccessful / totalTime) * 1000; // ops per second
        
        console.log('\n--- Insertion Performance ---');
        console.log(`Total time: ${totalTime.toFixed(2)} ms`);
        console.log(`Successful operations: ${totalSuccessful}/${pairs.length}`);
        console.log(`Average latency: ${avgLatency.toFixed(2)} ms`);
        console.log(`Throughput: ${throughput.toFixed(2)} ops/sec`);
        
        callback(null, { 
          totalTime, 
          avgLatency, 
          throughput, 
          errors 
        });
      }
    });
  });
}

function retrievePairs(pairs, callback) {
  console.log(`\nStarting retrieval of ${pairs.length} key-value pairs...`);
  
  const startTime = performance.now();
  let completed = 0;
  let errors = 0;
  const latencies = [];
  
  pairs.forEach((pair, index) => {
    const itemStartTime = performance.now();
    
    distribution[GROUP_NAME].store.get(pair.key, (error, result) => {
      const itemEndTime = performance.now();
      const latency = itemEndTime - itemStartTime;
      latencies.push(latency);
      
      if (error) {
        errors++;
        console.error(`Error retrieving pair ${index}: ${error.message}`);
      } else {
        if (JSON.stringify(result) !== JSON.stringify(pair.value)) {
          console.warn(`Warning: Retrieved value doesn't match original for key ${pair.key}`);
        }
      }
      
      completed++;
      if (completed === pairs.length) {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        const totalSuccessful = completed - errors;
        const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
        const throughput = (totalSuccessful / totalTime) * 1000; // ops per second
        
        console.log('\n--- Retrieval Performance ---');
        console.log(`Total time: ${totalTime.toFixed(2)} ms`);
        console.log(`Successful operations: ${totalSuccessful}/${pairs.length}`);
        console.log(`Average latency: ${avgLatency.toFixed(2)} ms`);
        console.log(`Throughput: ${throughput.toFixed(2)} ops/sec`);
        
        callback(null, { 
          totalTime, 
          avgLatency, 
          throughput, 
          errors 
        });
      }
    });
  });
}

function runBenchmark(callback) {
  testNodesConnection((error) => {
    if (error) {
      console.error('Connection test failed:', error.message);
      process.exit(1);
    }
    
    setupGroup((error) => {
      if (error) {
        console.error('Error setting up group:', error);
        process.exit(1);
      }
      
      const pairs = generateKeyValuePairs(NUM_OBJECTS);
      console.log(`Generated ${pairs.length} key-value pairs.`);
      
      insertPairs(pairs, (error, insertPerf) => {
        if (error) {
          console.error('Error inserting pairs:', error);
          process.exit(1);
        }
        
        retrievePairs(pairs, (error, retrievePerf) => {
          if (error) {
            console.error('Error retrieving pairs:', error);
            process.exit(1);
          }
          
          console.log('\n--- Performance Summary ---');
          console.log(`Average latency - Insert: ${insertPerf.avgLatency.toFixed(2)} ms, Retrieve: ${retrievePerf.avgLatency.toFixed(2)} ms`);
          console.log(`Throughput - Insert: ${insertPerf.throughput.toFixed(2)} ops/sec, Retrieve: ${retrievePerf.throughput.toFixed(2)} ops/sec`);
          
          console.log('\nBenchmark completed successfully.');
          callback(null);
        });
      });
    });
  });
}

distribution.node.start((server) => {
  console.log('Benchmark client node started');
  
  runBenchmark(() => {
    server.close(() => {
      console.log('Benchmark client stopped');
      process.exit(0);
    });
  });
});