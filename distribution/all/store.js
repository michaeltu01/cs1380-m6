// get the node responsible for a key
function getNode(context, key, callback) {
  console.log('getNode inputs', context, key);
  // get all nids in the group
  global.distribution[context.gid].status.get('nid', (error, nids) => {
    if (JSON.stringify(error) !== '{}') {
        console.error('Error getting node IDs', JSON.stringify(error));
        callback(null);
        return;
    }

    // console.log(`(${context.gid}) Node IDs`, nids);
    const nodeIds = Object.values(nids);
    // convert key to KID
    const kid = global.distribution.util.id.getID(key);
    console.log(`kid:`, kid);
    // use hash function to get target node ID
    const targetNid = context.hash(kid, nodeIds);
    // get short ID (first 5 chars)
    const sid = targetNid.substring(0, 5);
    
    // look up actual node info from group
    global.distribution.local.groups.get(context.gid, (error, nodes) => {
      if (error) {
        console.error('Error getting nodes', error);
        callback(null); 
        return;
      }
      // console.log(`(local node sees) Nodes`, nodes);
      // console.log(`Returning node for ${sid}`, nodes[sid]);
      callback(nodes[sid]);
    });
  });

  // global.distribution.local.groups.get(context.gid, (error, nodesMap) => {
  //   if (error) {
  //       console.error('Error getting node IDs', error);
  //       callback(null);
  //       return;
  //   }

  //   const nids = Object.values(nodesMap).map(node => global.distribution.util.id.getNID(node));
  //   console.log(`(${context.gid}) Node IDs`, nids);
  //   // convert key to KID
  //   const kid = global.distribution.util.id.getID(key);
  //   console.log(`kid:`, kid);
  //   // use hash function to get target node ID
  //   const targetNid = context.hash(kid, nids);
  //   // get short ID (first 5 chars)
  //   const sid = targetNid.substring(0, 5);
    
  //   console.log(`(local node sees) Nodes`, nodesMap);
  //   console.log(`Returning node for ${sid}`, nodes[sid]);
  //   callback(nodesMap[sid]);
  // });
}

function store(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed store service, the configuration will
          always be a string */
  return {
    get: (configuration, callback) => {
      // if null key -> get all keys
      if (!configuration) {
        const message = [{
          key: null,
          gid: context.gid
        }];
        
        global.distribution[context.gid].comm.send(
          message,
          {
            service: 'store',
            method: 'get'
          },
          (errors, results) => {
            // flatten results from all nodes
            const allKeys = Object.values(results).reduce(
              (acc, keys) => acc.concat(keys), 
              []
            );
            callback(errors, allKeys);
          }
        );
        return;
      }

      const normalizedConfig = {
        key: typeof configuration === 'string' ? configuration : configuration.key,
        gid: context.gid
      };

      getNode(context, normalizedConfig.key, (node) => {
        if (!node) {
          callback(new Error('No node found'));
          return;
        }

        const message = [normalizedConfig];
        const remote = {
          node: node,
          service: 'store',
          method: 'get'
        };

        global.distribution.local.comm.send(message, remote, callback);
      });
    },

    put: (state, configuration, callback) => {
      configuration = configuration || global.distribution.util.id.getID(state);
      
      const normalizedConfig = {
        key: typeof configuration === 'string' ? configuration : configuration.key,
        gid: context.gid
      };

      getNode(context, normalizedConfig.key, (node) => {
        if (!node) {
          callback(new Error('No node found'));
          return;
        }

        const message = [state, normalizedConfig]; 
        const remote = {
          node: node,
          service: 'store',
          method: 'put'
        };

        global.distribution.local.comm.send(message, remote, callback);
      });
    },

    del: (configuration, callback) => {
      const normalizedConfig = {
        key: typeof configuration === 'string' ? configuration : configuration.key,
        gid: context.gid
      };

      getNode(context, configuration, (node) => {
        if (!node) {
          callback(new Error('No node found'));
          return;
        }

        const message = [normalizedConfig];
        const remote = {
          node: node,
          service: 'store', 
          method: 'del'
        };

        global.distribution.local.comm.send(message, remote, callback);
      });
    },

    reconf: (configuration, callback) => {
      global.distribution[context.gid].store.get(null, (errors, keys) => {
        global.distribution[context.gid].status.get('nid', (error, currentNodes) => {
          const currentNids = Object.values(currentNodes);
          const oldNids = Object.values(configuration).map(node => 
            global.distribution.util.id.getNID(node)
          );
          
          let relocatedCount = 0;
          if (keys.length === 0) {
            callback(null);
            return;
          }
    
          for (const key of keys) {
            const kid = global.distribution.util.id.getID(key);
            
            const oldTargetNid = context.hash(kid, oldNids);
            const newTargetNid = context.hash(kid, currentNids);
            
            // if target nodes are different, relocate the object
            if (oldTargetNid !== newTargetNid) {
              // get old node that contains key
              const oldNodeSid = oldTargetNid.substring(0, 5);
              const oldNode = configuration[oldNodeSid];
              
              // delete from old node and put in new node
              const message = [{ key: key, gid: context.gid }];
              const remote = {
                node: oldNode,
                service: 'store',
                method: 'get'
              };
              
              // get object from old node
              global.distribution.local.comm.send(message, remote, (error, value) => {
                if (error) {
                  relocatedCount++;
                  checkCompletion();
                  return;
                }
                
                // delete from old node
                const delMessage = [{ key: key, gid: context.gid }];
                const delRemote = {
                  node: oldNode,
                  service: 'store',
                  method: 'del'
                };
                
                global.distribution.local.comm.send(delMessage, delRemote, (error, result) => {
                  // put in new location
                  global.distribution[context.gid].store.put(value, key, (error, result) => {
                    relocatedCount++;
                    checkCompletion();
                  });
                });
              });
            } else {
              relocatedCount++;
              checkCompletion();
            }
          }
          
          function checkCompletion() {
            if (relocatedCount === keys.length) {
              callback(null);
            }
          }
        });
      });
    },
  };
};

module.exports = store;
