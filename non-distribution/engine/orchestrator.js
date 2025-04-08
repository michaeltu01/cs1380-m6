// import { mapperFunction } from './mapper.js';
// import { reducerFunction } from './reducer.js';

const distribution = require("../../distribution");
const id = distribution.util.id;
let mapperFunction = distribution.util.require("./non-distribution/engine/mapper.js");
let reducerFunction = distribution.util.require("./non-distribution/engine/reducer.js");

function createOrchestrator() {
  // Configure remote nodes
  // const remoteN1 = {ip: '3.142.77.140', port: 1234}; // FIXME: public ips of aws node, port 1234 (allow in security group)
  // const remoteN2 = {ip: '3.128.188.45', port: 1234};
  // const remoteN3 = {ip: '3.14.28.177', port: 1234};
  console.log('Starting orchestrator...');
  const remoteN1 = {ip: '127.0.0.1', port: 7110};
  // const remoteN2 = {ip: '127.0.0.1', port: 7111};
  // const remoteN3 = {ip: '127.0.0.1', port: 7112};
  const indexGroupId = 'indexerGroup';
  
  // Ensure that the nodes are stopped before attempting to spawn them
  const remote = {service: 'status', method: 'stop'};
  remote.node = remoteN1;
  distribution.local.comm.send([], remote, (e, v) => {
      // remote.node = remoteN2;
      // distribution.local.comm.send([], remote, (e, v) => {
      //     remote.node = remoteN3;
      //     distribution.local.comm.send([], remote, (e, v) => {
              spawnNodes();
          });
  //     });
  // });

  // Add the nodes to a group + create groups on nodes
  function groupInstantiation() {
    console.log('Creating indexer group...');
    const indexerGroup = {};
    indexerGroup[id.getSID(remoteN1)] = remoteN1;
    // indexerGroup[id.getSID(remoteN2)] = remoteN2;
    // indexerGroup[id.getSID(remoteN3)] = remoteN3;

    const indexerGroupConfig = {gid: indexGroupId, hash: id.consistentHash};
    distribution.local.groups.put(indexerGroupConfig, indexerGroup, (err) => {
      console.log('Creating indexer group on coordinator and group nodes...');
        if (err) {
          console.error('Error creating indexer group:', err);
          return;
        }

        distribution[indexGroupId].groups.put(indexerGroupConfig, indexerGroup, (err) => {
          // Do stuff
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

      distribution.local.status.spawn(remoteN1, (e, v) => {
        // distribution.local.status.spawn(remoteN2, (e, v) => {
        //   distribution.local.status.spawn(remoteN3, (e, v) => {
            groupInstantiation();
          });
        });
    //   });
    // });
  }

  //call the map reduce
  function executeIndexing() {
    // get URLs to crawl -- for now assume we have a list?
    const seedURLs = ['https://cs.brown.edu/courses/csci1380/sandbox/1/']
    console.log(mapperFunction)
    const serializedFunction = distribution.util.serialize(mapperFunction);
    // console.log('Serialized function:', serializedFunction);
    const deserializedFunction = distribution.util.deserialize(serializedFunction);
    console.log('Deserialized function:', deserializedFunction);
    // call MR on each URL
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
         let count = 0;
          Object.entries(result).forEach(([key, value]) => {
            distribution.local.store.put(value, key, (err) => {
              if (err) {
                console.error('Error storing index result:', err);
              }
              count++;
              if (count === Object.entries(result).length) {
                console.log("store done");
              }
              console.log('Index result stored successfully:', key, value);
            });
            console.log("entries");
          });
          console.log('Indexing map-reduce executed successfully');
      });
      console.log('all done');
    });
    console.log('exec done');
  }
}

createOrchestrator();
// module.exports = { createOrchestrator };