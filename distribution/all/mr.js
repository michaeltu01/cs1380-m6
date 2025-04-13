/** @typedef {import("../types").Callback} Callback */

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {any} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {any} key
 * @param {Array} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 */

const distribution = require("../../distribution");
const id = distribution.util.id;

/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

function mr(config) {
  const context = {
    gid: config.gid || 'all',
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   */
  function exec(configuration, cb) {
    const jobId = id.getID(configuration);
    // console.log('mr configuration', configuration);
    
    const mapReduceService = {
      mapper: configuration.map,
      reducer: configuration.reduce,
      
      map: function(keys, storageGroup, intermediateId, callback) {
        if (keys.length === 0) {
          callback(null, []);
          return;
        }
        
        const mappedResults = [];
        let completedCount = 0;
        
        keys.forEach(key => {
          distribution[storageGroup].store.get(key, (err, value) => {
            
            // apply mapper to kvp
            // console.log('this', this);
            // console.log('this.mapper', this.mapper);
            const result = this.mapper(key, value, distribution.util.require);
            // if the result is a pending promise, wait for it to resolve
            if (result instanceof Promise) {
              result.then(res => {
                completedCount++;
                if (Array.isArray(res)) {
                  mappedResults.push(...res);
                } else {
                  mappedResults.push(res);
                }
                
                // once all keys processed, store results
                if (completedCount === keys.length) {
                  const mapResultKey = intermediateId + '_map';
                  distribution.local.store.put(mappedResults, mapResultKey, (putErr) => {
                    callback(putErr, mappedResults);
                  });
                }
              });
              return;
            } 

            completedCount++;
            // collect map results
            if (Array.isArray(result)) {
              mappedResults.push(...result);
            } else {
              mappedResults.push(result);
            }
            
            // once all keys processed, store results
            if (completedCount === keys.length) {
              const mapResultKey = intermediateId + '_map';
              console.log("storing map results, completedCount", completedCount);
              distribution.local.store.put(mappedResults, mapResultKey, (putErr) => {
                callback(putErr, mappedResults);
              });
            }
          });
        });
      },
      
      shuffle: function(storageGroup, intermediateId, callback) {
        const startShuffleTime = process.hrtime();
        console.log(`Starting shuffle for ${intermediateId}...`);
        const mapResultKey = intermediateId + '_map';
        distribution.local.store.get(mapResultKey, (err, mappedData) => {
          if (err) {
            callback(err, {});
            return;
          }
          
          let entriesProcessed = 0;

          // console.log(mappedData);
          
          // group data by keys for reduction
          mappedData.forEach(entry => {
            const key = Object.keys(entry)[0];
            // console.log(`Key: ${key} (line 127)`);
            // console.log(`Entry: `, entry[key]);
            // console.log(`Entry (destructured): `, entry[key][0]);
            // console.log(`Storage group: ${storageGroup}, key: ${key}`);

            if (!distribution[storageGroup]) {
              console.error(`Storage group ${storageGroup} not found`);
            }

            distribution[storageGroup].store.put(entry[key], key, (err, value) => {
              // if (err) {
              //   console.error(`Error storing entry ${key}:`, err);
              // }
              // console.log(`[${storageGroup}] Stored ${key}, ${value}`);
              entriesProcessed++;
              
              if (entriesProcessed === mappedData.length) {
                const endShuffleTime = process.hrtime(startShuffleTime);
                console.log(`Shuffle completed for ${entriesProcessed} entries in ${endShuffleTime[0]}s ${endShuffleTime[1] / 1000000}ms`);
                callback(null, mappedData);
              }
            });
          });

          //if there are no entries, this breaks
        });
      },
      
      reduce: function(groupId, intermediateId, callback) {
        distribution.local.store.get(null, (err, keys) => {
          const startReduceTime = process.hrtime();
          console.log(`Starting reduce for ${keys.length}...`);
          console.log("keys: ", keys);
          if (keys.length === 0) {
            callback(null, null);
            return;
          }
          
          let reducedResults = [];
          let keysProcessed = 0;
          
          keys.forEach(key => {
            distribution.local.store.get(key, (err, values) => {
              console.log(`Reducing ${key}: `, values);
              // apply reducer to grouped values
              const result = this.reducer(key, values);
              reducedResults = reducedResults.concat(result);
              keysProcessed++;
              
              // when all keys processed, return final results
              if (keysProcessed === keys.length) {
                const endReduceTime = process.hrtime(startReduceTime);
                console.log(`Reduce processed ${keysProcessed} in ${endReduceTime[0]}s ${endReduceTime[1] / 1000000}ms`);
                callback(null, reducedResults);
              }
            });
          });
        });
      }
    };
    
    function distributeKeys(keys, nodeGroup) {
      const nodeDistribution = {};
      
      Object.keys(nodeGroup).forEach(nodeId => {
        nodeDistribution[nodeId] = [];
      });
      
      // assign keys to nodes by hashing
      keys.forEach(key => {
        const keyHash = id.getID(key);
        const targetNode = id.naiveHash(keyHash, Object.keys(nodeGroup));
        nodeDistribution[targetNode].push(key);
      });
      
      return nodeDistribution;
    }
    
    const serviceId = 'mr-' + jobId;
    // console.log('mapReduceService', mapReduceService);
    // console.log('mapReduceService mapper', mapReduceService.mapper);
    
    // register service on nodes
    distribution[context.gid].routes.put(mapReduceService, serviceId, () => {
      distribution.local.groups.get(context.gid, (err, nodeGroup) => {
        // distribute keys to nodes
        const keyDistribution = distributeKeys(configuration.keys, nodeGroup);
        const nodeCount = Object.keys(nodeGroup).length;
        let nodesCompleted = 0;
        
        // make map request
        const mapRequest = {
          service: serviceId,
          method: 'map'
        };
        
        for (const nodeId in nodeGroup) {
          const payload = [keyDistribution[nodeId], context.gid, jobId];
          // console.log("sending map request to node", nodeId, payload);
          distribution.local.comm.send(payload, {
            node: nodeGroup[nodeId],
            ...mapRequest
          }, () => {
            // console.log("map request complete for node", nodeId);
            nodesCompleted++;
            
            // when all map operations complete, start shuffle
            if (nodesCompleted === nodeCount) {
              const shuffleRequest = {
                service: serviceId,
                method: 'shuffle'
              };
              // console.log("sending shuffle request for node", nodeId, context.gid, jobId);
              distribution[context.gid].comm.send([context.gid, jobId], shuffleRequest, () => {
                // console.log("shuffle request complete for node", nodeId);
                // after shuffle, reduce
                const reduceRequest = {
                  service: serviceId,
                  method: 'reduce'
                };
                // console.log("sending reduce request for node", nodeId);
                distribution[context.gid].comm.send([context.gid, jobId], reduceRequest, (err, reduceResults) => {
                  const finalResults = [];
                  
                  for (const result of Object.values(reduceResults)) {
                    if (result !== null) {
                      finalResults.push(...result);
                    }
                  }
                  
                  // return final results
                  console.log("finalResults", finalResults);
                  cb(null, finalResults);
                });
              });
            }
          });
        }
      });
    });
  }

  return {exec};
}

module.exports = mr;