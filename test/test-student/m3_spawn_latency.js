const distribution = require('../../config.js');
const { performance } = require('perf_hooks');

const basePort = 9001;
function getNodes(callback) {
    return Array(5).fill().map((_, i) => ({
        ip: '127.0.0.1',
        port: basePort + i,
        onStart: callback
    }));
}

let localServer = null;

const callbacks = {
    simple: (server) => console.log('Node started!'),
    
    withMemory: (server) => {
        console.log('Node started with memory usage:', 
            process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
    },
    
    withCounter: (server) => {
        let count = 0;
        server.on('request', () => count++);
    },
    
    withDelay: (server) => {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Node started after delay!');
                resolve();
            }, 100);
        });
    }
};

async function stopNodes(nodes) {
    const remote = {service: 'status', method: 'stop'};
    
    for (const node of nodes) {
        await new Promise((resolve) => {
            remote.node = node;
            distribution.local.comm.send([], remote, (e, v) => resolve());
        });
    }
}

async function measureLaunch(node) {
    const start = performance.now();
    
    await new Promise((resolve) => {
        distribution.local.status.spawn(node, (e, v) => resolve());
    });
    
    return performance.now() - start;
}

async function testCallback(name, callback) {
    const nodes = getNodes(callback);
    
    await stopNodes(nodes);
    
    await new Promise((resolve) => {
        distribution.node.start((server) => {
            localServer = server;
            resolve();
        });
    });

    console.log(`\nTesting "${name}" callback...`);
    const latencies = [];

    for (const node of nodes) {
        const latency = await measureLaunch(node);
        latencies.push(latency);
        console.log(`Node ${node.port} launch time: ${latency.toFixed(2)}ms`);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const totalTime = latencies.reduce((a, b) => a + b, 0);
    const throughput = (nodes.length / totalTime) * 1000; // nodes per second

    console.log('\nResults:');
    console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`Throughput: ${throughput.toFixed(2)} nodes/second`);

    await stopNodes(nodes);
    if (localServer) {
        localServer.close();
    }
    
    return { avgLatency, throughput };
}

async function runAllTests() {
    const results = {};
    
    for (const [name, callback] of Object.entries(callbacks)) {
        results[name] = await testCallback(name, callback);
    }
    
    console.log('\nComparison of all callbacks:');
    console.table(results);
}

runAllTests().catch(console.error);