const distribution = require('../../config.js');
const { performance, PerformanceObserver } = require('perf_hooks');
const id = distribution.util.id;

const perfTestGroup = {};
const testSize = 200;

const n1 = {ip: '127.0.0.1', port: 7701};
const n2 = {ip: '127.0.0.1', port: 7702};
const n3 = {ip: '127.0.0.1', port: 7703};

const mapper = (key, value) => {
  const words = value.split(/\s+/).filter(word => word.length > 0);
  const results = [];
  
  words.forEach(word => {
    const out = {};
    out[word.toLowerCase()] = 1;
    results.push(out);
  });
  
  return results;
};

const reducer = (key, values) => {
  const out = {};
  out[key] = values.reduce((sum, value) => sum + value, 0);
  return out;
};

function generateTestData(size) {
  const loremIpsum = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum";
  const words = loremIpsum.split(/\s+/);
  
  const dataset = [];
  for (let i = 0; i < size; i++) {
    // create documents with varying lengths
    const docLength = 10 + Math.floor(Math.random() * 90);
    let docContent = "";
    
    for (let j = 0; j < docLength; j++) {
      const wordIndex = Math.floor(Math.random() * words.length);
      docContent += words[wordIndex] + " ";
    }
    
    const doc = {};
    doc[`doc${i}`] = docContent.trim();
    dataset.push(doc);
  }
  
  return dataset;
}

function cleanupCluster(localServer) {
  const remote = {service: 'status', method: 'stop'};
  
  remote.node = n1;
  distribution.local.comm.send([], remote, () => {
    remote.node = n2;
    distribution.local.comm.send([], remote, () => {
      remote.node = n3;
      distribution.local.comm.send([], remote, () => {
        if (localServer) {
          localServer.close();
        }
      });
    });
  });
}

function setupAndRun() {
  let localServer = null;
  
  perfTestGroup[id.getSID(n1)] = n1;
  perfTestGroup[id.getSID(n2)] = n2;
  perfTestGroup[id.getSID(n3)] = n3;
  
  distribution.node.start((server) => {
    localServer = server;
    
    distribution.local.status.spawn(n1, () => {
      distribution.local.status.spawn(n2, () => {
        distribution.local.status.spawn(n3, () => {
          
          const perfTestConfig = {gid: 'perfTest'};
          distribution.local.groups.put(perfTestConfig, perfTestGroup, () => {
            distribution.perfTest.groups.put(perfTestConfig, perfTestGroup, () => {
              runBenchmark(localServer);
            });
          });
        });
      });
    });
  });
}

function runBenchmark(localServer) {
  let performanceResults = null;
  let mapReduceCompleted = false;
    
  const obs = new PerformanceObserver((items) => {
    const entry = items.getEntries()[0];
    const executionTime = entry.duration;
    const avgLatency = executionTime / testSize; // ms per document
    const throughput = (testSize / executionTime) * 1000; // documents per second
    
    performanceResults = {
      executionTime: executionTime.toFixed(2),
      avgLatency: avgLatency.toFixed(2),
      throughput: throughput.toFixed(2)
    };
    
    obs.disconnect();
    
    if (mapReduceCompleted) {
      finishBenchmark(performanceResults, localServer);
    }
  });
  
  obs.observe({ entryTypes: ['measure'] });
  
  const dataset = generateTestData(testSize);
  
  let uploadedCount = 0;
  dataset.forEach((doc) => {
    const key = Object.keys(doc)[0];
    const value = doc[key];
    
    distribution.perfTest.store.put(value, key, (error) => {
      if (error) {
        console.error("Error uploading data:", error);
        cleanupCluster(localServer);
        return;
      }
      
      uploadedCount++;
      
      if (uploadedCount === dataset.length) {
        console.log("uploaded data, starting mr");
        performance.mark('mapreduce-start');
        
        distribution.perfTest.store.get(null, (error, keys) => {
          distribution.perfTest.mr.exec({ keys, map: mapper, reduce: reducer }, (error, results) => {   
            performance.mark('mapreduce-end');
            performance.measure('MapReduce Execution', 'mapreduce-start', 'mapreduce-end');
            
            mapReduceCompleted = true;
            if (performanceResults) {
              finishBenchmark(performanceResults, localServer);
            }
          });
        });
      }
    });
  });
}

function finishBenchmark(results, localServer) {
  console.log("\n=== MapReduce Performance Metrics ===");
  console.log(`Average latency: ${results.avgLatency} ms/document`);
  console.log(`Throughput: ${results.throughput} documents/second`);
  
  cleanupCluster(localServer);
}

setupAndRun();