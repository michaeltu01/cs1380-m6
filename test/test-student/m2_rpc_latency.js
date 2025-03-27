// MUST SET DISTRIBUTION TO TRUE IN PACKAGE.JSON

const { performance, PerformanceObserver } = require('perf_hooks');
const distribution = require('../../config.js');

let localServer = null;
const TEST_NODE = {ip: '127.0.0.1', port: 9001};
const NUM_REQUESTS = 1000;

const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    console.log(`Average ${entry.name}: ${entry.duration / NUM_REQUESTS}ms`);
  });
  performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

function testRPCLatency(done) {
  console.log('\nMeasuring RPC latency...');
  
  let n = 0;
  const addOne = () => ++n;
  const addOneRPC = distribution.util.wire.createRPC(
    distribution.util.wire.toAsync(addOne)
  );
  
  const rpcService = {
    addOne: addOneRPC
  };

  // insttall rpc service
  distribution.local.comm.send(
    [rpcService, 'addOneService'],
    {node: TEST_NODE, service: 'routes', method: 'put'},
    (err) => {
      if (err) {
        console.error('Error installing RPC service:', err);
        done();
        return;
      }

      performance.mark('rpc-start');
      
      let completed = 0;
      for (let i = 0; i < NUM_REQUESTS; i++) {
        distribution.local.comm.send(
          [],
          {node: TEST_NODE, service: 'addOneService', method: 'addOne'},
          (err, val) => {
            if (err) {
              console.error('Error in RPC request:', err);
            }
            
            completed++;
            if (completed === NUM_REQUESTS) {
              performance.mark('rpc-end');
              performance.measure('rpc-latency', 'rpc-start', 'rpc-end');
              
              if (n !== NUM_REQUESTS) {
                console.error(`Unexpected final counter value: ${n}, expected ${NUM_REQUESTS}`);
              }
              
              done();
            }
          }
        );
      }
    }
  );
}

distribution.node.start((server) => {
  localServer = server;
  
  // test node for RPC
  distribution.local.status.spawn(TEST_NODE, (err) => {
    if (err) {
      console.error('Error spawning test node:', err);
      cleanup();
      return;
    }

    testRPCLatency(() => {
      cleanup();
    });
  });
});

function cleanup() {
  if (localServer) {
    localServer.close();
  }
  distribution.local.comm.send(
    [],
    {node: TEST_NODE, service: 'status', method: 'stop'},
    () => {
      console.log('\nRPC latency test completed');
    }
  );
}