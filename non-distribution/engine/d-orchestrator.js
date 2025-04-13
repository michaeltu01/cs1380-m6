const distribution = require("../../distribution");
const id = distribution.util.id;
let mapperFunction = distribution.util.require("./non-distribution/engine/mapper.js");
let reducerFunction = distribution.util.require("./non-distribution/engine/reducer.js");
const queryService = distribution.util.require("./non-distribution/engine/query.js").createQueryService(distribution, distribution.util.require);

function createOrchestrator() {
  // Configure remote nodes
  const remoteN1 = { ip: '18.224.66.224', port: 1236}; // FIXME: public ips of aws node, port 1234 (allow in security group)
  const remoteN2 = { ip: '3.141.197.189', port: 1235};
  const remoteN3 = { ip: '18.116.15.184', port: 1234};
  const indexGroupId = 'indexerGroup';

  const remoteN2local = { ip: '0.0.0.0', port: 1235};
  const remoteN1local = { ip: '0.0.0.0', port: 1236}; // FIXME: public ips of aws node, port 1234 (allow in security group)
  const remoteN3local = { ip: '0.0.0.0', port: 1234};

  // Begin creating the orchestrator
  spawnNodes();

  // Add the nodes to a group + create groups on nodes
  function groupInstantiation() {
    console.log('Creating indexer group...');
    const indexerGroup = {};
    indexerGroup[id.getSID(remoteN1)] = remoteN1;
    indexerGroup[id.getSID(remoteN2)] = remoteN2;
    indexerGroup[id.getSID(remoteN3)] = remoteN3;

    const indexerGroupConfig = {gid: indexGroupId, hash: id.consistentHash};
    distribution.local.groups.put(indexerGroupConfig, indexerGroup, (err) => {
      console.log('Creating indexer group on coordinator and group nodes...');
        if (err) {
          console.error('Error creating indexer group:', err);
          return;
        }
        
        const indexerGroupLocal = {};
        indexerGroupLocal[id.getSID(remoteN1local)] = remoteN1;
        indexerGroupLocal[id.getSID(remoteN2local)] = remoteN2;
        indexerGroupLocal[id.getSID(remoteN3local)] = remoteN3;
        distribution[indexGroupId].groups.put(indexerGroupConfig, indexerGroupLocal, (err) => {
          console.log(`Indexer group "${indexGroupId}" created on coordinator and group nodes`);
          
          //call
          executeIndexing();
        });
    });
  };

  //spawns local nodes (modify when we run on AWS)
  function spawnNodes() {
    distribution.node.start((server) => {
      localServer = server;
      groupInstantiation();
    });
  }

  //call the map reduce
  function executeIndexing() {
    // get URLs to crawl -- for now assume we have a list?
    // const seedURLs = ['https://cs.brown.edu/courses/csci1380/sandbox/1/', 
    //   'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html',
    //   'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/index.html',
    //   'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html',
    //   'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/fact_4/index.html',
    //   'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/fact_3/index.html',
    // ]
    
    // get the seed urls by reading from test-urls.txt
    const fs = require('fs');
    const seedURLs = fs.readFileSync('non-distribution/engine/urls.txt', 'utf8').split('\n');
    // console.log(seedURLs);
    // console.log(mapperFunction)
    const serializedFunction = distribution.util.serialize(mapperFunction);
    const deserializedFunction = distribution.util.deserialize(serializedFunction);
    
    // call MR on each URL
    const startTime = process.hrtime();
    console.log('Starting indexing map-reduce...');
    distribution[indexGroupId].mr.exec({
      keys: seedURLs,
      map: mapperFunction,
      reduce: reducerFunction
    }, (err, localIndexResults) => {
        if (err) {
          console.error('Error executing indexing map-reduce:', err);
        }
        // localIndexResults is an Array<object>
        localIndexResults.forEach((result) => {
          /*
            const out = {};
            out[key] = entries;
            return out;
          */
          Object.entries(result).forEach(([key, value]) => {
            distribution.local.store.put(value, key, (err) => {
              if (err) {
                console.error('Error storing index result:', err);
              }
              // console.log('Index result stored successfully:', key, value);
            });
          });
      });
      const endIndexTime = process.hrtime(startTime);
      console.log(`Indexing completed in ${endIndexTime[0]}s ${endIndexTime[1] / 1000000}ms`);
      console.log('all done');
      // call the cli loop
      const startTimeCLI = process.hrtime();
      console.log('Starting search CLI...');
      queryService.searchIndex("chicken", (err, results) => {
        if (err) {
          console.error('Error searching index:', err);
        } else {
          console.log('Search results:', results)
        }
      });
      const endCLITime = process.hrtime(startTimeCLI);
      console.log(`CLI completed in ${endCLITime[0]}s ${endCLITime[1] / 1000000}ms`);
      localServer.close();
    });
    console.log('exec done');
  }
}

createOrchestrator();
// module.exports = { createOrchestrator };