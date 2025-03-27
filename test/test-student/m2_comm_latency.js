const { performance, PerformanceObserver } = require('perf_hooks');
const distribution = require('../../config.js');
const id = distribution.util.id;

let localServer = null;
const NUM_REQUESTS = 1000;

const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    console.log(`Average ${entry.name}: ${entry.duration / NUM_REQUESTS}ms`);
  });
  performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

function testCommLatency(done) {
  console.log('\nMeasuring comm latency...');
  
  const remote = {
    node: distribution.node.config,
    service: 'status',
    method: 'get'
  };
  const message = ['nid'];

  performance.mark('comm-start');

  let completed = 0;
  for (let i = 0; i < NUM_REQUESTS; i++) {
    distribution.local.comm.send(message, remote, (err, val) => {
      if (err) {
        console.error('Error in comm request:', err);
      } else if (val !== id.getNID(distribution.node.config)) {
        console.error('Unexpected response value');
      }
      
      completed++;
      if (completed === NUM_REQUESTS) {
        performance.mark('comm-end');
        performance.measure('comm-latency', 'comm-start', 'comm-end');
        done();
      }
    });
  }
}

distribution.node.start((server) => {
  localServer = server;
  
  testCommLatency(() => {
    if (localServer) {
      localServer.close();
    }
    console.log('\nComm latency test completed');
  });
});